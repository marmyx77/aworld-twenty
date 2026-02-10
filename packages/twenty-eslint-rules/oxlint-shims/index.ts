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
        // In Oxlint's createOnce API, context.options throws.
        // Always use defaultOptions for compatibility.
        return create(context, defaultOptions);
      },
    }),
};

// TSESLint — only used in test files (*.spec.ts), not bundled into the plugin.
// Exported as empty object for completeness.
export const TSESLint = {};
