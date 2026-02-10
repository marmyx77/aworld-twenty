import * as path from 'path';
import { Project, type Type } from 'ts-morph';

import { type PropertySchema } from '@/front-component/types/PropertySchema';
import {
  COMPONENT_CATEGORIES,
  TWENTY_UI_ROOT_PATH,
  type CategoryConfig,
} from './constants';
import { extractPropsAndSlots } from './utils/extractPropsAndSlots';
import { pascalToKebab } from './utils/pascalToKebab';
import { shouldSkipExport } from './utils/shouldSkipExport';

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

const analyzeCategory = (
  project: Project,
  categoryConfig: CategoryConfig,
): DiscoveredComponent[] => {
  const { category, indexPath } = categoryConfig;
  const sourceFile = project.getSourceFile(indexPath);

  if (!sourceFile) {
    console.warn(`  Warning: Could not find barrel file at ${indexPath}`);
    return [];
  }

  const discoveredComponents: DiscoveredComponent[] = [];

  const propsTypeNames = new Set<string>();
  const exportDeclarations = sourceFile.getExportDeclarations();

  for (const exportDeclaration of exportDeclarations) {
    for (const namedExport of exportDeclaration.getNamedExports()) {
      const exportName = namedExport.getName();
      if (exportName.endsWith('Props')) {
        propsTypeNames.add(exportName);
      }
    }
  }

  for (const exportDeclaration of exportDeclarations) {
    for (const namedExport of exportDeclaration.getNamedExports()) {
      const exportName = namedExport.getName();

      if (shouldSkipExport(exportName)) continue;

      const expectedPropsTypeName = `${exportName}Props`;
      if (!propsTypeNames.has(expectedPropsTypeName)) continue;

      const propsTypeSymbol =
        sourceFile.getLocal(expectedPropsTypeName) ??
        sourceFile
          .getExportedDeclarations()
          .get(expectedPropsTypeName)?.[0]
          ?.getSymbol?.();

      if (!propsTypeSymbol) continue;

      let propsType: Type | undefined;

      const propsTypeDeclarations = sourceFile
        .getExportedDeclarations()
        .get(expectedPropsTypeName);

      if (propsTypeDeclarations && propsTypeDeclarations.length > 0) {
        propsType = propsTypeDeclarations[0].getType();
      }

      if (!propsType) continue;

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

export const analyzeAllCategories = (
  options: { verbose?: boolean } = {},
): DiscoveredComponent[] => {
  const verboseLog = options.verbose
    ? (...args: Parameters<typeof console.log>) => console.log(...args)
    : () => {};

  verboseLog('Loading twenty-ui TypeScript project...');

  const project = new Project({
    tsConfigFilePath: path.join(TWENTY_UI_ROOT_PATH, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  });

  verboseLog(
    `Loaded ${project.getSourceFiles().length} source files from twenty-ui\n`,
  );

  const allDiscoveredComponents: DiscoveredComponent[] = [];

  for (const categoryConfig of COMPONENT_CATEGORIES) {
    verboseLog(`Analyzing category: ${categoryConfig.category}`);
    const discoveredComponents = analyzeCategory(project, categoryConfig);
    verboseLog(`  Found ${discoveredComponents.length} components`);

    for (const discoveredComponent of discoveredComponents) {
      const propertyCount = Object.keys(discoveredComponent.properties).length;
      const eventCount = discoveredComponent.events.length;
      const slotCount = discoveredComponent.slots.length;
      const eventSummary =
        eventCount > 0
          ? `, ${eventCount} events: [${discoveredComponent.events.join(', ')}]`
          : '';
      const slotSummary =
        slotCount > 0
          ? `, ${slotCount} slots: [${discoveredComponent.slots.join(', ')}]`
          : '';
      verboseLog(
        `    ${discoveredComponent.componentImport} -> ${discoveredComponent.tag} (${propertyCount} props${eventSummary}${slotSummary})`,
      );
    }

    allDiscoveredComponents.push(...discoveredComponents);
  }

  return allDiscoveredComponents;
};
