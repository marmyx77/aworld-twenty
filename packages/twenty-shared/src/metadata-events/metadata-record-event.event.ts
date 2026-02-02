import { type MetadataRecordCreateEvent } from '@/metadata-events/metadata-record-create.event';
import { type MetadataRecordDeleteEvent } from '@/metadata-events/metadata-record-delete.event';
import { type MetadataRecordUpdateEvent } from '@/metadata-events/metadata-record-update.event';

export type MetadataRecordEvent<T = object> =
  | MetadataRecordUpdateEvent<T>
  | MetadataRecordDeleteEvent<T>
  | MetadataRecordCreateEvent<T>;
