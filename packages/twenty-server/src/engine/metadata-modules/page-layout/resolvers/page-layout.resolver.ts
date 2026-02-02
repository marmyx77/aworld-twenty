import {
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CreatePageLayoutInput } from 'src/engine/metadata-modules/page-layout/dtos/inputs/create-page-layout.input';
import { UpdatePageLayoutWithTabsInput } from 'src/engine/metadata-modules/page-layout/dtos/inputs/update-page-layout-with-tabs.input';
import { UpdatePageLayoutInput } from 'src/engine/metadata-modules/page-layout/dtos/inputs/update-page-layout.input';
import { PageLayoutDTO } from 'src/engine/metadata-modules/page-layout/dtos/page-layout.dto';
import { PageLayoutUpdateService } from 'src/engine/metadata-modules/page-layout/services/page-layout-update.service';
import { PageLayoutService } from 'src/engine/metadata-modules/page-layout/services/page-layout.service';
import { PageLayoutGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/page-layout/utils/page-layout-graphql-api-exception.filter';
import { WorkspaceMigrationGraphqlApiExceptionInterceptor } from 'src/engine/workspace-manager/workspace-migration/interceptors/workspace-migration-graphql-api-exception.interceptor';

@Resolver(() => PageLayoutDTO)
@UseInterceptors(WorkspaceMigrationGraphqlApiExceptionInterceptor)
@UseFilters(PageLayoutGraphqlApiExceptionFilter)
@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
export class PageLayoutResolver {
  constructor(
    private readonly pageLayoutService: PageLayoutService,
    private readonly pageLayoutUpdateService: PageLayoutUpdateService,
  ) {}

  @Query(() => [PageLayoutDTO])
  @UseGuards(NoPermissionGuard)
  async getPageLayouts(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('objectMetadataId', { type: () => String, nullable: true })
    objectMetadataId?: string,
  ): Promise<PageLayoutDTO[]> {
    if (objectMetadataId) {
      return this.pageLayoutService.findByObjectMetadataId({
        workspaceId: workspace.id,
        objectMetadataId,
      });
    }

    return this.pageLayoutService.findByWorkspaceId(workspace.id);
  }

  @Query(() => PageLayoutDTO, { nullable: true })
  @UseGuards(NoPermissionGuard)
  async getPageLayout(
    @Args('id', { type: () => String }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<PageLayoutDTO | null> {
    return this.pageLayoutService.findByIdOrThrow({
      id,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => PageLayoutDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.LAYOUTS))
  async createPageLayout(
    @Args('input') input: CreatePageLayoutInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<PageLayoutDTO> {
    return this.pageLayoutService.create({
      createPageLayoutInput: input,
      workspaceId: workspace.id,
      userId: user?.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => PageLayoutDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.LAYOUTS))
  async updatePageLayout(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdatePageLayoutInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<PageLayoutDTO> {
    return this.pageLayoutService.update({
      id,
      workspaceId: workspace.id,
      updateData: input,
      userId: user?.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.LAYOUTS))
  async destroyPageLayout(
    @Args('id', { type: () => String }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<boolean> {
    return this.pageLayoutService.destroy({
      id,
      workspaceId: workspace.id,
      userId: user?.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => PageLayoutDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.LAYOUTS))
  async updatePageLayoutWithTabsAndWidgets(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdatePageLayoutWithTabsInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<PageLayoutDTO> {
    return this.pageLayoutUpdateService.updatePageLayoutWithTabs({
      id,
      workspaceId: workspace.id,
      input,
      userId: user?.id,
      workspaceMemberId,
    });
  }
}
