import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

export const RULE_NAME = 'constants-upper-case';

const UPPER_CASE_RE = /^[A-Z][A-Z0-9_]*$/;

export const rule = ESLintUtils.RuleCreator(() => __filename)({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce SCREAMING_SNAKE_CASE for top-level const declarations in constants files',
    },
    messages: {
      notUpperCase:
        'Constant "{{ name }}" should be in SCREAMING_SNAKE_CASE (e.g. MY_CONSTANT).',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    return {
      VariableDeclarator: (node: TSESTree.VariableDeclarator) => {
        // Skip destructuring patterns (ObjectPattern, ArrayPattern)
        if (node.id.type !== 'Identifier') return;

        // Only flag top-level const declarations (module scope)
        const declaration = (node as any).parent;
        if (!declaration || declaration.kind !== 'const') return;

        const declarationParent = declaration.parent;
        if (
          !declarationParent ||
          (declarationParent.type !== 'Program' &&
            declarationParent.type !== 'ExportNamedDeclaration')
        ) {
          return;
        }

        const name = node.id.name;

        if (!UPPER_CASE_RE.test(name)) {
          context.report({
            node: node.id,
            messageId: 'notUpperCase',
            data: { name },
          });
        }
      },
    };
  },
});
