import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

export const RULE_NAME = 'prefer-arrow-functions';

// Check whether an AST subtree contains ThisExpression or references to `arguments`
const usesThisOrArguments = (node: any): boolean => {
  if (!node || typeof node !== 'object') return false;

  if (node.type === 'ThisExpression') return true;
  if (
    node.type === 'Identifier' &&
    node.name === 'arguments'
  ) {
    return true;
  }

  // Don't descend into nested functions — they have their own `this`/`arguments`
  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    return false;
  }

  for (const key of Object.keys(node)) {
    if (key === 'parent') continue; // avoid infinite loop

    const child = node[key];

    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item.type === 'string' && usesThisOrArguments(item)) {
          return true;
        }
      }
    } else if (child && typeof child.type === 'string') {
      if (usesThisOrArguments(child)) return true;
    }
  }

  return false;
};

export const rule = ESLintUtils.RuleCreator(() => __filename)({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer arrow functions over traditional function declarations and expressions',
    },
    messages: {
      preferArrow: 'Prefer arrow function instead of a traditional function.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const check = (
      node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression,
    ) => {
      // Skip generators
      if (node.generator) return;

      // Skip functions without a body (overload signatures)
      if (!node.body) return;

      // Skip class methods (parent is MethodDefinition or PropertyDefinition)
      const parent = (node as any).parent;
      if (
        parent &&
        (parent.type === 'MethodDefinition' ||
          parent.type === 'PropertyDefinition')
      ) {
        return;
      }

      // Skip object shorthand methods (parent is Property with method: true)
      if (
        parent &&
        parent.type === 'Property' &&
        parent.method === true
      ) {
        return;
      }

      // Skip overloaded function implementations — when preceding siblings
      // are function declarations with the same name but no body
      if (node.type === 'FunctionDeclaration' && (node as any).id) {
        const funcName = (node as any).id.name;
        const containerBody =
          parent && parent.type === 'ExportNamedDeclaration'
            ? (parent.parent as any)?.body
            : parent?.body;

        if (Array.isArray(containerBody)) {
          const thisNode =
            parent && parent.type === 'ExportNamedDeclaration'
              ? parent
              : node;
          const idx = containerBody.indexOf(thisNode);

          for (let i = idx - 1; i >= 0; i--) {
            let sibling = containerBody[i];

            // Unwrap ExportNamedDeclaration
            if (
              sibling.type === 'ExportNamedDeclaration' &&
              sibling.declaration
            ) {
              sibling = sibling.declaration;
            }

            if (
              (sibling.type === 'FunctionDeclaration' ||
                sibling.type === 'TSDeclareFunction') &&
              sibling.id?.name === funcName &&
              !sibling.body
            ) {
              return; // This is an overloaded function implementation
            }
          }
        }
      }

      // Skip functions that use `this` or `arguments`
      if (usesThisOrArguments(node.body)) return;

      context.report({
        node,
        messageId: 'preferArrow',
      });
    };

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
});
