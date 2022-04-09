/* eslint-disable @typescript-eslint/ban-types */
import { machine, send } from '../src';
import { Machine, State } from '../src/types';

type Context = { error: boolean };

function wait(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitAction(): Promise<void> {
  await wait(50);
}

const config: Record<string, State<Context>> = {
  idle: { START: 'pending' },
  pending: {
    ERROR: 'error',
    SUCCESS: 'success',
    _entry: [
      waitAction,
      async (_s, ctx: Context) => {
        try {
          await wait(100);
          if (ctx.error) throw Error('Dammit');
          return send({ type: 'SUCCESS' });
        } catch (e) {
          return send({ type: 'ERROR' });
        }
      },
    ],
  },
  success: {},
  error: {},
};

let service: Machine<Context>;

test('async - success', async () => {
  service = machine<Context>({
    init: 'idle',
    states: config,
    context: { error: false },
  });
  expect(service.current).toBe('idle');
  service.send({ type: 'START' });
  expect(service.current).toBe('pending');
  await wait(200);
  expect(service.current).toBe('success');
});

test('async - in between', async () => {
  service = machine<Context>({
    init: 'idle',
    states: config,
    context: { error: false },
  });
  expect(service.current).toBe('idle');
  service.send({ type: 'START' });
  expect(service.current).toBe('pending');
  await wait(120);
  expect(service.current).toBe('pending');
});

test('async - error', async () => {
  service = machine<Context>({
    init: 'idle',
    states: config,
    context: { error: true },
  });
  expect(service.current).toBe('idle');
  service.send({ type: 'START' });
  expect(service.current).toBe('pending');
  await wait(200);
  expect(service.current).toBe('error');
});
