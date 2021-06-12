/* eslint-disable @typescript-eslint/ban-types */
import { fsm, send, assign } from '../src';
import { Action, ActionFn } from '../src/types';

function delay(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const configDefault = {
  green: { on: { CHANGE: 'yellow' } },
  yellow: { on: { CHANGE: 'red' } },
  red: {},
};

test('Send - existing event', () => {
  const service = fsm('green', configDefault);
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('yellow');
});

test('Send - non-existing event', () => {
  const service = fsm('green', configDefault);
  expect(service.current).toBe('green');
  service.send('NON_EXISTING_EVENT');
  expect(service.current).toBe('green');
});

test('Send - non-existing target', () => {
  const config = {
    green: { on: { CHANGE: 'blue' } },
    yellow: { on: { CHANGE: 'red' } },
    red: {},
  };

  const service = fsm('green', config);
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('green');
});

test('Send - state without transition definition', () => {
  const config = { red: {} };
  const service = fsm('red', config);
  service.send('CHANGE');
  expect(service.current).toBe('red');
});

test('Send - transition object', () => {
  const config = {
    green: { on: { CHANGE: { target: 'yellow' } } },
    yellow: {},
  };

  const service = fsm('green', config);
  service.send('CHANGE');
  expect(service.current).toBe('yellow');
});

test('immutability', () => {
  const service = fsm('green', configDefault);
  expect(service.current).toBe('green');
  service.current = 'yellow';
  expect(service.current).toBe('green');
});

test('listener', () => {
  const cb = jest.fn((x) => x);
  const service = fsm('green', configDefault);
  service.listen(cb);
  service.send('CHANGE');
  expect(cb.mock.calls.length).toBe(1);
});

test('Incorrect initial state', () => {
  expect(() => fsm('wrongInitialState', configDefault)).toThrow(
    'Initial state does not exist'
  );
});

test('Entry actions - auto-transition', async () => {
  const configAutomatic = {
    green: { on: { CHANGE: 'yellow' } },
    yellow: {
      on: { CHANGE: 'red' },
      entry: send('CHANGE'),
    },
    red: {
      on: { CHANGE: 'green' },
      entry: send('CHANGE', 100),
    },
  };

  const service = fsm<{}>('green', configAutomatic);
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('red');
  await delay(100);
  expect(service.current).toBe('green');
});

test('Entry actions - auto-transition on initial state', () => {
  const configStart = {
    start: {
      on: { CHANGE: 'end' },
      entry: send('CHANGE'),
    },
    end: {},
  };

  const service = fsm<{}>('start', configStart);
  expect(service.current).toBe('end');
});

test('Entry actions - update context', () => {
  type Context = { count: number };

  const configStart = {
    start: {
      on: { CHANGE: 'end' },
    },
    end: {
      entry: assign((ctx: Context) => ({
        count: ctx.count + 1,
      })),
    },
  };

  const service = fsm<Context>('start', configStart, { count: 0 });
  expect(service.context.count).toBe(0);
  service.send('CHANGE');
  expect(service.current).toBe('end');
  expect(service.context.count).toBe(1);
});

test('Entry actions - update context based on transition input', () => {
  type Context = { count: number };
  type Obj = { count: number };

  const configStart = {
    start: {
      on: { CHANGE: 'end' },
    },
    end: {
      entry: assign(
        (ctx: Context, obj: unknown) =>
          ({ count: ctx.count + (obj as Obj)?.count || 0 } as Context)
      ),
    },
  };

  const service = fsm<Context>('start', configStart, { count: 0 });
  expect(service.context.count).toBe(0);
  service.send('CHANGE', 0, { count: 2 });
  expect(service.current).toBe('end');
  expect(service.context.count).toBe(2);
});

test('Entry actions - multiple actions', () => {
  type Context = { count: number };

  const configStart = {
    start: {
      on: { CHANGE: 'middle' },
    },
    middle: {
      on: { CHANGE: 'end' },
      entry: [
        assign((ctx: Context) => ({ count: ctx.count + 1 } as Context)),
        send('CHANGE') as Action<Context>,
      ],
    },
    end: {},
  };

  const service = fsm<Context>('start', configStart, { count: 0 });
  expect(service.context.count).toBe(0);
  service.send('CHANGE');
  expect(service.context.count).toBe(1);
  expect(service.current).toBe('end');
});

test('Guard - allowed', () => {
  type Context = { allowed: boolean };

  const config = {
    green: {
      on: {
        CHANGE: {
          target: 'yellow',
          guard: (c: Context) => c.allowed,
        },
      },
    },
    yellow: {},
  };

  const service = fsm<Context>('green', config, { allowed: true });
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('yellow');
});

test('Guard - allowed', () => {
  type Context = { allowed: boolean };

  const config = {
    green: {
      on: {
        CHANGE: {
          target: 'yellow',
          guard: (c: Context) => c.allowed,
        },
      },
    },
    yellow: {},
  };

  const service = fsm<Context>('green', config, { allowed: false });
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('green');
});
