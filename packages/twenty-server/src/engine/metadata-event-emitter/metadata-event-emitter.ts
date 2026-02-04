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
foimport { MetadataFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity-maps.type';
import { MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import type { FromToAllFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';
import { UniversalSyncableFlatEntity } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-entity-from.type';
import { WorkspaceMigration } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration';
import type { AllUniversalWorkspaceMigrationAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';
import {
  MetadataRecordCreateEvent,
  MetadataRecordDeleteEvent,
  MetadataRecordUpdateEvent,
} from 'twenty-shared/metadata-events';
import { FromTo } from 'twenty-shared/types';
import { from } from 'rxjs';
import { MetadataFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity-maps.type';
import { MetadataUniversalFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-universal-flat-entity.type';
import { UniversalFlatFieldMetadata } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-field-metadata.type';

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

// Quite redundant
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
///

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
            // TODO fix typing
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
            // TODO fix typing
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
            // TODO fix typing
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
          // NOTE will be fixed when https://github.com/twentyhq/twenty/pull/17687 has been merged
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
    universalFlatFieldMetadatas: UniversalFlatFieldMetadata[];
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  }): MetadataCreateEventWithMetadataName[] {
    return universalFlatFieldMetadatas
      .map((flatFieldMetadata) =>
        this.buildFlatEntityMetadataCreateEvent({
          metadataName: 'fieldMetadata',
          flatEntity: flatFieldMetadata,
          fromToAllFlatEntityMaps,
        }),
      )
      .filter(isDefined);
  }

  private buildFlatEntityMetadataCreateEvent<T extends AllMetadataName>({
    metadataName,
    flatEntity,
    fromToAllFlatEntityMaps,
  }: {
    metadataName: T;
    flatEntity: MetadataUniversalFlatEntity<T>;
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  }): MetadataCreateEventWithMetadataName | undefined {
    const flatMapsKey = getMetadataFlatEntityMapsKey(metadataName);
    const fromToFlatEntityMaps = fromToAllFlatEntityMaps[flatMapsKey] as
      | FromTo<MetadataFlatEntityMaps<typeof metadataName>>
      | undefined;

    if (!isDefined(fromToFlatEntityMaps)) {
      return undefined;
    }
    const {  to: toFlatEntityMaps } =
      fromToFlatEntityMaps;


    const { universalIdentifier } = flatEntity;

    const createdFlatEntity = findFlatEntityByUniversalIdentifier({
      flatEntityMaps: toFlatEntityMaps,
      universalIdentifier,
    });

    if (!isDefined(createdFlatEntity)) {
      return undefined;
    }

    return {
      metadataName,
      event: {
        type: 'create',
        recordId: createdFlatEntity.id,
        properties: { after: createdFlatEntity },
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
      case 'index': {
        // TODO implement custom index update action transpiler as it's not like the others
        return undefined
      };
      // Universal workspace migration migrated
      case 'objectMetadata':
      case 'fieldMetadata': {
        return this.buildEntityUpdateEvent({
          action,
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
        const fromTo = fromToAllFlatEntityMaps[flatMapsKey] as FromTo<
          MetadataFlatEntityMaps<typeof action.metadataName>
        >;

        if (!isDefined(fromTo)) {
          return undefined;
        }

        const existingEntity = findFlatEntityByIdInFlatEntityMaps({
          flatEntityMaps: fromTo.from,
          flatEntityId: entityId,
        });

        if (!isDefined(existingEntity)) {
          return undefined;
        }

        return this.buildEntityUpdateEvent({
          action,
          universalIdentifier: existingEntity.universalIdentifier,
          fromToAllFlatEntityMaps,
        });
      }
      default:
        assertUnreachable(action);
    }
  }

  private buildEntityUpdateEvent({
    universalIdentifier,
    action,
    fromToAllFlatEntityMaps,
  }: {
    action: AllUniversalWorkspaceMigrationAction<'update'>;
    universalIdentifier: string;
    fromToAllFlatEntityMaps: FromToAllFlatEntityMaps;
  }): MetadataUpdateEventWithMetadataName | undefined {
    const flatMapsKey = getMetadataFlatEntityMapsKey(action.metadataName);
    const fromToFlatEntityMaps = fromToAllFlatEntityMaps[flatMapsKey] as
      | FromTo<MetadataFlatEntityMaps<typeof action.metadataName>>
      | undefined;

    if (!isDefined(fromToFlatEntityMaps)) {
      return undefined;
    }
    const { from: fromFlatEntityMaps, to: toFlatEntityMaps } =
      fromToFlatEntityMaps;

    const beforeFlatEntity = findFlatEntityByUniversalIdentifier({
      flatEntityMaps: fromFlatEntityMaps,
      universalIdentifier,
    });

    if (!isDefined(beforeFlatEntity)) {
      return undefined;
    }

    const afterFlatEntity = findFlatEntityByUniversalIdentifier({
      flatEntityMaps: toFlatEntityMaps,
      universalIdentifier: universalIdentifier,
    });

    if (!isDefined(beforeFlatEntity) || !isDefined(afterFlatEntity)) {
      return undefined;
    }

    return {
      metadataName: action.metadataName,
      event: {
        type: 'update',
        recordId: beforeFlatEntity.id,
        properties: {
          before: beforeFlatEntity,
          after: afterFlatEntity,
          updatedFields: Object.keys(action.update),
          // TODO FIX TYPING
          diff: action.update,
        },
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

    const deleted = fromTo.from.byUniversalIdentifier[universalIdentifier];

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
}
