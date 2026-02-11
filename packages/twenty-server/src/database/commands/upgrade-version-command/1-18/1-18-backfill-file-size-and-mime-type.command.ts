import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import kebabCase from 'lodash.kebabcase';
import { Command } from 'nest-commander';
import { FileFolder } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { DataSource, Equal, Repository } from 'typeorm';

import { ActiveOrSuspendedWorkspacesMigrationCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspaces-migration.command-runner';
import { RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspaces-migration.command-runner';
import { FileStorageService } from 'src/engine/core-modules/file-storage/file-storage.service';
import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import { extractFileInfo } from 'src/engine/core-modules/file/utils/extract-file-info.utils';
import { removeFileFolderFromFileEntityPath } from 'src/engine/core-modules/file/utils/remove-file-folder-from-file-entity-path.utils';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { DataSourceService } from 'src/engine/metadata-modules/data-source/data-source.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { streamToBuffer } from 'src/utils/stream-to-buffer';

@Command({
  name: 'upgrade:1-18:backfill-file-size-and-mime-type',
  description:
    'Backfill file size and mime type for files with missing or default values',
})
export class BackfillFileSizeAndMimeTypeCommand extends ActiveOrSuspendedWorkspacesMigrationCommandRunner {
  constructor(
    @InjectRepository(WorkspaceEntity)
    protected readonly workspaceRepository: Repository<WorkspaceEntity>,
    protected readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
    protected readonly dataSourceService: DataSourceService,
    private readonly fileStorageService: FileStorageService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {
    super(workspaceRepository, twentyORMGlobalManager, dataSourceService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Starting file size and mime type backfill for workspace ${workspaceId}`,
    );

    const { flatApplicationMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatApplicationMaps',
      ]);

    const fileRepository = this.coreDataSource.getRepository(FileEntity);

    const filesToBackfill = await fileRepository.find({
      where: [
        {
          workspaceId,
          size: Equal(-1),
        },
        {
          workspaceId,
          mimeType: Equal('application/octet-stream'),
        },
      ],
      select: [
        'id',
        'path',
        'applicationId',
        'workspaceId',
        'size',
        'mimeType',
      ],
    });

    if (filesToBackfill.length === 0) {
      this.logger.log(`No files to backfill for workspace ${workspaceId}`);

      return;
    }

    this.logger.log(
      `Found ${filesToBackfill.length} file(s) to backfill in workspace ${workspaceId}`,
    );

    for (const fileEntity of filesToBackfill) {
      try {
        this.logger.log(
          `Processing file ${fileEntity.id} (path: ${fileEntity.path})`,
        );

        const application = flatApplicationMaps.byId[fileEntity.applicationId];

        if (!application) {
          this.logger.error(
            `Application not found for file ${fileEntity.id} (applicationId: ${fileEntity.applicationId})`,
          );

          continue;
        }

        const fileFolder = Object.values(FileFolder).find((value) =>
          fileEntity.path.includes(kebabCase(value)),
        ) as FileFolder | undefined;

        if (!isDefined(fileFolder)) {
          this.logger.error(
            `File folder not found for file ${fileEntity.id} (path: ${fileEntity.path})`,
          );

          continue;
        }

        const fileStream = await this.fileStorageService.readFile({
          fileFolder,
          applicationUniversalIdentifier: application.universalIdentifier,
          workspaceId,
          resourcePath: removeFileFolderFromFileEntityPath(fileEntity.path),
        });

        const fileBuffer = await streamToBuffer(fileStream);

        const updateData: {
          size?: number;
          mimeType?: string;
        } = {};

        if (fileEntity.size === -1) {
          updateData.size = fileBuffer.length;
        }

        if (fileEntity.mimeType === 'application/octet-stream') {
          const { mimeType } = await extractFileInfo({
            file: fileBuffer,
            filename: fileEntity.path,
          });

          updateData.mimeType = mimeType;
        }

        if (!isDryRun) {
          await fileRepository.update({ id: fileEntity.id }, updateData);
        }

        const updateDetails = Object.entries(updateData)
          .map(([key, value]) => `${key}=${value}`)
          .join(', ');

        this.logger.log(
          `${isDryRun ? '[DRY RUN] ' : ''}Backfilled file ${fileEntity.id}: ${updateDetails}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to backfill file ${fileEntity.id} in workspace ${workspaceId}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Completed file size and mime type backfill for workspace ${workspaceId}`,
    );
  }
}
