import type { AllMetadataName } from '@/metadata';
import type { MetadataEventAction } from '@/metadata-events/metadata-event-action';

export const computeMetadataEventName = <
  TMetadataName extends AllMetadataName,
  TAction extends MetadataEventAction,
>(
  metadataName: TMetadataName,
  action: TAction,
) => `metadata.${metadataName}.${action}` as const;
