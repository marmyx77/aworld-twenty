import { type MetadataRecordBaseEvent } from '@/metadata-events/metadata-record.base.event';

export type MetadataRecordCreateEvent<T = object> = MetadataRecordBaseEvent<{
  after: T;
}> & { type: 'create' };
