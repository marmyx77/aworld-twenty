// Lightweight shim for @typescript-eslint/utils
// Replaces the heavy dependency chain (@typescript-eslint/utils → eslint → node:fs)
// which is incompatible with Oxlint's JS plugin runtime.

// AST_NODE_TYPES: enum where each key maps to its own string value.
// Using a Proxy so any AST_NODE_TYPES.Foo returns 'Foo'.
export const AST_NODE_TYPES: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  { get: (_target, key: string) => key },
);

// TSESTree namespace — rules access TSESTree.AST_NODE_TYPES at runtime
export const TSESTree = { AST_NODE_TYPES };

// ESLintUtils.RuleCreator: factory that produces rule objects with { meta, create, defaultOptions }
export const ESLintUtils = {
  RuleCreator:
    (_urlCreator: (name: string) => string) =>
    <TOptions extends readonly unknown[], TMessageIds extends string>({
      name,
      meta,
      defaultOptions = [] as unknown as TOptions,
      create,
    }: {
      name: string;
      meta: any;
      defaultOptions?: TOptions;
      create: (context: any, options: TOptions) => any;
    }) => ({
      meta: {
        ...meta,
        docs: { ...meta.docs, url: '' },
      },
      defaultOptions,
      create(context: any) {
        // Try context.options first (available in `create`-based rules),
        // fall back to defaultOptions (safe for `createOnce` where options may be null).
        let options: TOptions;
        try {
          const ctxOpts = context.options;
          if (ctxOpts && ctxOpts.length > 0) {
            options = ctxOpts.map((opt: any, i: number) => ({
              ...(defaultOptions[i] || {}),
              ...opt,
            })) as unknown as TOptions;
          } else {
            options = defaultOptions;
          }
        } catch {
          options = defaultOptions;
        }
        return create(context, options);
      },
    }),

  // Used by eslint-plugin-lingui when useTsTypes is enabled.
  // Returns null since Oxlint's runtime has no TypeScript parser services.
  getParserServices: (_context: any, _allowWithoutFullTypeInfo?: boolean) => null,
};

// TSESLint — only used in test files (*.spec.ts), not bundled into the plugin.
// Exported as empty object for completeness.
export const TSESLint = {};
