import { InjectRepository } from '@nestjs/typeorm';

import chunk from 'lodash.chunk';
import { type MetadataRecordEvent } from 'twenty-shared/metadata-events';
import { ArrayContains, IsNull, type Repository } from 'typeorm';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { type MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type MetadataEventBatch } from 'src/engine/metadata-event-emitter/types/metadata-event-batch.type';
import { WebhookEntity } from 'src/engine/metadata-modules/webhook/entities/webhook.entity';
import {
  CallWebhookJob,
  type CallWebhookJobData,
} from 'src/engine/metadata-modules/webhook/jobs/call-webhook.job';

const WEBHOOK_JOBS_CHUNK_SIZE = 20;

@Processor(MessageQueue.webhookQueue)
export class CallWebhookJobsForMetadataJob {
  constructor(
    @InjectMessageQueue(MessageQueue.webhookQueue)
    private readonly messageQueueService: MessageQueueService,
    @InjectRepository(WebhookEntity)
    private readonly webhookRepository: Repository<WebhookEntity>,
  ) {}

  @Process(CallWebhookJobsForMetadataJob.name)
  async handle(metadataEventBatch: MetadataEventBatch): Promise<void> {
    const eventName = metadataEventBatch.name;
    const metadataName = metadataEventBatch.metadataName;
    const operation = metadataEventBatch.action;

    const operations = [
      eventName,
      `metadata.${metadataName}.*`,
      `metadata.*.${operation}`,
      `metadata.*.*`,
      '*.*',
    ];

    const webhooks = await this.webhookRepository.find({
      where: operations.map((op) => ({
        workspaceId: metadataEventBatch.workspaceId,
        operations: ArrayContains([op]),
        deletedAt: IsNull(),
      })),
    });

    if (webhooks.length === 0) {
      return;
    }

    const webhookEvents = this.transformMetadataEventBatchToWebhookEvents({
      metadataEventBatch,
      webhooks,
    });

    const webhookEventsChunks = chunk(webhookEvents, WEBHOOK_JOBS_CHUNK_SIZE);

    for (const webhookEventsChunk of webhookEventsChunks) {
      await this.messageQueueService.add<CallWebhookJobData[]>(
        CallWebhookJob.name,
        webhookEventsChunk,
        { retryLimit: 3 },
      );
    }
  }

  private transformMetadataEventBatchToWebhookEvents({
    metadataEventBatch,
    webhooks,
  }: {
    metadataEventBatch: MetadataEventBatch;
    webhooks: WebhookEntity[];
  }): CallWebhookJobData[] {
    const result: CallWebhookJobData[] = [];

    for (const webhook of webhooks) {
      const targetUrl = webhook.targetUrl;
      const eventName = metadataEventBatch.name;
      const workspaceId = metadataEventBatch.workspaceId;
      const webhookId = webhook.id;
      const eventDate = new Date();
      const secret = webhook.secret;

      for (const eventData of metadataEventBatch.events) {
        const record = this.getRecordFromEvent(eventData);

        result.push({
          targetUrl,
          eventName,
          objectMetadata: {
            id: eventData.recordId,
            nameSingular: metadataEventBatch.metadataName,
          },
          workspaceId,
          webhookId,
          eventDate,
          record,
          ...(this.getUpdatedFieldsFromEvent(eventData) && {
            updatedFields: this.getUpdatedFieldsFromEvent(eventData),
          }),
          secret,
          userId: metadataEventBatch.userId,
          apiKeyId: metadataEventBatch.apiKeyId,
        });
      }
    }

    return result;
  }

  private getRecordFromEvent(
    event: MetadataRecordEvent,
  ): Record<string, unknown> {
    if ('after' in event.properties && event.properties.after) {
      return event.properties.after as Record<string, unknown>;
    }
    if ('before' in event.properties && event.properties.before) {
      return event.properties.before as Record<string, unknown>;
    }

    return {};
  }

  private getUpdatedFieldsFromEvent(
    event: MetadataRecordEvent,
  ): string[] | undefined {
    if ('updatedFields' in event.properties) {
      return event.properties.updatedFields;
    }

    return undefined;
  }
}
