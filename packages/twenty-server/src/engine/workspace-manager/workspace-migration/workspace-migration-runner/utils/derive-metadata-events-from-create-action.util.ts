import { assertUnreachable } from 'twenty-shared/utils';

import { type RunnerMetadataEventEnvelope } from 'src/engine/metadata-event-emitter/types/runner-metadata-event-envelope.type';
import { type AllFlatWorkspaceMigrationAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';
import {
  type CreateMetadataEvent,
  toRunnerEnvelope,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/types/metadata-event';

export const deriveMetadataEventsFromCreateAction = (
  flatAction: AllFlatWorkspaceMigrationAction<'create'>,
): RunnerMetadataEventEnvelope[] => {
  switch (flatAction.metadataName) {
    case 'fieldMetadata': {
      return flatAction.flatFieldMetadatas.map((flatFieldMetadata) => {
        const event: CreateMetadataEvent<'fieldMetadata'> = {
          type: 'created',
          recordId: flatFieldMetadata.id,
          after: flatFieldMetadata,
        };

        return { metadataName: 'fieldMetadata', action: 'created', event };
      });
    }
    case 'objectMetadata': {
      const objectEvent: CreateMetadataEvent<'objectMetadata'> = {
        type: 'created',
        recordId: flatAction.flatEntity.id,
        after: flatAction.flatEntity,
      };

      const fieldEvents = flatAction.flatFieldMetadatas.map(
        (flatFieldMetadata): RunnerMetadataEventEnvelope => {
          const event: CreateMetadataEvent<'fieldMetadata'> = {
            type: 'created',
            recordId: flatFieldMetadata.id,
            after: flatFieldMetadata,
          };

          return { metadataName: 'fieldMetadata', action: 'created', event };
        },
      );

      return [
        {
          metadataName: 'objectMetadata',
          action: 'created',
          event: objectEvent,
        },
        ...fieldEvents,
      ];
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
        toRunnerEnvelope(flatAction.metadataName, 'created', {
          type: 'created',
          recordId: flatAction.flatEntity.id,
          after: flatAction.flatEntity,
        }),
      ];
    }
    default: {
      assertUnreachable(flatAction);
    }
  }
};
