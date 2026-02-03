import { WEBHOOK_EMPTY_OPERATION } from '~/pages/settings/developers/webhooks/constants/WebhookEmptyOperation';
import { type WebhookOperationType } from '~/pages/settings/developers/webhooks/types/WebhookOperationsType';

export const addEmptyOperationIfNecessary = (
  newOperations: WebhookOperationType[],
): WebhookOperationType[] => {
  const hasEmptyOperation = newOperations.some((op) => op.object === null);

  if (!hasEmptyOperation) {
    return [...newOperations, WEBHOOK_EMPTY_OPERATION];
  }

  return newOperations;
};
