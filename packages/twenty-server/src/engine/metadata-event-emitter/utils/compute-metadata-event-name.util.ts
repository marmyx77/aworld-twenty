import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataEventAction } from 'src/engine/metadata-event-emitter/enums/metadata-event-action.enum';

export const computeMetadataEventName = <
  TMetadataName extends AllMetadataName,
  TAction extends MetadataEventAction,
>(
  metadataName: TMetadataName,
  action: TAction,
) => `metadata.${metadataName}.${action}` as const;
