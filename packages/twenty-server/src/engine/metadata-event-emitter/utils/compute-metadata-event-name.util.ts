import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataEventAction } from 'src/engine/metadata-event-emitter/enums/metadata-event-action.enum';

export const computeMetadataEventName = (
  metadataName: AllMetadataName,
  action: MetadataEventAction,
): string => {
  return `metadata.${metadataName}.${action}`;
};
