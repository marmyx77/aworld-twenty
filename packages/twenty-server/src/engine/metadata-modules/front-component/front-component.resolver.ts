import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { ApplicationTokenService } from 'src/engine/core-modules/auth/token/services/application-token.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { fromFlatFrontComponentToFrontComponentDto } from 'src/engine/metadata-modules/flat-front-component/utils/from-flat-front-component-to-front-component-dto.util';
import { CreateFrontComponentInput } from 'src/engine/metadata-modules/front-component/dtos/create-front-component.input';
import { FrontComponentTokenDTO } from 'src/engine/metadata-modules/front-component/dtos/front-component-token.dto';
import { FrontComponentDTO } from 'src/engine/metadata-modules/front-component/dtos/front-component.dto';
import { GenerateFrontComponentTokenInput } from 'src/engine/metadata-modules/front-component/dtos/generate-front-component-token.input';
import { UpdateFrontComponentInput } from 'src/engine/metadata-modules/front-component/dtos/update-front-component.input';
import { FrontComponentService } from 'src/engine/metadata-modules/front-component/front-component.service';
import { FrontComponentGraphqlApiExceptionInterceptor } from 'src/engine/metadata-modules/front-component/interceptors/front-component-graphql-api-exception.interceptor';
import { cleanServerUrl } from 'src/utils/clean-server-url';
import { WorkspaceMigrationGraphqlApiExceptionInterceptor } from 'src/engine/workspace-manager/workspace-migration/interceptors/workspace-migration-graphql-api-exception.interceptor';

const FRONT_COMPONENT_TOKEN_EXPIRATION_IN_SECONDS = 900;

@UseGuards(WorkspaceAuthGuard)
@UseInterceptors(
  WorkspaceMigrationGraphqlApiExceptionInterceptor,
  FrontComponentGraphqlApiExceptionInterceptor,
)
@Resolver(() => FrontComponentDTO)
export class FrontComponentResolver {
  constructor(
    private readonly frontComponentService: FrontComponentService,
    private readonly applicationTokenService: ApplicationTokenService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  @Query(() => [FrontComponentDTO])
  @UseGuards(NoPermissionGuard)
  async frontComponents(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentDTO[]> {
    return await this.frontComponentService.findAll(workspace.id);
  }

  @Query(() => FrontComponentDTO, { nullable: true })
  @UseGuards(NoPermissionGuard)
  async frontComponent(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentDTO | null> {
    return await this.frontComponentService.findById(id, workspace.id);
  }

  @Mutation(() => FrontComponentDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.APPLICATIONS))
  async createFrontComponent(
    @Args('input') input: CreateFrontComponentInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentDTO> {
    const flatFrontComponent = await this.frontComponentService.createOne({
      input,
      workspaceId: workspace.id,
    });

    return fromFlatFrontComponentToFrontComponentDto(flatFrontComponent);
  }

  @Mutation(() => FrontComponentDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.APPLICATIONS))
  async updateFrontComponent(
    @Args('input') input: UpdateFrontComponentInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentDTO> {
    const flatFrontComponent = await this.frontComponentService.updateOne({
      id: input.id,
      update: input.update,
      workspaceId: workspace.id,
    });

    return fromFlatFrontComponentToFrontComponentDto(flatFrontComponent);
  }

  @Mutation(() => FrontComponentDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.APPLICATIONS))
  async deleteFrontComponent(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentDTO> {
    const flatFrontComponent = await this.frontComponentService.destroyOne({
      id,
      workspaceId: workspace.id,
    });

    return fromFlatFrontComponentToFrontComponentDto(flatFrontComponent);
  }

  @Mutation(() => FrontComponentTokenDTO)
  @UseGuards(UserAuthGuard, NoPermissionGuard)
  async generateFrontComponentToken(
    @Args('input') input: GenerateFrontComponentTokenInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentTokenDTO> {
    const frontComponent = await this.frontComponentService.findByIdOrThrow(
      input.frontComponentId,
      workspace.id,
    );

    const authToken =
      await this.applicationTokenService.generateApplicationToken({
        workspaceId: workspace.id,
        applicationId: frontComponent.applicationId,
        expiresInSeconds: FRONT_COMPONENT_TOKEN_EXPIRATION_IN_SECONDS,
      });

    const apiUrl =
      cleanServerUrl(this.twentyConfigService.get('SERVER_URL')) ?? '';

    return {
      applicationAccessToken: authToken.token,
      apiUrl,
      expiresAt: authToken.expiresAt,
    };
  }
}
