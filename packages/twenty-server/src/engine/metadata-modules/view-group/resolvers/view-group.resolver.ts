import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CreateViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/create-view-group.input';
import { DeleteViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/delete-view-group.input';
import { DestroyViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/destroy-view-group.input';
import { UpdateViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/update-view-group.input';
import { ViewGroupDTO } from 'src/engine/metadata-modules/view-group/dtos/view-group.dto';
import { ViewGroupService } from 'src/engine/metadata-modules/view-group/services/view-group.service';
import { ViewGroupGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/view-group/utils/view-group-graphql-api-exception.filter';
import { CreateViewGroupPermissionGuard } from 'src/engine/metadata-modules/view-permissions/guards/create-view-group-permission.guard';
import { DeleteViewGroupPermissionGuard } from 'src/engine/metadata-modules/view-permissions/guards/delete-view-group-permission.guard';
import { DestroyViewGroupPermissionGuard } from 'src/engine/metadata-modules/view-permissions/guards/destroy-view-group-permission.guard';
import { UpdateViewGroupPermissionGuard } from 'src/engine/metadata-modules/view-permissions/guards/update-view-group-permission.guard';

@Resolver(() => ViewGroupDTO)
@UseFilters(ViewGroupGraphqlApiExceptionFilter)
@UseGuards(WorkspaceAuthGuard)
export class ViewGroupResolver {
  constructor(private readonly viewGroupService: ViewGroupService) {}

  @Query(() => [ViewGroupDTO])
  @UseGuards(NoPermissionGuard)
  async getCoreViewGroups(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('viewId', { type: () => String, nullable: true })
    viewId?: string,
  ): Promise<ViewGroupDTO[]> {
    if (viewId) {
      return this.viewGroupService.findByViewId(workspace.id, viewId);
    }

    return this.viewGroupService.findByWorkspaceId(workspace.id);
  }

  @Query(() => ViewGroupDTO, { nullable: true })
  @UseGuards(NoPermissionGuard)
  async getCoreViewGroup(
    @Args('id', { type: () => String }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<ViewGroupDTO | null> {
    return this.viewGroupService.findById(id, workspace.id);
  }

  @Mutation(() => ViewGroupDTO)
  @UseGuards(CreateViewGroupPermissionGuard)
  async createCoreViewGroup(
    @Args('input') createViewGroupInput: CreateViewGroupInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<ViewGroupDTO> {
    return await this.viewGroupService.createOne({
      createViewGroupInput,
      workspaceId,
      userId: user?.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => [ViewGroupDTO])
  @UseGuards(CreateViewGroupPermissionGuard)
  async createManyCoreViewGroups(
    @Args('inputs', { type: () => [CreateViewGroupInput] })
    createViewGroupInputs: CreateViewGroupInput[],
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<ViewGroupDTO[]> {
    return await this.viewGroupService.createMany({
      createViewGroupInputs,
      workspaceId,
      userId: user?.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => ViewGroupDTO)
  @UseGuards(UpdateViewGroupPermissionGuard)
  async updateCoreViewGroup(
    @Args('input') updateViewGroupInput: UpdateViewGroupInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<ViewGroupDTO> {
    return await this.viewGroupService.updateOne({
      updateViewGroupInput,
      workspaceId,
      userId: user?.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => ViewGroupDTO)
  @UseGuards(DeleteViewGroupPermissionGuard)
  async deleteCoreViewGroup(
    @Args('input') deleteViewGroupInput: DeleteViewGroupInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<ViewGroupDTO> {
    return await this.viewGroupService.deleteOne({
      deleteViewGroupInput,
      workspaceId,
      userId: user?.id,
      workspaceMemberId,
    });
  }

  @Mutation(() => ViewGroupDTO)
  @UseGuards(DestroyViewGroupPermissionGuard)
  async destroyCoreViewGroup(
    @Args('input') destroyViewGroupInput: DestroyViewGroupInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @AuthUser({ allowUndefined: true }) user: UserEntity | undefined,
    @AuthUserWorkspaceId() workspaceMemberId: string | undefined,
  ): Promise<ViewGroupDTO> {
    return await this.viewGroupService.destroyOne({
      destroyViewGroupInput,
      workspaceId,
      userId: user?.id,
      workspaceMemberId,
    });
  }
}
