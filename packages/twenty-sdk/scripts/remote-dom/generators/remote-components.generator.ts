import type { Project, SourceFile } from 'ts-morph';

import { isDefined } from 'twenty-shared/utils';
import { type ComponentSchema } from './schemas';
import { addExportedConst, addFileHeader, eventToReactProp } from './utils';

type ImportGroup = {
  typeImports: string[];
};

const groupPropsTypeImportsByPath = (
  components: ComponentSchema[],
): Map<string, ImportGroup> => {
  const importsByPath = new Map<string, ImportGroup>();

  for (const component of components) {
    if (
      !component.isHtmlElement &&
      isDefined(component.componentPath) &&
      isDefined(component.propsTypeName)
    ) {
      const existing = importsByPath.get(component.componentPath) ?? {
        typeImports: [],
      };

      if (!existing.typeImports.includes(component.propsTypeName)) {
        existing.typeImports.push(component.propsTypeName);
      }

      importsByPath.set(component.componentPath, existing);
    }
  }

  return importsByPath;
};

const generateComponentDefinition = (
  sourceFile: SourceFile,
  component: ComponentSchema,
): void => {
  const hasEvents = component.events.length > 0;
  const componentExportName = component.tagName;

  let initializer: string;

  if (hasEvents) {
    const eventProps = component.events
      .map((event) => {
        const propName = eventToReactProp(event);
        return `    ${propName}: { event: '${event}' },`;
      })
      .join('\n');

    initializer = `createRemoteComponent('${component.customElementName}', ${component.name}Element, {
  eventProps: {
${eventProps}
  },
})`;
  } else {
    initializer = `createRemoteComponent('${component.customElementName}', ${component.name}Element)`;
  }

  addExportedConst(sourceFile, componentExportName, initializer);
};

export const generateRemoteComponents = (
  project: Project,
  components: ComponentSchema[],
): SourceFile => {
  const sourceFile = project.createSourceFile('remote-components.ts', '', {
    overwrite: true,
  });

  sourceFile.addImportDeclaration({
    moduleSpecifier: '@remote-dom/react',
    namedImports: ['createRemoteComponent'],
  });

  const elementImports = components.map(
    (component) => `${component.name}Element`,
  );

  sourceFile.addImportDeclaration({
    moduleSpecifier: './remote-elements',
    namedImports: elementImports,
  });

  // Import original Props types from twenty-ui for type-safe components
  const propsTypeImports = groupPropsTypeImportsByPath(components);

  for (const [modulePath, importGroup] of propsTypeImports) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: modulePath,
      namedImports: importGroup.typeImports.map((typeName) => ({
        name: typeName,
        isTypeOnly: true,
      })),
    });
  }

  for (const component of components) {
    generateComponentDefinition(sourceFile, component);
  }

  addFileHeader(sourceFile);

  return sourceFile;
};
