import { MetadataRecordBaseEvent } from '@/metadata-events/metadata-record.base.event';

export class MetadataRecordCreateEvent<
  T = object,
> extends MetadataRecordBaseEvent<T> {
  declare properties: {
    after: T;
  };
}
