import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  ALL_METADATA_NAME,
  type AllMetadataName,
} from 'twenty-shared/metadata';
import { assertUnreachable, isDefined } from 'twenty-shared/utils';

import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type MetadataEventAction } from 'src/engine/metadata-event-emitter/enums/metadata-event-action.enum';
import {
  type MetadataEventBatch,
  type MetadataRecordEventByAction,
} from 'src/engine/metadata-event-emitter/types/metadata-event-batch.type';
import { computeMetadataEventName } from 'src/engine/metadata-event-emitter/utils/compute-metadata-event-name.util';
import { MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import type { FromToAllFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';
import { WorkspaceMigration } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration';
import type { AllUniversalWorkspaceMigrationAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';
import {
  MetadataRecordCreateEvent,
  MetadataRecordDeleteEvent,
  MetadataRecordUpdateEvent,
} from 'twenty-shared/metadata-events';

type MetadataEventInitiatorContext = WorkspaceAuthContext;

type EmitMetadataEventsFromMigrationArgs = {
  workspaceMigration: WorkspaceMigration;
  fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  workspaceId: string;
  initiatorContext?: MetadataEventInitiatorContext;
};

export type MetadataBatchEventInput<
  TMetadataName extends AllMetadataName,
  A extends keyof MetadataRecordEventByAction<TMetadataName>,
> = {
  metadataName: TMetadataName;
  action: A;
  events: MetadataRecordEventByAction<TMetadataName>[A][];
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
};

type GroupedMetadataEvents = {
  [P in AllMetadataName]: {
    create: MetadataRecordCreateEvent<MetadataFlatEntity<P>>[];
    update: MetadataRecordUpdateEvent<MetadataFlatEntity<P>>[];
    delete: MetadataRecordDeleteEvent<MetadataFlatEntity<P>>[];
  };
};

type MetadataCreateEventWithMetadataName = {
  metadataName: AllMetadataName;
  event: MetadataRecordCreateEvent<MetadataFlatEntity<AllMetadataName>>;
};

type MetadataUpdateEventWithMetadataName = {
  metadataName: AllMetadataName;
  event: MetadataRecordUpdateEvent<MetadataFlatEntity<AllMetadataName>>;
};

type MetadataDeleteEventWithMetadataName = {
  metadataName: AllMetadataName;
  event: MetadataRecordDeleteEvent<MetadataFlatEntity<AllMetadataName>>;
};

const getEmptyGroupedEvents = (): GroupedMetadataEvents => {
  return Object.values(ALL_METADATA_NAME).reduce(
    (acc, metadataName) => ({
      ...acc,
      [metadataName]: {
        created: [],
        updated: [],
        deleted: [],
      },
    }),
    {} as GroupedMetadataEvents,
  );
};

@Injectable()
export class MetadataEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  private emitMetadataBatchEvent<
    TMetadataName extends AllMetadataName,
    A extends keyof MetadataRecordEventByAction<TMetadataName>,
  >(
    metadataBatchEventInput:
      | MetadataBatchEventInput<TMetadataName, A>
      | undefined,
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

    const metadataEventBatch: MetadataEventBatch<TMetadataName, A> = {
      name: eventName,
      workspaceId,
      metadataName,
      action,
      events,
      userId,
      apiKeyId,
    };

    this.eventEmitter.emit(eventName, metadataEventBatch);
  }

  public emitMetadataEventsFromMigration({
    workspaceMigration: { actions, workspaceId },
    fromToAllFlatEntityMaps,
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
    groupedEvents: GroupedMetadataEvents,
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

        const typedMetadataName = metadataName as AllMetadataName;
        const typedAction = action as MetadataEventAction;

        this.emitMetadataBatchEvent({
          metadataName: typedMetadataName,
          action: typedAction,
          events: events as MetadataRecordEventByAction<
            typeof typedMetadataName
          >[typeof typedAction][],
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
  ): GroupedMetadataEvents {
    const result = getEmptyGroupedEvents();

    for (const action of actions) {
      switch (action.type) {
        case 'create': {
          const metadataCreateEvents =
            this.fromWorkspaceMigrationCreateActionToMetadataEvent({
              action,
              fromToAllFlatEntityMaps,
            });

          for (const { metadataName, event } of metadataCreateEvents) {
            result[metadataName].create.push(event);
          }
          continue;
        }
        case 'update': {
          const updateEvent =
            this.fromWorkspaceMigrationUpdateActionToMetadataEvent({
              action,
              fromToAllFlatEntityMaps,
            });

          if (isDefined(updateEvent)) {
            result[updateEvent.metadataName].update.push(updateEvent.event);
          }
          continue;
        }
        case 'delete': {
          const deleteEvent =
            this.fromWorkspaceMigrationDeleteActionToMetadataEvent({
              action,
              fromToAllFlatEntityMaps,
            });

          if (isDefined(deleteEvent)) {
            result[deleteEvent.metadataName].delete.push(deleteEvent.event);
          }
          continue;
        }
        default: {
          assertUnreachable(action);
        }
      }
    }

    return result;
  }

  private fromWorkspaceMigrationCreateActionToMetadataEvent({
    action,
    fromToAllFlatEntityMaps,
  }: {
    action: AllUniversalWorkspaceMigrationAction<'create'>;
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  }): MetadataCreateEventWithMetadataName[] {
    switch (action.metadataName) {
      case 'objectMetadata': {
        const { universalFlatFieldMetadatas, flatEntity } = action;

        const fieldCreateMetadataEvents = this.buildFieldMetadataCreateEvents({
          universalFlatFieldMetadatas,
          fromToAllFlatEntityMaps,
        });

        const objectCreateMetadataEvent =
          this.buildFlatEntityMetadataCreateEvent({
            metadataName: 'objectMetadata',
            flatEntity,
            fromToAllFlatEntityMaps,
          });

        return isDefined(objectCreateMetadataEvent)
          ? [...fieldCreateMetadataEvents, objectCreateMetadataEvent]
          : fieldCreateMetadataEvents;
      }
      case 'fieldMetadata': {
        const { universalFlatFieldMetadatas } = action;
        const fieldCreateMetadataEvents = this.buildFieldMetadataCreateEvents({
          fromToAllFlatEntityMaps,
          universalFlatFieldMetadatas,
        });
        return fieldCreateMetadataEvents;
      }
      case 'view':
      case 'viewField':
      case 'viewGroup':
      case 'rowLevelPermissionPredicate':
      case 'rowLevelPermissionPredicateGroup':
      case 'viewFilterGroup':
      case 'index':
      case 'logicFunction':
      case 'viewFilter':
      case 'role':
      case 'roleTarget':
      case 'agent':
      case 'skill':
      case 'pageLayout':
      case 'pageLayoutWidget':
      case 'pageLayoutTab':
      case 'commandMenuItem':
      case 'navigationMenuItem':
      case 'frontComponent':
      case 'webhook': {
        const { flatEntity } = action;

        const createMetadataEvent = this.buildFlatEntityMetadataCreateEvent({
          metadataName: action.metadataName,
          flatEntity,
          fromToAllFlatEntityMaps,
        });

        return isDefined(createMetadataEvent) ? [createMetadataEvent] : [];
      }
      default:
        assertUnreachable(action);
    }
  }

  private buildFieldMetadataCreateEvents({
    universalFlatFieldMetadatas,
    fromToAllFlatEntityMaps,
  }: {
    universalFlatFieldMetadatas: { universalIdentifier: string }[];
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  }): MetadataCreateEventWithMetadataName[] {
    const fieldFromTo = fromToAllFlatEntityMaps['flatFieldMetadataMaps'];

    if (!isDefined(fieldFromTo)) {
      return [];
    }

    const events: MetadataCreateEventWithMetadataName[] = [];

    for (const flatFieldMetadata of universalFlatFieldMetadatas) {
      const { universalIdentifier } = flatFieldMetadata;

      const createdId =
        fieldFromTo.to.idByUniversalIdentifier[universalIdentifier];

      if (!isDefined(createdId)) {
        continue;
      }

      const created = fieldFromTo.to.byId[createdId];

      if (!isDefined(created)) {
        continue;
      }

      events.push({
        metadataName: 'fieldMetadata',
        event: {
          type: 'create',
          recordId: created.id,
          properties: { after: created },
        },
      });
    }

    return events;
  }

  private buildFlatEntityMetadataCreateEvent({
    metadataName,
    flatEntity,
    fromToAllFlatEntityMaps,
  }: {
    metadataName: AllMetadataName;
    flatEntity: { universalIdentifier: string };
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  }): MetadataCreateEventWithMetadataName | undefined {
    const flatMapsKey = getMetadataFlatEntityMapsKey(metadataName);
    const fromTo = fromToAllFlatEntityMaps[flatMapsKey];

    if (!isDefined(fromTo)) {
      return undefined;
    }

    const { universalIdentifier } = flatEntity;

    const createdId = fromTo.to.idByUniversalIdentifier[universalIdentifier];

    if (!isDefined(createdId)) {
      return undefined;
    }

    const created = fromTo.to.byId[createdId];

    if (!isDefined(created)) {
      return undefined;
    }

    return {
      metadataName,
      event: {
        type: 'create',
        recordId: created.id,
        properties: { after: created },
      },
    };
  }

  private fromWorkspaceMigrationUpdateActionToMetadataEvent({
    action,
    fromToAllFlatEntityMaps,
  }: {
    action: AllUniversalWorkspaceMigrationAction<'update'>;
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  }): MetadataUpdateEventWithMetadataName | undefined {
    switch (action.metadataName) {
      // Universal workspace migration migrated
      case 'objectMetadata':
      case 'fieldMetadata': {
        return this.buildEntityUpdateEvent({
          metadataName: action.metadataName,
          universalIdentifier: action.universalIdentifier,
          fromToAllFlatEntityMaps,
        });
      }
      case 'view':
      case 'viewField':
      case 'viewGroup':
      case 'rowLevelPermissionPredicate':
      case 'rowLevelPermissionPredicateGroup':
      case 'viewFilterGroup':
      case 'index':
      case 'logicFunction':
      case 'viewFilter':
      case 'role':
      case 'roleTarget':
      case 'agent':
      case 'skill':
      case 'pageLayout':
      case 'pageLayoutWidget':
      case 'pageLayoutTab':
      case 'commandMenuItem':
      case 'navigationMenuItem':
      case 'frontComponent':
      case 'webhook': {
        const { entityId } = action;
        const flatMapsKey = getMetadataFlatEntityMapsKey(action.metadataName);
        const fromTo = fromToAllFlatEntityMaps[flatMapsKey];

        if (!isDefined(fromTo)) {
          return undefined;
        }
        const universalIdentifier =
          fromTo.from.byId[entityId]?.universalIdentifier;

        if (!isDefined(universalIdentifier)) {
          return undefined;
        }

        return this.buildEntityUpdateEvent({
          metadataName: action.metadataName,
          universalIdentifier,
          fromToAllFlatEntityMaps,
        });
      }
      default:
        assertUnreachable(action);
    }
  }

  private buildEntityUpdateEvent({
    metadataName,
    universalIdentifier,
    fromToAllFlatEntityMaps,
  }: {
    metadataName: AllMetadataName;
    universalIdentifier: string;
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  }): MetadataUpdateEventWithMetadataName | undefined {
    const flatMapsKey = getMetadataFlatEntityMapsKey(metadataName);
    const fromTo = fromToAllFlatEntityMaps[flatMapsKey];

    if (!isDefined(fromTo)) {
      return undefined;
    }

    const entityId = fromTo.from.idByUniversalIdentifier[universalIdentifier];

    if (!isDefined(entityId)) {
      return undefined;
    }

    const before = fromTo.from.byId[entityId];
    const after = fromTo.to.byId[entityId];

    if (!isDefined(before) || !isDefined(after)) {
      return undefined;
    }

    const updatedFields = this.computeUpdatedFields(before, after);
    const diff = this.computeDiff(before, after, updatedFields);

    return {
      metadataName,
      event: {
        type: 'update',
        recordId: entityId,
        properties: { before, after, updatedFields, diff },
      },
    };
  }

  private fromWorkspaceMigrationDeleteActionToMetadataEvent({
    action,
    fromToAllFlatEntityMaps,
  }: {
    action: AllUniversalWorkspaceMigrationAction<'delete'>;
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  }): MetadataDeleteEventWithMetadataName | undefined {
    const metadataName = action.metadataName;
    const universalIdentifier = action.universalIdentifier;
    const flatMapsKey = getMetadataFlatEntityMapsKey(metadataName);
    const fromTo = fromToAllFlatEntityMaps[flatMapsKey];

    if (!isDefined(fromTo)) {
      return undefined;
    }

    const deletedId = fromTo.from.idByUniversalIdentifier[universalIdentifier];

    if (!isDefined(deletedId)) {
      return undefined;
    }

    const deleted = fromTo.from.byId[deletedId];

    if (!isDefined(deleted)) {
      return undefined;
    }

    return {
      metadataName,
      event: {
        type: 'delete',
        recordId: deleted.id,
        properties: { before: deleted },
      },
    };
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
