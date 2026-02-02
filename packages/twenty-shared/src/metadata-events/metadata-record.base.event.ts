import { type MetadataRecordDiff } from '@/metadata-events/metadata-record-diff';

type Properties<T> = {
  updatedFields?: string[];
  before?: T;
  after?: T;
  diff?: Partial<MetadataRecordDiff<T>>;
};

export class MetadataRecordBaseEvent<T = object> {
  recordId: string;
  properties: Properties<T>;
}
