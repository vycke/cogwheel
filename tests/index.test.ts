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
  const service = machine('green', configDefault);
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('yellow');
});

test('Send - non-existing event', () => {
  const service = machine('green', configDefault);
  expect(service.current).toBe('green');
  service.send('NON_EXISTING_EVENT');
  expect(service.current).toBe('green');
});

test('Send - non-existing target', () => {
  const config = {
    green: { CHANGE: 'blue' },
    yellow: { CHANGE: 'red' },
    red: {},
  };

  const service = machine('green', config);
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('green');
});

test('Send - state without transition definition', () => {
  const config = { red: {} };
  const service = machine('red', config);
  service.send('CHANGE');
  expect(service.current).toBe('red');
});

test('Send - transition object', () => {
  const config = {
    green: { CHANGE: { target: 'yellow' } },
    yellow: {},
  };

  const service = machine('green', config);
  service.send('CHANGE');
  expect(service.current).toBe('yellow');
});

test('immutability', () => {
  const service = machine('green', configDefault);
  expect(service.current).toBe('green');
  service.current = 'yellow';
  expect(service.current).toBe('green');
});

test('listener', () => {
  const service = machine('green', configDefault);
  service.listen(cb);
  service.send('CHANGE');
  expect(cb.mock.calls.length).toBe(1);
});

test('Incorrect initial state', () => {
  expect(() => machine('wrongInitialState', configDefault)).toThrow(
    'Initial state does not exist'
  );
});

test('General purpose action', () => {
  const configStart = {
    start: {
      CHANGE: 'end',
      _entry: [logAction],
    },
    end: {},
  };

  machine<{}>('start', configStart);
  expect(cb.mock.calls.length).toBe(1);
});

test('Entry actions - auto-transition', async () => {
  const configAutomatic = {
    green: { CHANGE: 'yellow' },
    yellow: {
      CHANGE: 'red',
      _entry: [() => send('CHANGE')],
    },
    red: {
      CHANGE: 'green',
      _entry: [() => send('CHANGE', {}, 100)],
    },
  };

  const service = machine<{}>('green', configAutomatic);
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('red');
  await delay(100);
  expect(service.current).toBe('green');
});

test('Entry actions - auto-transition on initial state', () => {
  const configStart = {
    start: {
      _entry: [() => send('CHANGE')],
      CHANGE: 'end',
    },
    end: {},
  };

  const service = machine<{}>('start', configStart);
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

  const service = machine<Context>('start', configStart, { count: 0 });
  expect(service.context.count).toBe(0);
  service.send('CHANGE');
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

  const service = machine<Context>('start', configStart, { count: 0 });
  expect(service.context.count).toBe(0);
  service.send('CHANGE', { count: 2 });
  expect(service.current).toBe('end');
  expect(service.context.count).toBe(2);
});

test('Entry actions - multiple actions', () => {
  type Context = { count: number };

  const configStart = {
    start: { CHANGE: 'middle' },
    middle: {
      CHANGE: 'end',
      _entry: [countAssign, () => send('CHANGE')],
    },
    end: {},
  };

  const service = machine<Context>('start', configStart, { count: 0 });
  expect(service.context.count).toBe(0);
  service.send('CHANGE');
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

  const service = machine<Context>('start', configStart, { count: 0 });
  expect(service.context.count).toBe(0);
  service.send('CHANGE');
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

  const service = machine<Context>('start', configStart, { count: 0 });
  expect(service.context.count).toBe(0);
  service.send('CHANGE');
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

  const service = machine<Context>('green', config, { allowed: true });
  expect(service.current).toBe('green');
  service.send('CHANGE');
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

  const service = machine<Context>('green', config, { allowed: false });
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('green');
});
