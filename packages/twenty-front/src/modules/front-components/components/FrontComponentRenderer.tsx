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

export const FrontComponentRenderer = ({
  frontComponentId,
}: FrontComponentRendererProps) => {
  const theme = useTheme();
  const [hasError, setHasError] = useState(false);
  const [tokenData, setTokenData] = useState<FrontComponentTokenData | null>(
    null,
  );
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [hasTokenError, setHasTokenError] = useState(false);

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

  const handleTokenGenerated = useCallback((data: FrontComponentTokenData) => {
    setTokenData(data);
  }, []);

  const handleTokenError = useCallback(() => {
    setHasTokenError(true);
  }, []);

  const handleTokenLoadingChange = useCallback((isLoading: boolean) => {
    setIsTokenLoading(isLoading);
  }, []);

  if (!isDefined(authToken)) {
    return null;
  }

  const isReady = !hasError && !hasTokenError && !isTokenLoading;

  return (
    <>
      <FrontComponentTokenEffect
        frontComponentId={frontComponentId}
        onTokenGenerated={handleTokenGenerated}
        onError={handleTokenError}
        onLoadingChange={handleTokenLoadingChange}
      />
      {isReady && (
        <SharedFrontComponentRenderer
          theme={theme}
          componentUrl={componentUrl}
          authToken={authToken}
          applicationAccessToken={tokenData?.applicationAccessToken}
          apiUrl={tokenData?.apiUrl}
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
