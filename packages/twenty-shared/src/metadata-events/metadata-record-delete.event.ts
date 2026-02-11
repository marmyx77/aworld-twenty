export type MetadataRecordDeleteEvent<TRecord = Record<string, unknown>> = {
  type: 'deleted';
  recordId: string;
  before: TRecord;
};
