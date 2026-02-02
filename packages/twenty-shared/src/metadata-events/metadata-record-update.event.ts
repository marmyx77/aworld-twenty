import { type MetadataRecordDiff } from '@/metadata-events/metadata-record-diff';
import { MetadataRecordBaseEvent } from '@/metadata-events/metadata-record.base.event';

export class MetadataRecordUpdateEvent<
  T = object,
> extends MetadataRecordBaseEvent<T> {
  declare properties: {
    updatedFields: string[];
    diff: Partial<MetadataRecordDiff<T>>;
    before: T;
    after: T;
  };
}
