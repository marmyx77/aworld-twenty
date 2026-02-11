import { setWorkerEnv } from '../setWorkerEnv';

describe('setWorkerEnv', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>)['process'];
  });

  it('should set process.env on globalThis', () => {
    setWorkerEnv({
      TWENTY_API_KEY: 'test-key',
      TWENTY_API_URL: 'https://api.example.com',
    });

    const proc = (globalThis as Record<string, unknown>)['process'] as Record<
      string,
      unknown
    >;

    const env = proc['env'] as Record<string, string>;

    expect(env['TWENTY_API_KEY']).toBe('test-key');
    expect(env['TWENTY_API_URL']).toBe('https://api.example.com');
  });
});
