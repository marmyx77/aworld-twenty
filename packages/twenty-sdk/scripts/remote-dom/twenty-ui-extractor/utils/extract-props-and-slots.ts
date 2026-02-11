import { type Type } from 'ts-morph';

import { type PropertySchema } from '@/front-component/types/PropertySchema';
import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';
import { REACT_PROP_TO_DOM_EVENT } from '../constants/ReactPropToDomEvent';
import { classifyPropertyType } from './classify-property-type';
import { isDomEventHandler } from './is-dom-event-handler';
import { isReactElementType } from './is-react-element-type';

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

    const propertyDeclarations = propertySymbol.getDeclarations();

    if (!isNonEmptyArray(propertyDeclarations)) {
      continue;
    }

    const firstDeclaration = propertyDeclarations[0];
    const propertyType = firstDeclaration.getType();

    const correspondingDomEvent = REACT_PROP_TO_DOM_EVENT[propertyName];

    if (isDefined(correspondingDomEvent) && isDomEventHandler(propertyType)) {
      events.push(correspondingDomEvent);

      continue;
    }

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
