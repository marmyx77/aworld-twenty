import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { computeMetadataEventName } from 'twenty-shared/metadata-events';
import { isDefined } from 'twenty-shared/utils';

import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type MetadataEventBatch } from 'src/engine/metadata-event-emitter/types/metadata-event-batch.type';
import { type RunnerMetadataEventEnvelope } from 'src/engine/metadata-event-emitter/types/runner-metadata-event-envelope.type';

type EmitMetadataEventsArgs = {
  metadataEvents: RunnerMetadataEventEnvelope[];
  workspaceId: string;
  initiatorContext?: WorkspaceAuthContext;
};

@Injectable()
export class MetadataEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  public emitMetadataEvents({
    metadataEvents,
    workspaceId,
    initiatorContext,
  }: EmitMetadataEventsArgs): void {
    if (metadataEvents.length === 0) {
      return;
    }

    const resolvedInitiatorContext =
      this.resolveInitiatorContext(initiatorContext);

    const userId =
      resolvedInitiatorContext?.type === 'user' ||
      resolvedInitiatorContext?.type === 'pendingActivationUser'
        ? resolvedInitiatorContext.user.id
        : undefined;
    const apiKeyId =
      resolvedInitiatorContext?.type === 'apiKey'
        ? resolvedInitiatorContext.apiKey.id
        : undefined;

    const grouped = this.groupByMetadataNameAndAction(metadataEvents);

    for (const envelopes of grouped.values()) {
      const firstEnvelope = envelopes[0];

      if (!isDefined(firstEnvelope)) {
        continue;
      }

      const { metadataName, action } = firstEnvelope;
      const eventName = computeMetadataEventName(metadataName, action);

      const metadataEventBatch: MetadataEventBatch = {
        name: eventName,
        workspaceId,
        metadataName,
        action,
        events: envelopes.map((envelope) => envelope.event),
        userId,
        apiKeyId,
      };

      this.eventEmitter.emit(eventName, metadataEventBatch);
    }
  }

  private resolveInitiatorContext(
    initiatorContext?: WorkspaceAuthContext,
  ): WorkspaceAuthContext | undefined {
    if (isDefined(initiatorContext)) {
      return initiatorContext;
    }

    try {
      return getWorkspaceAuthContext();
    } catch {
      return undefined;
    }
  }

  private groupByMetadataNameAndAction(
    metadataEvents: RunnerMetadataEventEnvelope[],
  ): Map<string, RunnerMetadataEventEnvelope[]> {
    const grouped = new Map<string, RunnerMetadataEventEnvelope[]>();

    for (const metadataEvent of metadataEvents) {
      const key = `${metadataEvent.metadataName}.${metadataEvent.action}`;
      const group = grouped.get(key);

      if (isDefined(group)) {
        group.push(metadataEvent);
      } else {
        grouped.set(key, [metadataEvent]);
      }
    }

    return grouped;
  }
}
