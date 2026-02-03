import type { AllMetadataName } from 'twenty-shared/metadata';

export type MetadataEventBatch<MetadataEvent> = {
  name: string;
  workspaceId: string;
  metadataName: AllMetadataName;
  events: MetadataEvent[];
  userId?: string;
  apiKeyId?: string;
};
