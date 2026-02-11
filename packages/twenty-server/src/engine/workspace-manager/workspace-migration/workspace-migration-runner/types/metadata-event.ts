import type { AllMetadataName } from 'twenty-shared/metadata';
import type {
  MetadataEventAction,
  MetadataRecordCreateEvent,
  MetadataRecordDeleteEvent,
} from 'twenty-shared/metadata-events';

import type { RunnerMetadataEventEnvelope } from 'src/engine/metadata-event-emitter/types/runner-metadata-event-envelope.type';
import type { FlatEntityUpdate } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-update.type';
import type { MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';

export type CreateMetadataEvent<T extends AllMetadataName> =
  MetadataRecordCreateEvent<MetadataFlatEntity<T>>;

export type DeleteMetadataEvent<T extends AllMetadataName> =
  MetadataRecordDeleteEvent<MetadataFlatEntity<T>>;

export type FlatEntityUpdateKey<T extends AllMetadataName> = Extract<
  keyof FlatEntityUpdate<T>,
  string
>;

export type UpdateMetadataEvent<T extends AllMetadataName> = {
  type: 'updated';
  recordId: string;
  updatedFields: FlatEntityUpdateKey<T>[];
  diff: {
    [P in FlatEntityUpdateKey<T>]?: {
      before: MetadataFlatEntity<T>[P];
      after: MetadataFlatEntity<T>[P];
    };
  };
  before: MetadataFlatEntity<T>;
  after: MetadataFlatEntity<T>;
};

type RunnerEventByAction<T extends AllMetadataName> = {
  created: CreateMetadataEvent<T>;
  updated: UpdateMetadataEvent<T>;
  deleted: DeleteMetadataEvent<T>;
};

// Bridges the TypeScript "correlated union" gap: callers provide
// T-correlated arguments (metadataName, action, and event must all
// agree on T and A), and the single assertion maps to the distributive
// RunnerMetadataEventEnvelope union that TS can't prove generically.
export const toRunnerEnvelope = <
  T extends AllMetadataName,
  A extends MetadataEventAction,
>(
  metadataName: T,
  action: A,
  event: RunnerEventByAction<T>[A],
): RunnerMetadataEventEnvelope =>
  ({ metadataName, action, event }) as RunnerMetadataEventEnvelope;
