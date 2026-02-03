import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { type AllMetadataName } from 'twenty-shared/metadata';
import {
  type MetadataRecordCreateEvent,
  type MetadataRecordDeleteEvent,
  type MetadataRecordUpdateEvent,
} from 'twenty-shared/metadata-events';
import { isDefined } from 'twenty-shared/utils';

import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type MetadataEventAction } from 'src/engine/metadata-event-emitter/enums/metadata-event-action.enum';
import { type MetadataEventBatch } from 'src/engine/metadata-event-emitter/types/metadata-event-batch.type';
import { computeMetadataEventName } from 'src/engine/metadata-event-emitter/utils/compute-metadata-event-name.util';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import type { FromToAllFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';
import { WORKSPACE_MIGRATION_ACTION_TYPE } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/constants/workspace-migration-action-type.constant';
import type { AllUniversalWorkspaceMigrationAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';

type MetadataEventInitiatorContext = WorkspaceAuthContext;

type EmitMetadataEventsFromMigrationArgs = {
  actions: AllUniversalWorkspaceMigrationAction[];
  fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  workspaceId: string;
  initiatorContext?: MetadataEventInitiatorContext;
};

type ActionEventMap<T> = {
  created: MetadataRecordCreateEvent<T>;
  updated: MetadataRecordUpdateEvent<T>;
  deleted: MetadataRecordDeleteEvent<T>;
};

export type MetadataBatchEventInput<T, A extends keyof ActionEventMap<T>> = {
  metadataName: AllMetadataName;
  action: A;
  events: ActionEventMap<T>[A][];
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
};

type GroupedEvents = Record<
  string,
  Record<string, ActionEventMap<unknown>[MetadataEventAction][]>
>;

@Injectable()
export class MetadataEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  private emitMetadataBatchEvent<T, A extends keyof ActionEventMap<T>>(
    metadataBatchEventInput: MetadataBatchEventInput<T, A> | undefined,
  ): void {
    if (!isDefined(metadataBatchEventInput)) {
      return;
    }

    const { metadataName, action, events, workspaceId, userId, apiKeyId } =
      metadataBatchEventInput;

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
      apiKeyId,
    };

    this.eventEmitter.emit(eventName, metadataEventBatch);
  }

  public emitMetadataEventsFromMigration({
    actions,
    fromToAllFlatEntityMaps,
    workspaceId,
    initiatorContext,
  }: EmitMetadataEventsFromMigrationArgs): void {
    if (actions.length === 0) {
      return;
    }

    const groupedEvents = this.groupActionsByMetadataNameAndAction(
      actions,
      fromToAllFlatEntityMaps,
    );

    let resolvedInitiatorContext = initiatorContext;

    if (!resolvedInitiatorContext) {
      try {
        resolvedInitiatorContext = getWorkspaceAuthContext();
      } catch {
        resolvedInitiatorContext = undefined;
      }
    }

    this.emitGroupedEvents(
      groupedEvents,
      workspaceId,
      resolvedInitiatorContext,
    );
  }

  private emitGroupedEvents(
    groupedEvents: GroupedEvents,
    workspaceId: string,
    initiatorContext?: MetadataEventInitiatorContext,
  ): void {
    const userId =
      initiatorContext?.type === 'user' ||
      initiatorContext?.type === 'pendingActivationUser'
        ? initiatorContext.user.id
        : undefined;
    const apiKeyId =
      initiatorContext?.type === 'apiKey'
        ? initiatorContext.apiKey.id
        : undefined;

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
          userId,
          apiKeyId,
        });
      }
    }
  }

  private groupActionsByMetadataNameAndAction(
    actions: AllUniversalWorkspaceMigrationAction[],
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
        created: [],
        updated: [],
        deleted: [],
      };
    }
  }

  private processAction(
    action: AllUniversalWorkspaceMigrationAction,
    metadataName: AllMetadataName,
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps,
    result: GroupedEvents,
  ): void {
    if (action.type === WORKSPACE_MIGRATION_ACTION_TYPE.create) {
      this.processCreateAction(
        action,
        metadataName,
        fromToAllFlatEntityMaps,
        result,
      );

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
    action: AllUniversalWorkspaceMigrationAction<'create'>,
    metadataName: AllMetadataName,
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps,
    result: GroupedEvents,
  ): void {
    const flatMapsKey = getMetadataFlatEntityMapsKey(metadataName);
    const fromTo = fromToAllFlatEntityMaps[flatMapsKey];

    if (!isDefined(fromTo)) {
      return;
    }

    if ('flatEntity' in action && isDefined(action.flatEntity)) {
      const universalIdentifier =
        'universalIdentifier' in action.flatEntity
          ? action.flatEntity.universalIdentifier
          : undefined;

      if (isDefined(universalIdentifier)) {
        const createdId =
          fromTo.to.idByUniversalIdentifier[universalIdentifier];

        if (isDefined(createdId)) {
          const created = fromTo.to.byId[createdId];

          if (isDefined(created)) {
            const createEvent: MetadataRecordCreateEvent = {
              recordId: created.id,
              properties: { after: created },
            };

            result[metadataName].created.push(createEvent);
          }
        }
      }
    }

    this.processBundledFieldMetadatas(action, fromToAllFlatEntityMaps, result);
  }

  private processBundledFieldMetadatas(
    action: AllUniversalWorkspaceMigrationAction,
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps,
    result: GroupedEvents,
  ): void {
    const fieldMetadatas =
      'universalFlatFieldMetadatas' in action
        ? action.universalFlatFieldMetadatas
        : 'flatFieldMetadatas' in action
          ? action.flatFieldMetadatas
          : undefined;

    if (!isDefined(fieldMetadatas) || !Array.isArray(fieldMetadatas)) {
      return;
    }

    const fieldFromTo = fromToAllFlatEntityMaps['flatFieldMetadataMaps'];

    if (!isDefined(fieldFromTo)) {
      return;
    }

    this.ensureMetadataNameInitialized(result, 'fieldMetadata');

    for (const flatFieldMetadata of fieldMetadatas) {
      const universalIdentifier =
        'universalIdentifier' in flatFieldMetadata
          ? flatFieldMetadata.universalIdentifier
          : undefined;

      if (!isDefined(universalIdentifier)) {
        continue;
      }

      const createdId =
        fieldFromTo.to.idByUniversalIdentifier[universalIdentifier];

      if (!isDefined(createdId)) {
        continue;
      }

      const created = fieldFromTo.to.byId[createdId];

      if (!isDefined(created)) {
        continue;
      }

      const createEvent: MetadataRecordCreateEvent = {
        recordId: created.id,
        properties: { after: created },
      };

      result['fieldMetadata'].created.push(createEvent);
    }
  }

  private processUpdateAction(
    action: AllUniversalWorkspaceMigrationAction<'update'>,
    metadataName: AllMetadataName,
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps,
    result: GroupedEvents,
  ): void {
    const flatMapsKey = getMetadataFlatEntityMapsKey(metadataName);
    const fromTo = fromToAllFlatEntityMaps[flatMapsKey];

    if (!isDefined(fromTo)) {
      return;
    }

    const universalIdentifier =
      'universalIdentifier' in action ? action.universalIdentifier : undefined;

    let entityId: string | undefined;

    if (isDefined(universalIdentifier)) {
      entityId = fromTo.from.idByUniversalIdentifier[universalIdentifier];
    } else if ('entityId' in action && isDefined(action.entityId)) {
      entityId = action.entityId;
    }

    if (!isDefined(entityId)) {
      return;
    }

    const before = fromTo.from.byId[entityId];
    const after = fromTo.to.byId[entityId];

    if (!isDefined(before) || !isDefined(after)) {
      return;
    }

    const updatedFields = this.computeUpdatedFields(before, after);
    const diff = this.computeDiff(before, after, updatedFields);

    const updateEvent: MetadataRecordUpdateEvent = {
      recordId: entityId,
      properties: { before, after, updatedFields, diff },
    };

    result[metadataName].updated.push(updateEvent);
  }

  private processDeleteAction(
    action: AllUniversalWorkspaceMigrationAction<'delete'>,
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

    if (!isDefined(fromTo)) {
      return;
    }

    const deletedId = fromTo.from.idByUniversalIdentifier[universalIdentifier];

    if (!isDefined(deletedId)) {
      return;
    }

    const deleted = fromTo.from.byId[deletedId];

    if (!isDefined(deleted)) {
      return;
    }

    const deleteEvent: MetadataRecordDeleteEvent = {
      recordId: deleted.id,
      properties: { before: deleted },
    };

    result[metadataName].deleted.push(deleteEvent);
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
