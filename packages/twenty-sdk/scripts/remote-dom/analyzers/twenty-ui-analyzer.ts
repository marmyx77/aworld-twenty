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

  const discovered: DiscoveredComponent[] = [];

  const propsTypeNames = new Set<string>();
  const exportDeclarations = sourceFile.getExportDeclarations();

  for (const exportDecl of exportDeclarations) {
    for (const namedExport of exportDecl.getNamedExports()) {
      const exportName = namedExport.getName();
      if (exportName.endsWith('Props')) {
        propsTypeNames.add(exportName);
      }
    }
  }

  for (const exportDecl of exportDeclarations) {
    for (const namedExport of exportDecl.getNamedExports()) {
      const exportName = namedExport.getName();

      if (shouldSkipExport(exportName)) continue;

      const expectedPropsName = `${exportName}Props`;
      if (!propsTypeNames.has(expectedPropsName)) continue;

      const propsTypeSymbol =
        sourceFile.getLocal(expectedPropsName) ??
        sourceFile
          .getExportedDeclarations()
          .get(expectedPropsName)?.[0]
          ?.getSymbol?.();

      if (!propsTypeSymbol) continue;

      let propsType: Type | undefined;

      const propsDeclarations = sourceFile
        .getExportedDeclarations()
        .get(expectedPropsName);

      if (propsDeclarations && propsDeclarations.length > 0) {
        propsType = propsDeclarations[0].getType();
      }

      if (!propsType) continue;

      const { properties, events, slots } = extractPropsAndSlots(propsType);
      const kebabName = pascalToKebab(exportName);

      discovered.push({
        tag: `twenty-ui-${kebabName}`,
        name: `TwentyUi${exportName}`,
        properties,
        events,
        slots,
        componentImport: exportName,
        componentPath: `twenty-ui/${category}`,
        propsTypeName: expectedPropsName,
      });
    }
  }

  return discovered;
};

export const analyzeAllCategories = (
  options: { verbose?: boolean } = {},
): DiscoveredComponent[] => {
  const log = options.verbose
    ? (...args: Parameters<typeof console.log>) => console.log(...args)
    : () => {};

  log('Loading twenty-ui TypeScript project...');

  const project = new Project({
    tsConfigFilePath: path.join(TWENTY_UI_ROOT_PATH, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  });

  log(
    `Loaded ${project.getSourceFiles().length} source files from twenty-ui\n`,
  );

  const allComponents: DiscoveredComponent[] = [];

  for (const categoryConfig of COMPONENT_CATEGORIES) {
    log(`Analyzing category: ${categoryConfig.category}`);
    const components = analyzeCategory(project, categoryConfig);
    log(`  Found ${components.length} components`);

    for (const component of components) {
      const propCount = Object.keys(component.properties).length;
      const eventCount = component.events.length;
      const slotCount = component.slots.length;
      const eventInfo =
        eventCount > 0
          ? `, ${eventCount} events: [${component.events.join(', ')}]`
          : '';
      const slotInfo =
        slotCount > 0
          ? `, ${slotCount} slots: [${component.slots.join(', ')}]`
          : '';
      log(
        `    ${component.componentImport} -> ${component.tag} (${propCount} props${eventInfo}${slotInfo})`,
      );
    }

    allComponents.push(...components);
  }

  return allComponents;
};
