import type { AllMetadataName } from 'twenty-shared/metadata';
import type {
  MetadataEventAction,
  MetadataRecordCreateEvent,
  MetadataRecordDeleteEvent,
  MetadataRecordEventByAction,
  MetadataRecordUpdateEvent,
} from 'twenty-shared/metadata-events';

import type { RunnerMetadataEventEnvelope } from 'src/engine/metadata-event-emitter/types/runner-metadata-event-envelope.type';
import type { MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';

export type CreateMetadataEvent<T extends AllMetadataName> =
  MetadataRecordCreateEvent<MetadataFlatEntity<T>>;

export type UpdateMetadataEvent<T extends AllMetadataName> =
  MetadataRecordUpdateEvent<MetadataFlatEntity<T>>;

export type DeleteMetadataEvent<T extends AllMetadataName> =
  MetadataRecordDeleteEvent<MetadataFlatEntity<T>>;

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
  event: MetadataRecordEventByAction<MetadataFlatEntity<T>>[A],
): RunnerMetadataEventEnvelope =>
  ({ metadataName, action, event }) as RunnerMetadataEventEnvelope;
