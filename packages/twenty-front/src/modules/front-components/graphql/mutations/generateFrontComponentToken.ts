import { gql } from '@apollo/client';

export const GENERATE_FRONT_COMPONENT_TOKEN = gql`
  mutation GenerateFrontComponentToken(
    $input: GenerateFrontComponentTokenInput!
  ) {
    generateFrontComponentToken(input: $input) {
      applicationAccessToken
      apiUrl
      expiresAt
    }
  }
`;
