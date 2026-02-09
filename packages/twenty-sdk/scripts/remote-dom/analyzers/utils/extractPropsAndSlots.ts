import { type Type } from 'ts-morph';

import { type PropertySchema } from '@/front-component/types/PropertySchema';
import { isDefined } from 'twenty-shared/utils';
import { REACT_PROP_TO_DOM_EVENT } from '../constants/ReactPropToDomEvent';
import { classifyPropertyType } from './classifyPropertyType';
import { isReactElementType } from './isReactElementType';

export type ExtractedProps = {
  properties: Record<string, PropertySchema>;
  events: string[];
  slots: string[];
};

export const extractPropsAndSlots = (propsType: Type): ExtractedProps => {
  const properties: Record<string, PropertySchema> = {};
  const events: string[] = [];
  const slots: string[] = [];
  const propsProperties = propsType.getProperties();

  for (const prop of propsProperties) {
    const propName = prop.getName();

    const domEvent = REACT_PROP_TO_DOM_EVENT[propName];

    if (domEvent !== undefined) {
      events.push(domEvent);
      continue;
    }

    const declarations = prop.getDeclarations();
    if (declarations.length === 0) continue;

    const declaration = declarations[0];
    const propType = declaration.getType();
    const isOptional =
      prop.isOptional() || propType.isNullable() || propType.isUndefined();

    if (isReactElementType(propType)) {
      slots.push(propName);
      continue;
    }

    const classifiedType = classifyPropertyType(propType);

    if (isDefined(classifiedType)) {
      properties[propName] = {
        type: classifiedType,
        optional: isOptional,
      };
    }
  }

  return { properties, events, slots };
};
