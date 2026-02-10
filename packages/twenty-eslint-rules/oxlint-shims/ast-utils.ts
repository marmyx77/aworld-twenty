// Lightweight shim for @typescript-eslint/utils/ast-utils
// Replaces heavy dependency on eslint internals with simple AST node type checks.

export const isIdentifier = (node: any): boolean =>
  node?.type === 'Identifier';

export const isVariableDeclarator = (node: any): boolean =>
  node?.type === 'VariableDeclarator';

export const isFunction = (node: any): boolean =>
  node?.type === 'FunctionDeclaration' ||
  node?.type === 'FunctionExpression' ||
  node?.type === 'ArrowFunctionExpression';
