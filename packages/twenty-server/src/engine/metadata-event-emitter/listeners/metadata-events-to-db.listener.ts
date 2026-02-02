import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  type MetadataRecordCreateEvent,
  type MetadataRecordDeleteEvent,
  type MetadataRecordEvent,
  type MetadataRecordUpdateEvent,
} from 'twenty-shared/metadata-events';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type MetadataEventBatch } from 'src/engine/metadata-event-emitter/types/metadata-event-batch.type';
import { CallWebhookJobsForMetadataJob } from 'src/engine/metadata-modules/webhook/jobs/call-webhook-jobs-for-metadata.job';

@Injectable()
export class MetadataEventsToDbListener {
  constructor(
    @InjectMessageQueue(MessageQueue.webhookQueue)
    private readonly webhookQueueService: MessageQueueService,
  ) {}

  @OnEvent('metadata.*.created')
  async handleCreate(
    metadataEventBatch: MetadataEventBatch<MetadataRecordCreateEvent>,
  ): Promise<void> {
    return this.handleEvent(metadataEventBatch);
  }

  @OnEvent('metadata.*.updated')
  async handleUpdate(
    metadataEventBatch: MetadataEventBatch<MetadataRecordUpdateEvent>,
  ): Promise<void> {
    return this.handleEvent(metadataEventBatch);
  }

  @OnEvent('metadata.*.deleted')
  async handleDelete(
    metadataEventBatch: MetadataEventBatch<MetadataRecordDeleteEvent>,
  ): Promise<void> {
    return this.handleEvent(metadataEventBatch);
  }

  private async handleEvent(
    metadataEventBatch: MetadataEventBatch<MetadataRecordEvent>,
  ): Promise<void> {
    await this.webhookQueueService.add<MetadataEventBatch<MetadataRecordEvent>>(
      CallWebhookJobsForMetadataJob.name,
      metadataEventBatch,
      { retryLimit: 3 },
    );
  }
}
