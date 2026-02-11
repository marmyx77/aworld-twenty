export type MetadataRecordCreateEvent<TRecord = Record<string, unknown>> = {
  type: 'created';
  recordId: string;
  after: TRecord;
};
