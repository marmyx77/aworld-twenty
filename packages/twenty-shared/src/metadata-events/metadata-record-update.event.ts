export type MetadataRecordUpdateEvent<TRecord = Record<string, unknown>> = {
  type: 'updated';
  recordId: string;
  updatedFields: string[];
  diff: Record<string, { before: unknown; after: unknown }>;
  before: TRecord;
  after: TRecord;
};
