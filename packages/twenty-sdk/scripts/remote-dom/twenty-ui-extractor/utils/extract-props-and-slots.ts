import { type Type } from 'ts-morph';

import { type PropertySchema } from '@/front-component/types/PropertySchema';
import { isDefined } from 'twenty-shared/utils';
import { classifyPropertyType } from './classify-property-type';
import { isReactElementType } from './is-react-element-type';

export type ExtractedProps = {
  properties: Record<string, PropertySchema>;
  slots: string[];
};

export const extractPropsAndSlots = (propsType: Type): ExtractedProps => {
  const properties: Record<string, PropertySchema> = {};
  const slots: string[] = [];
  const propsTypeProperties = propsType.getProperties();

  for (const propertySymbol of propsTypeProperties) {
    const propertyName = propertySymbol.getName();

    const propertyDeclarations = propertySymbol.getDeclarations();
    if (propertyDeclarations.length === 0) continue;

    const firstDeclaration = propertyDeclarations[0];
    const propertyType = firstDeclaration.getType();
    const isOptional =
      propertySymbol.isOptional() ||
      propertyType.isNullable() ||
      propertyType.isUndefined();

    if (isReactElementType(propertyType)) {
      slots.push(propertyName);
      continue;
    }

    const classifiedType = classifyPropertyType(propertyType);

    if (isDefined(classifiedType)) {
      properties[propertyName] = {
        type: classifiedType,
        optional: isOptional,
      };
    }
  }

  return { properties, slots };
};
