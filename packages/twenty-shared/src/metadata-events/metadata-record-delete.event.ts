import { type MetadataRecordBaseEvent } from '@/metadata-events/metadata-record.base.event';

export type MetadataRecordDeleteEvent<T = object> = MetadataRecordBaseEvent<{
  before: T;
}>;
