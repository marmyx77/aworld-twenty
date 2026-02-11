export const setWorkerEnv = (env: Record<string, string>) => {
  (globalThis as Record<string, unknown>)['process'] = { env };
};
