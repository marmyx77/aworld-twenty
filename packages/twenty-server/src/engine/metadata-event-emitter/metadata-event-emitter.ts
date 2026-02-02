import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { type AllMetadataName } from 'twenty-shared/metadata';
import {
  type MetadataRecordCreateEvent,
  type MetadataRecordDeleteEvent,
  type MetadataRecordUpdateEvent,
} from 'twenty-shared/metadata-events';
import { isDefined } from 'twenty-shared/utils';

import { MetadataEventAction } from 'src/engine/metadata-event-emitter/enums/metadata-event-action.enum';
import { type MetadataEventBatch } from 'src/engine/metadata-event-emitter/types/metadata-event-batch.type';
import { computeMetadataEventName } from 'src/engine/metadata-event-emitter/utils/compute-metadata-event-name.util';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import type { FromToAllFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';
import { WORKSPACE_MIGRATION_ACTION_TYPE } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/constants/workspace-migration-action-type.constant';
import type { WorkspaceMigrationAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';

type MetadataEventActorContext = {
  userId?: string;
  workspaceMemberId?: string;
};

type EmitMetadataEventsFromMigrationArgs = {
  actions: WorkspaceMigrationAction[];
  fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  workspaceId: string;
  actorContext?: MetadataEventActorContext;
};

type ActionEventMap<T> = {
  [MetadataEventAction.CREATED]: MetadataRecordCreateEvent<T>;
  [MetadataEventAction.UPDATED]: MetadataRecordUpdateEvent<T>;
  [MetadataEventAction.DELETED]: MetadataRecordDeleteEvent<T>;
};

export type MetadataBatchEventInput<T, A extends keyof ActionEventMap<T>> = {
  metadataName: AllMetadataName;
  action: A;
  events: ActionEventMap<T>[A][];
  workspaceId: string;
  userId?: string;
  workspaceMemberId?: string;
};

type GroupedEvents = Record<
  string,
  Record<string, ActionEventMap<unknown>[MetadataEventAction][]>
>;

@Injectable()
export class MetadataEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  public emitMetadataBatchEvent<T, A extends keyof ActionEventMap<T>>(
    metadataBatchEventInput: MetadataBatchEventInput<T, A> | undefined,
  ): void {
    if (!isDefined(metadataBatchEventInput)) {
      return;
    }

    const {
      metadataName,
      action,
      events,
      workspaceId,
      userId,
      workspaceMemberId,
    } = metadataBatchEventInput;

    if (events.length === 0) {
      return;
    }

    const eventName = computeMetadataEventName(metadataName, action);

    const metadataEventBatch: MetadataEventBatch<ActionEventMap<T>[A]> = {
      name: eventName,
      workspaceId,
      metadataName,
      events,
      userId,
      workspaceMemberId,
    };

    this.eventEmitter.emit(eventName, metadataEventBatch);
  }

  public emitMetadataEventsFromMigration({
    actions,
    fromToAllFlatEntityMaps,
    workspaceId,
    actorContext,
  }: EmitMetadataEventsFromMigrationArgs): void {
    if (actions.length === 0) {
      return;
    }

    const groupedEvents = this.groupActionsByMetadataNameAndAction(
      actions,
      fromToAllFlatEntityMaps,
    );

    this.emitGroupedEvents(groupedEvents, workspaceId, actorContext);
  }

  private emitGroupedEvents(
    groupedEvents: GroupedEvents,
    workspaceId: string,
    actorContext?: MetadataEventActorContext,
  ): void {
    for (const [metadataName, actionEvents] of Object.entries(groupedEvents)) {
      for (const [action, events] of Object.entries(actionEvents)) {
        if (events.length === 0) {
          continue;
        }

        this.emitMetadataBatchEvent({
          metadataName: metadataName as AllMetadataName,
          action: action as MetadataEventAction,
          events,
          workspaceId,
          userId: actorContext?.userId,
          workspaceMemberId: actorContext?.workspaceMemberId,
        });
      }
    }
  }

  private groupActionsByMetadataNameAndAction(
    actions: WorkspaceMigrationAction[],
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps,
  ): GroupedEvents {
    const result: GroupedEvents = {};

    for (const action of actions) {
      const metadataName = action.metadataName;

      this.ensureMetadataNameInitialized(result, metadataName);
      this.processAction(action, metadataName, fromToAllFlatEntityMaps, result);
    }

    return result;
  }

  private ensureMetadataNameInitialized(
    result: GroupedEvents,
    metadataName: AllMetadataName,
  ): void {
    if (!result[metadataName]) {
      result[metadataName] = {
        [MetadataEventAction.CREATED]: [],
        [MetadataEventAction.UPDATED]: [],
        [MetadataEventAction.DELETED]: [],
      };
    }
  }

  private processAction(
    action: WorkspaceMigrationAction,
    metadataName: AllMetadataName,
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps,
    result: GroupedEvents,
  ): void {
    if (action.type === WORKSPACE_MIGRATION_ACTION_TYPE.create) {
      this.processCreateAction(action, metadataName, result);

      return;
    }

    if (action.type === WORKSPACE_MIGRATION_ACTION_TYPE.update) {
      this.processUpdateAction(
        action,
        metadataName,
        fromToAllFlatEntityMaps,
        result,
      );

      return;
    }

    if (action.type === WORKSPACE_MIGRATION_ACTION_TYPE.delete) {
      this.processDeleteAction(
        action,
        metadataName,
        fromToAllFlatEntityMaps,
        result,
      );
    }
  }

  private processCreateAction(
    action: WorkspaceMigrationAction,
    metadataName: AllMetadataName,
    result: GroupedEvents,
  ): void {
    if ('flatEntity' in action && isDefined(action.flatEntity)) {
      const createEvent: MetadataRecordCreateEvent = {
        recordId: action.flatEntity.id,
        properties: { after: action.flatEntity },
      };

      result[metadataName][MetadataEventAction.CREATED].push(createEvent);

      return;
    }

    if (
      'flatFieldMetadatas' in action &&
      isDefined(action.flatFieldMetadatas)
    ) {
      for (const flatFieldMetadata of action.flatFieldMetadatas) {
        const createEvent: MetadataRecordCreateEvent = {
          recordId: flatFieldMetadata.id,
          properties: { after: flatFieldMetadata },
        };

        result[metadataName][MetadataEventAction.CREATED].push(createEvent);
      }
    }
  }

  private processUpdateAction(
    action: WorkspaceMigrationAction,
    metadataName: AllMetadataName,
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps,
    result: GroupedEvents,
  ): void {
    const entityId = 'entityId' in action ? action.entityId : undefined;

    if (!isDefined(entityId)) {
      return;
    }

    const flatMapsKey = getMetadataFlatEntityMapsKey(metadataName);
    const fromTo = fromToAllFlatEntityMaps[flatMapsKey];
    const before = fromTo?.from?.byId?.[entityId];
    const after = fromTo?.to?.byId?.[entityId];

    if (!isDefined(before) || !isDefined(after)) {
      return;
    }

    const updatedFields = this.computeUpdatedFields(before, after);
    const diff = this.computeDiff(before, after, updatedFields);

    const updateEvent: MetadataRecordUpdateEvent = {
      recordId: entityId,
      properties: { before, after, updatedFields, diff },
    };

    result[metadataName][MetadataEventAction.UPDATED].push(updateEvent);
  }

  private processDeleteAction(
    action: WorkspaceMigrationAction,
    metadataName: AllMetadataName,
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps,
    result: GroupedEvents,
  ): void {
    const universalIdentifier =
      'universalIdentifier' in action ? action.universalIdentifier : undefined;

    if (!isDefined(universalIdentifier)) {
      return;
    }

    const flatMapsKey = getMetadataFlatEntityMapsKey(metadataName);
    const fromTo = fromToAllFlatEntityMaps[flatMapsKey];
    const deletedId =
      fromTo?.from?.idByUniversalIdentifier?.[universalIdentifier];

    if (!isDefined(deletedId)) {
      return;
    }

    const deleted = fromTo?.from?.byId?.[deletedId];

    if (!isDefined(deleted)) {
      return;
    }

    const deleteEvent: MetadataRecordDeleteEvent = {
      recordId: deleted.id,
      properties: { before: deleted },
    };

    result[metadataName][MetadataEventAction.DELETED].push(deleteEvent);
  }

  private computeUpdatedFields(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ): string[] {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    return [...allKeys].filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
    );
  }

  private computeDiff(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    updatedFields: string[],
  ): Record<string, { before: unknown; after: unknown }> {
    return updatedFields.reduce(
      (diff, field) => {
        diff[field] = { before: before[field], after: after[field] };

        return diff;
      },
      {} as Record<string, { before: unknown; after: unknown }>,
    );
  }
}
