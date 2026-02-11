import { REST_API_BASE_URL } from '@/apollo/constant/rest-api-base-url';
import { getTokenPair } from '@/apollo/utils/getTokenPair';
import {
  FrontComponentTokenEffect,
  type FrontComponentTokenData,
} from '@/front-components/components/FrontComponentTokenEffect';
import { useFrontComponentExecutionContext } from '@/front-components/hooks/useFrontComponentExecutionContext';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useTheme } from '@emotion/react';
import { t } from '@lingui/core/macro';
import { useCallback, useState } from 'react';
import { FrontComponentRenderer as SharedFrontComponentRenderer } from 'twenty-sdk/front-component';
import { isDefined } from 'twenty-shared/utils';

type FrontComponentRendererProps = {
  frontComponentId: string;
};

type FrontComponentTokenState = {
  frontComponentId: string;
  tokenData: FrontComponentTokenData;
};

export const FrontComponentRenderer = ({
  frontComponentId,
}: FrontComponentRendererProps) => {
  const theme = useTheme();
  const [hasError, setHasError] = useState(false);
  const [frontComponentTokenState, setFrontComponentTokenState] =
    useState<FrontComponentTokenState | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [tokenErrorFrontComponentId, setTokenErrorFrontComponentId] = useState<
    string | null
  >(null);

  const { enqueueErrorSnackBar } = useSnackBar();
  const { executionContext, frontComponentHostCommunicationApi } =
    useFrontComponentExecutionContext();

  const componentUrl = `${REST_API_BASE_URL}/front-components/${frontComponentId}`;
  const authToken = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

  const handleError = (error?: Error) => {
    if (isDefined(error)) {
      const errorMessage = error.message;

      enqueueErrorSnackBar({
        message: t`Failed to load front component: ${errorMessage}`,
      });
    }
    setHasError(true);
  };

  const handleTokenError = useCallback(() => {
    setTokenErrorFrontComponentId(frontComponentId);
  }, [frontComponentId]);

  const handleTokenGenerated = useCallback(
    (newTokenData: FrontComponentTokenData) => {
      setFrontComponentTokenState({
        frontComponentId,
        tokenData: newTokenData,
      });
    },
    [frontComponentId],
  );

  const currentFrontComponentTokenData =
    frontComponentTokenState?.frontComponentId === frontComponentId
      ? frontComponentTokenState.tokenData
      : null;

  const isCurrentFrontComponentTokenReady =
    !isTokenLoading && isDefined(currentFrontComponentTokenData);

  const hasTokenError = tokenErrorFrontComponentId === frontComponentId;

  if (hasError || hasTokenError || !isDefined(authToken)) {
    // TODO: Add an error display component here
    return null;
  }

  return (
    <>
      <FrontComponentTokenEffect
        frontComponentId={frontComponentId}
        onTokenGenerated={handleTokenGenerated}
        onError={handleTokenError}
        onLoadingChange={setIsTokenLoading}
      />
      {isCurrentFrontComponentTokenReady && (
        <SharedFrontComponentRenderer
          theme={theme}
          componentUrl={componentUrl}
          authToken={authToken}
          applicationAccessToken={
            currentFrontComponentTokenData.applicationAccessToken
          }
          apiUrl={currentFrontComponentTokenData.apiUrl}
          executionContext={executionContext}
          frontComponentHostCommunicationApi={
            frontComponentHostCommunicationApi
          }
          onError={handleError}
        />
      )}
    </>
  );
};
