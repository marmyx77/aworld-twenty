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
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CreatePageLayoutTabInput } from 'src/engine/metadata-modules/page-layout-tab/dtos/inputs/create-page-layout-tab.input';
import { UpdatePageLayoutTabInput } from 'src/engine/metadata-modules/page-layout-tab/dtos/inputs/update-page-layout-tab.input';
import { PageLayoutTabDTO } from 'src/engine/metadata-modules/page-layout-tab/dtos/page-layout-tab.dto';
import { PageLayoutTabService } from 'src/engine/metadata-modules/page-layout-tab/services/page-layout-tab.service';
import { PageLayoutGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/page-layout/utils/page-layout-graphql-api-exception.filter';
import { WorkspaceMigrationGraphqlApiExceptionInterceptor } from 'src/engine/workspace-manager/workspace-migration/interceptors/workspace-migration-graphql-api-exception.interceptor';

@Resolver(() => PageLayoutTabDTO)
@UseInterceptors(WorkspaceMigrationGraphqlApiExceptionInterceptor)
@UseFilters(PageLayoutGraphqlApiExceptionFilter)
@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
export class PageLayoutTabResolver {
  constructor(private readonly pageLayoutTabService: PageLayoutTabService) {}

  @Query(() => [PageLayoutTabDTO])
  @UseGuards(NoPermissionGuard)
  async getPageLayoutTabs(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('pageLayoutId', { type: () => String }) pageLayoutId: string,
  ): Promise<PageLayoutTabDTO[]> {
    return this.pageLayoutTabService.findByPageLayoutId({
      workspaceId: workspace.id,
      pageLayoutId,
    });
  }

  @Query(() => PageLayoutTabDTO)
  @UseGuards(NoPermissionGuard)
  async getPageLayoutTab(
    @Args('id', { type: () => String }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<PageLayoutTabDTO> {
    return this.pageLayoutTabService.findByIdOrThrow({
      id,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => PageLayoutTabDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.LAYOUTS))
  async createPageLayoutTab(
    @Args('input') input: CreatePageLayoutTabInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<PageLayoutTabDTO> {
    return this.pageLayoutTabService.create({
      createPageLayoutTabInput: input,
      workspaceId: workspace.id,
      userId: user?.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => PageLayoutTabDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.LAYOUTS))
  async updatePageLayoutTab(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdatePageLayoutTabInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<PageLayoutTabDTO> {
    return this.pageLayoutTabService.update({
      id,
      workspaceId: workspace.id,
      updateData: input,
      userId: user?.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.LAYOUTS))
  async destroyPageLayoutTab(
    @Args('id', { type: () => String }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<boolean> {
    return this.pageLayoutTabService.destroy({
      id,
      workspaceId: workspace.id,
      userId: user?.id,
      workspaceMemberId,
    });
  }
}
