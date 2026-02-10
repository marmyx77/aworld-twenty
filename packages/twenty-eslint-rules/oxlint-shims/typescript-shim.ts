// Lightweight shim for the `typescript` module.
// Replaces the full TypeScript compiler to avoid bundling 10MB+ into the plugin.
//
// Only exports TypeFlags constants used by eslint-plugin-lingui's
// isStringLiteralFromUnionType() function. That code path is gated behind
// the `useTsTypes` option and wrapped in try-catch, so it gracefully
// degrades when the full TypeScript API is unavailable.

export const TypeFlags = {
  Union: 1048576,
  StringLiteral: 128,
};
