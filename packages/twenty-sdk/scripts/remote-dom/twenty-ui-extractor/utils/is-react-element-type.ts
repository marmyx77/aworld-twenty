import { type Type } from 'ts-morph';

const REACT_ELEMENT_TYPE_NAMES = new Set([
  'ReactNode',
  'ReactElement',
  'Element',
]);

const REACT_COMPONENT_TYPE_NAMES = new Set([
  'FunctionComponent',
  'ComponentType',
  'IconComponent',
]);

const getTypeSymbolName = (type: Type): string | undefined => {
  return (type.getSymbol() ?? type.getAliasSymbol())?.getName();
};

export const isReactElementType = (propertyType: Type): boolean => {
  const symbolName = getTypeSymbolName(propertyType);

  if (
    symbolName !== undefined &&
    (REACT_ELEMENT_TYPE_NAMES.has(symbolName) ||
      REACT_COMPONENT_TYPE_NAMES.has(symbolName))
  ) {
    return true;
  }

  if (propertyType.isUnion()) {
    const unionMemberTypes = propertyType.getUnionTypes();
    const nonNullableTypes = unionMemberTypes.filter(
      (memberType) => !memberType.isUndefined() && !memberType.isNull(),
    );

    return nonNullableTypes.some((memberType) =>
      isReactElementType(memberType),
    );
  }

  return false;
};
