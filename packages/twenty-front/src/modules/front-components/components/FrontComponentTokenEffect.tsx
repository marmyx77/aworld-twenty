import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';
import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
  type GenerateFrontComponentTokenMutation,
  useGenerateFrontComponentTokenMutation,
} from '~/generated-metadata/graphql';

export type FrontComponentTokenData =
  GenerateFrontComponentTokenMutation['generateFrontComponentToken'];

type FrontComponentTokenEffectProps = {
  frontComponentId: string;
  onTokenGenerated: (tokenData: FrontComponentTokenData) => void;
  onError: () => void;
  onLoadingChange: (isLoading: boolean) => void;
};

export const FrontComponentTokenEffect = ({
  frontComponentId,
  onTokenGenerated,
  onError,
  onLoadingChange,
}: FrontComponentTokenEffectProps) => {
  const apolloMetadataClient = useApolloCoreClient();
  const { enqueueErrorSnackBar } = useSnackBar();

  const [generateToken] = useGenerateFrontComponentTokenMutation({
    client: apolloMetadataClient,
  });

  useEffect(() => {
    const fetchToken = async () => {
      onLoadingChange(true);

      try {
        const result = await generateToken({
          variables: { input: { frontComponentId } },
        });

        const data = result.data?.generateFrontComponentToken;

        if (!isDefined(data)) {
          throw new Error('Front component token was not returned');
        }

        onTokenGenerated(data);
      } catch {
        enqueueErrorSnackBar({
          message: t`Failed to generate front component token`,
        });
        onError();
      } finally {
        onLoadingChange(false);
      }
    };

    fetchToken();
  }, [
    frontComponentId,
    generateToken,
    enqueueErrorSnackBar,
    onTokenGenerated,
    onError,
    onLoadingChange,
  ]);

  return <></>;
};
