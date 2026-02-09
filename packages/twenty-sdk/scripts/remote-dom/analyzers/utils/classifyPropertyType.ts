import { type Type } from 'ts-morph';

import { type PropertySchema } from '@/front-component/types/PropertySchema';

type PropertyType = PropertySchema['type'];

export const classifyPropertyType = (type: Type): PropertyType | null => {
  if (type.isString() || type.isStringLiteral()) return 'string';
  if (type.isNumber() || type.isNumberLiteral()) return 'number';
  if (type.isBoolean() || type.isBooleanLiteral()) return 'boolean';

  if (type.isArray()) return 'array';

  if (type.isTuple()) return 'array';

  const callSignatures = type.getCallSignatures();
  if (callSignatures.length > 0) return 'function';

  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();

    const nonNullTypes = unionTypes.filter(
      (unionType) => !unionType.isUndefined() && !unionType.isNull(),
    );

    if (nonNullTypes.length === 0) return null;

    const classifiedTypes = new Set(
      nonNullTypes.map((unionType) => classifyPropertyType(unionType)),
    );

    if (classifiedTypes.size === 1) {
      return [...classifiedTypes][0];
    }
  }

  if (type.isEnum() || type.isEnumLiteral()) {
    return 'string';
  }

  if (type.isObject() && !type.isArray()) {
    return 'object';
  }

  return null;
};
