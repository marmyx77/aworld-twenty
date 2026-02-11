import type { AllMetadataName } from 'twenty-shared/metadata';
import type { MetadataEventAction } from 'twenty-shared/metadata-events';

import { type MetadataEvent } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/types/metadata-event';

export type MetadataEventBatch<
  TMetadataName extends AllMetadataName = AllMetadataName,
  TAction extends MetadataEventAction = MetadataEventAction,
> = {
  name: `metadata.${TMetadataName}.${TAction}`;
  workspaceId: string;
  metadataName: TMetadataName;
  action: TAction;
  events: MetadataEvent[];
  userId?: string;
  apiKeyId?: string;
};
