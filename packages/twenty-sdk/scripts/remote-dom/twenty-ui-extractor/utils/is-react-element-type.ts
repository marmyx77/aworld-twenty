import { type Type } from 'ts-morph';

const REACT_ELEMENT_TYPE_NAMES = ['ReactNode', 'ReactElement', 'JSX.Element'];

const REACT_COMPONENT_TYPE_NAMES = [
  'FunctionComponent',
  'ComponentType',
  'IconComponent',
];

export const isReactElementType = (propertyType: Type): boolean => {
  const typeTextRepresentation = propertyType.getText();

  const isReactElement = REACT_ELEMENT_TYPE_NAMES.some((typeName) =>
    typeTextRepresentation.includes(typeName),
  );

  if (isReactElement) {
    return true;
  }

  const isReactComponent = REACT_COMPONENT_TYPE_NAMES.some((typeName) =>
    typeTextRepresentation.includes(typeName),
  );

  if (isReactComponent) {
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
