import { assertUnreachable } from 'twenty-shared/utils';

import { type RunnerMetadataEventEnvelope } from 'src/engine/metadata-event-emitter/types/runner-metadata-event-envelope.type';
import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';
import { type MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';
import { findFlatEntityByIdInFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps-or-throw.util';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import { type AllFlatWorkspaceMigrationAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';
import {
  type CreateMetadataEvent,
  type DeleteMetadataEvent,
  type FlatEntityUpdateKey,
  type UpdateMetadataEvent,
  toRunnerEnvelope,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/types/metadata-event';

export type DeriveMetadataEventsFromUpdateActionArgs = {
  flatAction: AllFlatWorkspaceMigrationAction<'update'>;
  allFlatEntityMaps: AllFlatEntityMaps;
};

const buildUpdateMetadataRecordEvent = <
  TMetadataName extends
    AllFlatWorkspaceMigrationAction<'update'>['metadataName'],
>({
  before,
  after,
  updatedFields,
}: {
  before: MetadataFlatEntity<TMetadataName>;
  after: MetadataFlatEntity<TMetadataName>;
  updatedFields: FlatEntityUpdateKey<TMetadataName>[];
}): UpdateMetadataEvent<TMetadataName> => {
  const diff: Record<string, { before: unknown; after: unknown }> = {};

  for (const field of updatedFields) {
    diff[field] = {
      before: before[field],
      after: after[field],
    };
  }

  return {
    type: 'updated',
    recordId: before.id,
    updatedFields,
    diff: diff as UpdateMetadataEvent<TMetadataName>['diff'],
    before,
    after,
  };
};

export const deriveMetadataEventsFromUpdateAction = ({
  flatAction,
  allFlatEntityMaps,
}: DeriveMetadataEventsFromUpdateActionArgs): RunnerMetadataEventEnvelope[] => {
  switch (flatAction.metadataName) {
    case 'index': {
      const fromFlatEntity = findFlatEntityByIdInFlatEntityMapsOrThrow({
        flatEntityId: flatAction.entityId,
        flatEntityMaps: allFlatEntityMaps['flatIndexMaps'],
      });

      const toFlatEntity = flatAction.updatedFlatIndex;

      const deleteEvent: DeleteMetadataEvent<'index'> = {
        type: 'deleted',
        recordId: fromFlatEntity.id,
        before: fromFlatEntity,
      };

      const createEvent: CreateMetadataEvent<'index'> = {
        type: 'created',
        recordId: toFlatEntity.id,
        after: toFlatEntity,
      };

      return [
        { metadataName: 'index', action: 'deleted', event: deleteEvent },
        { metadataName: 'index', action: 'created', event: createEvent },
      ];
    }
    case 'fieldMetadata':
    case 'objectMetadata':
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
    case 'frontComponent':
    case 'navigationMenuItem':
    case 'webhook': {
      const flatEntityMapsKey = getMetadataFlatEntityMapsKey(
        flatAction.metadataName,
      );

      const fromFlatEntity = findFlatEntityByIdInFlatEntityMapsOrThrow<
        MetadataFlatEntity<typeof flatAction.metadataName>
      >({
        flatEntityId: flatAction.entityId,
        flatEntityMaps: allFlatEntityMaps[flatEntityMapsKey],
      });

      const toFlatEntity = {
        ...fromFlatEntity,
        ...flatAction.update,
      } as MetadataFlatEntity<typeof flatAction.metadataName>;

      const updatedFields = Object.keys(
        flatAction.update,
      ) as FlatEntityUpdateKey<typeof flatAction.metadataName>[];

      return [
        toRunnerEnvelope(
          flatAction.metadataName,
          'updated',
          buildUpdateMetadataRecordEvent<typeof flatAction.metadataName>({
            before: fromFlatEntity,
            after: toFlatEntity,
            updatedFields,
          }),
        ),
      ];
    }
    default: {
      assertUnreachable(flatAction);
    }
  }
};
