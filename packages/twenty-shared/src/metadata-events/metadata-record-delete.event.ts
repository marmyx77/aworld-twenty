import { MetadataRecordBaseEvent } from '@/metadata-events/metadata-record.base.event';

export class MetadataRecordDeleteEvent<
  T = object,
> extends MetadataRecordBaseEvent<T> {
  declare properties: {
    before: T;
  };
}
