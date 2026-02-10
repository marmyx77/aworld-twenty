// Oxlint JS plugin entry point — uses the alternative `createOnce` API for
// better performance while remaining ESLint-compatible via eslintCompatPlugin.
//
// Rules excluded (not portable to Oxlint JS plugins):
//   - explicit-boolean-predicates-in-if: requires TypeScript type checker
//   - mdx-component-newlines / no-angle-bracket-placeholders: MDX-only
//   - sort-css-properties-alphabetically: depends on postcss (Node.js built-ins)
//   - graphql-resolvers-should-be-guarded / rest-api-methods-should-be-guarded /
//     inject-workspace-repository: backend-only

import { eslintCompatPlugin } from '@oxlint/plugins';
import type { TSESTree } from '@typescript-eslint/utils';
import { isIdentifier } from '@typescript-eslint/utils/ast-utils';

import {
  rule as componentPropsNaming,
  RULE_NAME as componentPropsNamingName,
} from './rules/component-props-naming';
import {
  rule as effectComponents,
  RULE_NAME as effectComponentsName,
} from './rules/effect-components';
import {
  rule as matchingStateVariable,
  RULE_NAME as matchingStateVariableName,
} from './rules/matching-state-variable';
import { RULE_NAME as maxConstsPerFileName } from './rules/max-consts-per-file';
import {
  rule as noHardcodedColors,
  RULE_NAME as noHardcodedColorsName,
} from './rules/no-hardcoded-colors';
import { RULE_NAME as noNavigatePreferLinkName } from './rules/no-navigate-prefer-link';
import {
  rule as noStateUseref,
  RULE_NAME as noStateUserefName,
} from './rules/no-state-useref';
import {
  rule as styledComponentsPrefixedWithStyled,
  RULE_NAME as styledComponentsPrefixedWithStyledName,
} from './rules/styled-components-prefixed-with-styled';
import {
  rule as useGetLoadableAndGetValueToGetAtoms,
  RULE_NAME as useGetLoadableAndGetValueToGetAtomsName,
} from './rules/use-getLoadable-and-getValue-to-get-atoms';
import {
  rule as useRecoilCallbackHasDependencyArray,
  RULE_NAME as useRecoilCallbackHasDependencyArrayName,
} from './rules/useRecoilCallback-has-dependency-array';

// Adapt a stateless ESLint rule to the createOnce API.
// For rules that don't capture per-file mutable state in create(),
// createOnce is a direct replacement.
const toCreateOnce = (rule: any) => ({
  ...rule,
  createOnce: rule.create,
  create: undefined,
});

// ── Stateful rules adapted with before() hooks ──────────────────────────────

// max-consts-per-file: resets constCount per file
const maxConstsPerFileOxlint = {
  meta: {
    type: 'problem' as const,
    docs: {
      description:
        'Ensure there are at most a specified number of const declarations per file',
    },
    fixable: 'code' as const,
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 0 } },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyConstants:
        'Only a maximum of ({{ max }}) const declarations are allowed in this file.',
    },
  },
  createOnce(context: any) {
    let constCount: number;

    return {
      before() {
        constCount = 0;
      },
      VariableDeclaration(node: TSESTree.VariableDeclaration) {
        constCount++;
        const max = context.options?.[0]?.max ?? 1;

        if (constCount > max) {
          context.report({ node, messageId: 'tooManyConstants', data: { max } });
        }
      },
    };
  },
};

// no-navigate-prefer-link: resets functionMap per file
const noNavigatePreferLinkOxlint = {
  meta: {
    type: 'suggestion' as const,
    docs: {
      description:
        'Discourage usage of navigate() where a simple <Link> component would suffice.',
    },
    messages: {
      preferLink: 'Use <Link> instead of navigate() for pure navigation.',
    },
    schema: [],
  },
  createOnce(context: any) {
    let functionMap: Record<string, TSESTree.ArrowFunctionExpression>;

    const hasSingleNavigateCall = (
      func: TSESTree.ArrowFunctionExpression,
    ) => {
      if (
        func.body.type === 'CallExpression' &&
        func.body.callee.type === 'Identifier' &&
        func.body.callee.name === 'navigate'
      ) {
        return true;
      }
      if (
        func.body.type === 'BlockStatement' &&
        func.body.body.length === 1 &&
        func.body.body[0].type === 'ExpressionStatement' &&
        func.body.body[0].expression.type === 'CallExpression' &&
        func.body.body[0].expression.callee.type === 'Identifier' &&
        func.body.body[0].expression.callee.name === 'navigate'
      ) {
        return true;
      }
      return false;
    };

    return {
      before() {
        functionMap = {};
      },
      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        if (
          node.init?.type === 'ArrowFunctionExpression' &&
          isIdentifier(node.id)
        ) {
          functionMap[node.id.name] = node.init;
          if (hasSingleNavigateCall(node.init)) {
            context.report({ node: node.init, messageId: 'preferLink' });
          }
        }
      },
      JSXAttribute(node: any) {
        if (
          node.name.name === 'onClick' &&
          node.value?.type === 'JSXExpressionContainer'
        ) {
          const expression = node.value.expression;
          if (
            expression.type === 'ArrowFunctionExpression' &&
            hasSingleNavigateCall(expression)
          ) {
            context.report({ node: expression, messageId: 'preferLink' });
          } else if (
            expression.type === 'Identifier' &&
            functionMap[expression.name]
          ) {
            if (hasSingleNavigateCall(functionMap[expression.name])) {
              context.report({ node: expression, messageId: 'preferLink' });
            }
          }
        }
      },
    };
  },
};

// ── Plugin export ────────────────────────────────────────────────────────────

export default eslintCompatPlugin({
  meta: {
    name: 'twenty',
  },
  rules: {
    // Stateless rules — createOnce is a direct swap for create
    [componentPropsNamingName]: toCreateOnce(componentPropsNaming),
    [effectComponentsName]: toCreateOnce(effectComponents),
    [matchingStateVariableName]: toCreateOnce(matchingStateVariable),
    [noHardcodedColorsName]: toCreateOnce(noHardcodedColors),
    [noStateUserefName]: toCreateOnce(noStateUseref),
    [styledComponentsPrefixedWithStyledName]: toCreateOnce(styledComponentsPrefixedWithStyled),
    [useGetLoadableAndGetValueToGetAtomsName]: toCreateOnce(useGetLoadableAndGetValueToGetAtoms),
    [useRecoilCallbackHasDependencyArrayName]: toCreateOnce(useRecoilCallbackHasDependencyArray),

    // Stateful rules — manually adapted with before() hooks
    [maxConstsPerFileName]: maxConstsPerFileOxlint,
    [noNavigatePreferLinkName]: noNavigatePreferLinkOxlint,
  },
});
