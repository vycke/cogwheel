/* eslint-disable @typescript-eslint/ban-types */
import { machine, send, assign } from '../src';
import { Action } from '../src/types';
import { delay } from './helpers';

// Types
type Context = { count: number };

// Default configuration
let cb: jest.Mock;

const configDefault = {
  green: { CHANGE: 'yellow' },
  yellow: { CHANGE: 'red' },
  red: {},
};

const countAssign: Action<Context> = function (
  _s: string,
  ctx: Context,
  values?: unknown
) {
  if ((values as Context)?.count)
    return assign({ count: ctx.count + (values as Context).count });
  return assign({ count: ctx.count + 1 });
};

const logAction: Action<{}> = function (state): void {
  cb(state);
};

// Actual tests
beforeEach(() => {
  cb = jest.fn((x) => x);
});

test('Send - existing event', () => {
  const service = machine({ init: 'green', states: configDefault });
  expect(service.current).toBe('green');
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('yellow');
});

test('Send - non-existing event', () => {
  const service = machine({ init: 'green', states: configDefault });
  expect(service.current).toBe('green');
  service.send({ type: 'NON_EXISTING_EVENT' });
  expect(service.current).toBe('green');
});

test('Send - non-existing target', () => {
  const config = {
    green: { CHANGE: 'blue' },
    yellow: { CHANGE: 'red' },
    red: {},
  };

  const service = machine({ init: 'green', states: config });
  expect(service.current).toBe('green');
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('green');
});

test('Send - state without transition definition', () => {
  const config = { red: {} };
  const service = machine({ init: 'red', states: config });
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('red');
});

test('Send - transition object', () => {
  const config = {
    green: { CHANGE: { target: 'yellow' } },
    yellow: {},
  };

  const service = machine({ init: 'green', states: config });
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('yellow');
});

test('immutability', () => {
  const service = machine({ init: 'green', states: configDefault });
  expect(service.current).toBe('green');
  service.current = 'yellow';
  expect(service.current).toBe('green');
});

test('listener', () => {
  const service = machine({ init: 'green', states: configDefault });
  service.listen(cb);
  service.send({ type: 'CHANGE' });
  expect(cb.mock.calls.length).toBe(1);
});

test('Incorrect initial state', () => {
  expect(() =>
    machine({ init: 'WrongInitialState', states: configDefault })
  ).toThrow('Initial state does not exist');
});

test('General purpose action', () => {
  const configStart = {
    start: {
      CHANGE: 'end',
      _entry: [logAction],
    },
    end: {},
  };

  machine<{}>({ init: 'start', states: configStart });
  expect(cb.mock.calls.length).toBe(1);
});

test('General purpose action (double)', () => {
  const configStart = {
    start: {
      CHANGE: 'end',
      _entry: [logAction, logAction],
    },
    end: {},
  };

  machine<{}>({ init: 'start', states: configStart });
  expect(cb.mock.calls.length).toBe(2);
});

test('Entry actions - auto-transition', async () => {
  const configAutomatic = {
    green: { CHANGE: 'yellow' },
    yellow: {
      CHANGE: 'red',
      _entry: [() => send({ type: 'CHANGE' })],
    },
    red: {
      CHANGE: 'green',
      _entry: [() => send({ type: 'CHANGE', delay: 100 })],
    },
  };

  const service = machine<{}>({ init: 'green', states: configAutomatic });
  expect(service.current).toBe('green');
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('red');
  await delay(100);
  expect(service.current).toBe('green');
});

test('Entry actions - auto-transition on initial state', () => {
  const configStart = {
    start: {
      _entry: [() => send({ type: 'CHANGE' })],
      CHANGE: 'end',
    },
    end: {},
  };

  const service = machine<{}>({ init: 'start', states: configStart });
  expect(service.current).toBe('end');
});

test('Entry actions - update context', () => {
  type Context = { count: number };

  const configStart = {
    start: { CHANGE: 'end' },
    end: {
      _entry: [countAssign],
    },
  };

  const service = machine<Context>({
    init: 'start',
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('end');
  expect(service.context.count).toBe(1);
});

test('Entry actions - update context based on transition input', () => {
  type Context = { count: number };

  const configStart = {
    start: { CHANGE: 'end' },
    end: {
      _entry: [countAssign],
    },
  };

  const service = machine<Context>({
    init: 'start',
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: 'CHANGE', payload: { count: 2 } });
  expect(service.current).toBe('end');
  expect(service.context.count).toBe(2);
});

test('Entry actions - multiple actions', () => {
  type Context = { count: number };

  const configStart = {
    start: { CHANGE: 'middle' },
    middle: {
      CHANGE: 'end',
      _entry: [countAssign, () => send({ type: 'CHANGE' })],
    },
    end: {},
  };

  const service = machine<Context>({
    init: 'start',
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: 'CHANGE' });
  expect(service.context.count).toBe(1);
  expect(service.current).toBe('end');
});

test('Exit actions - update context', () => {
  type Context = { count: number };

  const configStart = {
    start: {
      CHANGE: 'end',
      _exit: [countAssign],
    },
    end: {},
  };

  const service = machine<Context>({
    init: 'start',
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('end');
  expect(service.context.count).toBe(1);
});

test('Transition actions - update context', () => {
  type Context = { count: number };

  const configStart = {
    start: {
      CHANGE: {
        target: 'end',
        actions: [countAssign],
      },
    },
    end: {},
  };

  const service = machine<Context>({
    init: 'start',
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('end');
  expect(service.context.count).toBe(1);
});

test('Guard - allowed', () => {
  type Context = { allowed: boolean };

  const config = {
    green: {
      CHANGE: {
        target: 'yellow',
        guard: (c: Context) => c.allowed,
      },
    },
    yellow: {},
  };

  const service = machine<Context>({
    init: 'green',
    states: config,
    context: { allowed: true },
  });
  expect(service.current).toBe('green');
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('yellow');
});

test('Guard - not allowed', () => {
  type Context = { allowed: boolean };

  const config = {
    green: {
      CHANGE: {
        target: 'yellow',
        guard: (c: Context) => c.allowed,
      },
    },
    yellow: {},
  };

  const service = machine<Context>({
    init: 'green',
    states: config,
    context: { allowed: false },
  });
  expect(service.current).toBe('green');
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('green');
});

test('Actions - break after send', () => {
  type Context = { count: number };

  const configStart = {
    start: { CHANGE: 'end' },
    end: {
      CHANGE: 'start',
      _entry: [
        countAssign,
        countAssign,
        () => send({ type: 'CHANGE' }),
        countAssign,
      ],
    },
  };

  const service = machine<Context>({
    init: 'start',
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: 'CHANGE' });
  expect(service.current).toBe('start');
  expect(service.context.count).toBe(2);
});
