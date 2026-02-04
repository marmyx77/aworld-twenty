import { type MetadataRecordDiff } from '@/metadata-events/metadata-record-diff';
import { type MetadataRecordBaseEvent } from '@/metadata-events/metadata-record.base.event';

export type MetadataRecordUpdateEvent<T = object> = MetadataRecordBaseEvent<{
  updatedFields: string[];
  diff: Partial<MetadataRecordDiff<T>>;
  before: T;
  after: T;
}> & { type: 'update' };
