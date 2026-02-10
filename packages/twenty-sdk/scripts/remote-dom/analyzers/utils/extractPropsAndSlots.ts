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
  const propsTypeProperties = propsType.getProperties();

  for (const propertySymbol of propsTypeProperties) {
    const propertyName = propertySymbol.getName();

    const correspondingDomEvent = REACT_PROP_TO_DOM_EVENT[propertyName];

    if (correspondingDomEvent !== undefined) {
      events.push(correspondingDomEvent);
      continue;
    }

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

  return { properties, events, slots };
};
