import type { AllMetadataName } from 'twenty-shared/metadata';
import type {
  MetadataEventAction,
  MetadataRecordEventByAction,
} from 'twenty-shared/metadata-events';

import type { MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';

export type MetadataEventBatch<
  TMetadataName extends AllMetadataName = AllMetadataName,
  TAction extends MetadataEventAction = MetadataEventAction,
> = {
  name: `metadata.${TMetadataName}.${TAction}`;
  workspaceId: string;
  metadataName: TMetadataName;
  action: TAction;
  events: MetadataRecordEventByAction<
    MetadataFlatEntity<TMetadataName>
  >[TAction][];
  userId?: string;
  apiKeyId?: string;
};
