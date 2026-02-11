import { type MetadataRecordUpdateEvent } from 'twenty-shared/metadata-events';
import { assertUnreachable } from 'twenty-shared/utils';

import { type RunnerMetadataEventEnvelope } from 'src/engine/metadata-event-emitter/types/runner-metadata-event-envelope.type';
import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';
import { type MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';
import { findFlatEntityByIdInFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps-or-throw.util';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import { type AllFlatWorkspaceMigrationAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';

export type DeriveMetadataEventsFromUpdateActionArgs = {
  flatAction: AllFlatWorkspaceMigrationAction<'update'>;
  allFlatEntityMaps: AllFlatEntityMaps;
};

const buildDiff = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  updatedFields: string[],
): Record<string, { before: unknown; after: unknown }> => {
  const diff: Record<string, { before: unknown; after: unknown }> = {};

  for (const field of updatedFields) {
    diff[field] = {
      before: before[field],
      after: after[field],
    };
  }

  return diff;
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
  updatedFields: string[];
}): MetadataRecordUpdateEvent<MetadataFlatEntity<TMetadataName>> => {
  return {
    type: 'updated',
    recordId: before.id,
    updatedFields,
    diff: buildDiff(before, after, updatedFields),
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

      const deleteIndexMetadataEvent: RunnerMetadataEventEnvelope = {
        metadataName: 'index',
        action: 'deleted',
        event: {
          type: 'deleted',
          recordId: fromFlatEntity.id,
          before: fromFlatEntity,
        },
      };

      const createIndexMetadataEvent: RunnerMetadataEventEnvelope = {
        metadataName: 'index',
        action: 'created',
        event: {
          type: 'created',
          recordId: toFlatEntity.id,
          after: toFlatEntity,
        },
      };

      return [deleteIndexMetadataEvent, createIndexMetadataEvent];
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

      const updatedFields = Object.keys(flatAction.update);

      return [
        {
          metadataName: flatAction.metadataName,
          action: 'updated',
          event: buildUpdateMetadataRecordEvent({
            before: fromFlatEntity,
            after: toFlatEntity,
            updatedFields,
          }),
        },
      ];
    }
    default: {
      assertUnreachable(flatAction);
    }
  }
};
