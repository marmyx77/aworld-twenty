import { type Type } from 'ts-morph';

export const isReactElementType = (type: Type): boolean => {
  const typeText = type.getText();

  if (
    typeText.includes('ReactNode') ||
    typeText.includes('ReactElement') ||
    typeText.includes('JSX.Element')
  ) {
    return true;
  }

  if (
    typeText.includes('FunctionComponent') ||
    typeText.includes('ComponentType') ||
    typeText.includes('IconComponent')
  ) {
    return true;
  }

  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    const nonNullTypes = unionTypes.filter(
      (unionType) => !unionType.isUndefined() && !unionType.isNull(),
    );

    return nonNullTypes.some((unionType) => isReactElementType(unionType));
  }

  return false;
};
