import * as path from 'path';
import { Project } from 'ts-morph';
import { isDefined, isNonEmptyArray, pascalToKebab } from 'twenty-shared/utils';

import { type PropertySchema } from '@/front-component/types/PropertySchema';

import {
  logCategory,
  logCountInline,
  logDimText,
  logEmpty,
  logLine,
  logWarning,
} from '../utils/logger';
import {
  TWENTY_UI_COMPONENT_CATEGORIES_TO_SCAN,
  TWENTY_UI_ROOT_PATH,
} from './constants';
import { extractPropsAndSlots } from './utils/extract-props-and-slots';
import { getTwentyUiComponentCategoryIndexPath } from './utils/get-twenty-ui-component-category-index-path';
import { logDiscoveredComponents } from './utils/log-discovered-components';
import { shouldSkipExport } from './utils/should-skip-export';

export type DiscoveredComponent = {
  tag: string;
  name: string;
  properties: Record<string, PropertySchema>;
  events: string[];
  slots: string[];
  componentImport: string;
  componentPath: string;
  propsTypeName: string;
};

const extractComponentsFromCategory = (
  project: Project,
  category: string,
): DiscoveredComponent[] => {
  const indexPath = getTwentyUiComponentCategoryIndexPath(category);
  const sourceFile = project.getSourceFile(indexPath);

  if (!isDefined(sourceFile)) {
    logWarning(`Could not find barrel file at ${indexPath}`);

    return [];
  }

  const discoveredComponents: DiscoveredComponent[] = [];

  const exportDeclarations = sourceFile.getExportDeclarations();

  const propsTypeNames = new Set(
    exportDeclarations
      .flatMap((declaration) => declaration.getNamedExports())
      .map((namedExport) => namedExport.getName())
      .filter((name) => name.endsWith('Props')),
  );

  for (const exportDeclaration of exportDeclarations) {
    for (const namedExport of exportDeclaration.getNamedExports()) {
      const exportName = namedExport.getName();

      if (shouldSkipExport(exportName)) {
        continue;
      }

      const expectedPropsTypeName = `${exportName}Props`;

      if (!propsTypeNames.has(expectedPropsTypeName)) {
        continue;
      }

      const propsTypeDeclarations = sourceFile
        .getExportedDeclarations()
        .get(expectedPropsTypeName);

      if (!isNonEmptyArray(propsTypeDeclarations)) {
        continue;
      }

      const propsType = propsTypeDeclarations[0].getType();

      const { properties, events, slots } = extractPropsAndSlots(propsType);

      const kebabName = pascalToKebab(exportName);

      discoveredComponents.push({
        tag: `twenty-ui-${kebabName}`,
        name: `TwentyUi${exportName}`,
        properties,
        events,
        slots,
        componentImport: exportName,
        componentPath: `twenty-ui/${category}`,
        propsTypeName: expectedPropsTypeName,
      });
    }
  }

  return discoveredComponents;
};

export const extractAllComponents = (): DiscoveredComponent[] => {
  logDimText('  Loading twenty-ui TypeScript project...');

  const project = new Project({
    tsConfigFilePath: path.join(TWENTY_UI_ROOT_PATH, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  });

  logLine(
    '  ' +
      logCountInline(
        project.getSourceFiles().length,
        'source file loaded from twenty-ui',
        'source files loaded from twenty-ui',
      ),
  );
  logEmpty();

  const allDiscoveredComponents: DiscoveredComponent[] = [];

  for (const [
    index,
    category,
  ] of TWENTY_UI_COMPONENT_CATEGORIES_TO_SCAN.entries()) {
    if (index > 0) {
      logEmpty();
    }

    logCategory(category);

    const discoveredComponents = extractComponentsFromCategory(
      project,
      category,
    );

    logDiscoveredComponents(discoveredComponents);

    allDiscoveredComponents.push(...discoveredComponents);
  }

  return allDiscoveredComponents;
};
