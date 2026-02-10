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

// eslint-plugin-lingui: bundled via esbuild with typescript aliased to a
// lightweight shim (TypeFlags constants only). The rule's TypeScript type
// checker path (useTsTypes) gracefully degrades via try-catch.
// @ts-expect-error — importing compiled CJS from node_modules
import { rule as linguiNoUnlocalizedStrings } from 'eslint-plugin-lingui/lib/rules/no-unlocalized-strings';

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
import {
  rule as maxConstsPerFile,
  RULE_NAME as maxConstsPerFileName,
} from './rules/max-consts-per-file';
import {
  rule as noHardcodedColors,
  RULE_NAME as noHardcodedColorsName,
} from './rules/no-hardcoded-colors';
import {
  rule as noNavigatePreferLink,
  RULE_NAME as noNavigatePreferLinkName,
} from './rules/no-navigate-prefer-link';
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
// createOnce is a direct replacement and more performant (called once).
const toCreateOnce = (rule: any) => ({
  ...rule,
  createOnce: rule.create,
  create: undefined,
});

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

    // Stateful rules — keep `create` (called per file, state resets naturally).
    // eslintCompatPlugin leaves rules with `create` as-is.
    [maxConstsPerFileName]: maxConstsPerFile,
    [noNavigatePreferLinkName]: noNavigatePreferLink,

    // Third-party rules — bundled from eslint-plugin-lingui.
    // Also uses `create` for per-file state (visited WeakSet) and context.options.
    'no-unlocalized-strings': linguiNoUnlocalizedStrings,
  },
});
