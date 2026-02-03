import type { AllMetadataName } from 'twenty-shared/metadata';
import type {
  MetadataRecordCreateEvent,
  MetadataRecordDeleteEvent,
  MetadataRecordUpdateEvent,
} from 'twenty-shared/metadata-events';

import { type MetadataEventAction } from 'src/engine/metadata-event-emitter/enums/metadata-event-action.enum';
import type { MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';

export type MetadataRecordEventByAction<TMetadataName extends AllMetadataName> =
  {
    created: MetadataRecordCreateEvent<MetadataFlatEntity<TMetadataName>>;
    updated: MetadataRecordUpdateEvent<MetadataFlatEntity<TMetadataName>>;
    deleted: MetadataRecordDeleteEvent<MetadataFlatEntity<TMetadataName>>;
  };

export type MetadataEventBatch<
  TMetadataName extends AllMetadataName = AllMetadataName,
  TAction extends MetadataEventAction = MetadataEventAction,
> = {
  name: `metadata.${TMetadataName}.${TAction}`;
  workspaceId: string;
  metadataName: TMetadataName;
  action: TAction;
  events: MetadataRecordEventByAction<TMetadataName>[TAction][];
  userId?: string;
  apiKeyId?: string;
};
