import { type AllMetadataName } from 'twenty-shared/metadata';

import { ALL_ENTITY_PROPERTIES_CONFIGURATION_BY_METADATA_NAME } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';
import { type AtomicFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type MetadataEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-entity.type';
import { type MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';

const DATE_PROPERTY_NAMES = new Set([
  'createdAt',
  'updatedAt',
  'deletedAt',
]);

export const toAtomicFlatEntity = <T extends AllMetadataName>(
  metadataName: T,
  flatEntity: MetadataFlatEntity<T>,
): AtomicFlatEntity<MetadataEntity<T>> => {
  const config =
    ALL_ENTITY_PROPERTIES_CONFIGURATION_BY_METADATA_NAME[metadataName];
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(config)) {
    if (!DATE_PROPERTY_NAMES.has(key)) {
      result[key] = (flatEntity as Record<string, unknown>)[key];
    }
  }

  const flatEntityRecord = flatEntity as Record<string, unknown>;

  result.id = flatEntityRecord.id;
  result.workspaceId = flatEntityRecord.workspaceId;
  result.applicationId = flatEntityRecord.applicationId;
  result.universalIdentifier = flatEntityRecord.universalIdentifier;

  return result as AtomicFlatEntity<MetadataEntity<T>>;
};
