import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('FrontComponentToken')
export class FrontComponentTokenDTO {
  @Field(() => String)
  applicationAccessToken: string;

  @Field(() => String)
  apiUrl: string;

  @Field(() => Date)
  expiresAt: Date;
}
