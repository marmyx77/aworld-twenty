import type { AllMetadataName } from '@/metadata';
import type { MetadataEventAction } from '@/metadata-events/metadata-event-action';
import type { MetadataRecordEventByAction } from '@/metadata-events/metadata-record-event-by-action';

export type MetadataEventEnvelope<
  TMetadataName extends AllMetadataName = AllMetadataName,
  TRecord = Record<string, unknown>,
  TAction extends MetadataEventAction = MetadataEventAction,
> = {
  metadataName: TMetadataName;
  action: TAction;
  event: MetadataRecordEventByAction<TRecord>[TAction];
};
