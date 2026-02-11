import { type Type } from 'ts-morph';

import { type PropertySchema } from '@/front-component/types/PropertySchema';

type PropertyType = PropertySchema['type'];

export const classifyPropertyType = (
  propertyType: Type,
): PropertyType | null => {
  if (propertyType.isString() || propertyType.isStringLiteral())
    return 'string';
  if (propertyType.isNumber() || propertyType.isNumberLiteral())
    return 'number';
  if (propertyType.isBoolean() || propertyType.isBooleanLiteral())
    return 'boolean';

  if (propertyType.isArray()) return 'array';

  if (propertyType.isTuple()) return 'array';

  const callSignatures = propertyType.getCallSignatures();
  if (callSignatures.length > 0) return 'function';

  if (propertyType.isUnion()) {
    const unionMemberTypes = propertyType.getUnionTypes();

    const nonNullableTypes = unionMemberTypes.filter(
      (memberType) => !memberType.isUndefined() && !memberType.isNull(),
    );

    if (nonNullableTypes.length === 0) return null;

    const classifiedTypeSet = new Set(
      nonNullableTypes.map((memberType) => classifyPropertyType(memberType)),
    );

    if (classifiedTypeSet.size === 1) {
      return [...classifiedTypeSet][0];
    }

    const primitiveTypes = new Set(['string', 'number', 'boolean']);
    const allPrimitive = [...classifiedTypeSet].every(
      (type) => type !== null && primitiveTypes.has(type),
    );

    if (allPrimitive && classifiedTypeSet.size > 0) {
      return 'string';
    }
  }

  if (propertyType.isEnum() || propertyType.isEnumLiteral()) {
    return 'string';
  }

  if (propertyType.isObject() && !propertyType.isArray()) {
    return 'object';
  }

  return null;
};
