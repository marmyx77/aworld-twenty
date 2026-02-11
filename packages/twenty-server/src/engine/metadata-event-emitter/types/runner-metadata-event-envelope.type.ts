import type { AllMetadataName } from 'twenty-shared/metadata';
import type { MetadataEventEnvelope } from 'twenty-shared/metadata-events';

import type { MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';

export type RunnerMetadataEventEnvelope = MetadataEventEnvelope<
  AllMetadataName,
  MetadataFlatEntity<AllMetadataName>
>;
