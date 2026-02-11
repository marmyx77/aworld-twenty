import { assertUnreachable } from 'twenty-shared/utils';

import { type RunnerMetadataEventEnvelope } from 'src/engine/metadata-event-emitter/types/runner-metadata-event-envelope.type';
import { type AllFlatWorkspaceMigrationAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';

export const deriveMetadataEventsFromCreateAction = (
  flatAction: AllFlatWorkspaceMigrationAction<'create'>,
): RunnerMetadataEventEnvelope[] => {
  switch (flatAction.metadataName) {
    case 'fieldMetadata': {
      return flatAction.flatFieldMetadatas.map((flatFieldMetadata) => ({
        metadataName: 'fieldMetadata',
        action: 'created',
        event: {
          type: 'created',
          recordId: flatFieldMetadata.id,
          after: flatFieldMetadata,
        },
      }));
    }
    case 'objectMetadata': {
      const objectEvent: RunnerMetadataEventEnvelope = {
        metadataName: 'objectMetadata',
        action: 'created',
        event: {
          type: 'created',
          recordId: flatAction.flatEntity.id,
          after: flatAction.flatEntity,
        },
      };

      const fieldEvents: RunnerMetadataEventEnvelope[] =
        flatAction.flatFieldMetadatas.map((flatFieldMetadata) => ({
          metadataName: 'fieldMetadata',
          action: 'created',
          event: {
            type: 'created',
            recordId: flatFieldMetadata.id,
            after: flatFieldMetadata,
          },
        }));

      return [objectEvent, ...fieldEvents];
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
    case 'frontComponent':
    case 'navigationMenuItem':
    case 'webhook': {
      return [
        {
          metadataName: flatAction.metadataName,
          action: 'created',
          event: {
            type: 'created',
            recordId: flatAction.flatEntity.id,
            after: flatAction.flatEntity,
          },
        },
      ];
    }
    default: {
      assertUnreachable(flatAction);
    }
  }
};
