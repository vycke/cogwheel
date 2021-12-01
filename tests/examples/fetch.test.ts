import { fsm, assign } from '../../src';
import { State } from '../../src/types';

type Context = { result: unknown; errors: unknown };

const config: Record<string, State<Context>> = {
  idle: { STARTED: 'pending' },
  pending: { FINISHED: 'success', FAILED: 'error' },
  success: {
    STARTED: 'pending',
    _entry: [(_s, ctx: Context, values) => assign({ ...ctx, data: values })],
  },
  error: {
    STARTED: 'pending',
    _entry: [(_s, ctx: Context, values) => assign({ ...ctx, errors: values })],
  },
};

test('fetch - success', () => {
  const service = fsm<Context>('idle', config);
  expect(service.current).toBe('idle');
  service.send('STARTED');
  expect(service.current).toBe('pending');
  expect(service.context).toEqual({});
  service.send('FINISHED', true);
  expect(service.current).toBe('success');
  expect(service.context).toEqual({ data: true });
  service.send('STARTED');
  expect(service.current).toBe('pending');
  expect(service.context).toEqual({ data: true });
});

test('fetch - error', () => {
  const service = fsm<Context>('idle', config);
  expect(service.current).toBe('idle');
  service.send('STARTED');
  expect(service.current).toBe('pending');
  expect(service.context).toEqual({});
  service.send('FAILED', true);
  expect(service.current).toBe('error');
  expect(service.context).toEqual({ errors: true });
  service.send('STARTED');
  expect(service.current).toBe('pending');
  expect(service.context).toEqual({ errors: true });
});

test('fetch - restart (not possible)', () => {
  const service = fsm<Context>('idle', config);
  expect(service.current).toBe('idle');
  service.send('STARTED');
  expect(service.current).toBe('pending');
  service.send('STARTED');
  expect(service.current).toBe('pending');
});

test('fetch - incorrect failed', () => {
  const service = fsm<Context>('idle', config);
  expect(service.current).toBe('idle');
  service.send('STARTED');
  service.send('FINISHED');
  service.send('FAILED');
  expect(service.current).toBe('success');
});

test('fetch - jump to success', () => {
  const service = fsm<Context>('idle', config);
  expect(service.current).toBe('idle');
  service.send('FINISHED');
  expect(service.current).toBe('idle');
});
