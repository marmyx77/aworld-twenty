export type MetadataRecordDiff<T> = {
  [K in keyof T]: { before: T[K]; after: T[K] };
};
