const SCREAMING_SNAKE_CASE_REGEX = /^[A-Z][A-Z_0-9]+$/;

export const shouldSkipExport = (exportName: string): boolean => {
  if (exportName.startsWith('Styled')) return true;
  if (exportName.startsWith('use')) return true;
  if (exportName.startsWith('Icon')) return true;
  if (exportName.startsWith('Illustration')) return true;
  if (exportName.endsWith('Provider')) return true;
  if (exportName.endsWith('State') || exportName.endsWith('state')) return true;
  if (SCREAMING_SNAKE_CASE_REGEX.test(exportName)) return true;
  if (exportName.startsWith('base') || exportName.startsWith('BASE'))
    return true;
  if (exportName.startsWith('get')) return true;

  return false;
};
