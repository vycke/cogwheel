/* eslint-disable @typescript-eslint/ban-types */
import { fsm, send, assign } from '../src';
import { Action } from '../src/types';

// helper funtions
function delay(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Types
type Context = { count: number };

// Default configuration
let cb: jest.Mock;

const configDefault = {
  green: { CHANGE: 'yellow' },
  yellow: { CHANGE: 'red' },
  red: {},
};

const countAction: Action<Context> = function (
  _s: string,
  ctx: Context,
  values?: unknown
) {
  if ((values as Context)?.count)
    return { count: ctx.count + (values as Context).count };
  return { count: ctx.count + 1 };
};

const logAction: Action<{}> = function (state): void {
  cb(state);
};

// Actual tests

beforeEach(() => {
  cb = jest.fn((x) => x);
});

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
    green: { CHANGE: 'blue' },
    yellow: { CHANGE: 'red' },
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
    green: { CHANGE: { target: 'yellow' } },
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

test('General purpose action', () => {
  const configStart = {
    start: {
      CHANGE: 'end',
      _entry: [logAction],
    },
    end: {},
  };

  fsm<{}>('start', configStart);
  expect(cb.mock.calls.length).toBe(1);
});

test('Entry actions - auto-transition', async () => {
  const configAutomatic = {
    green: { CHANGE: 'yellow' },
    yellow: {
      CHANGE: 'red',
      _entry: [send('CHANGE')],
    },
    red: {
      CHANGE: 'green',
      _entry: [send('CHANGE', 100)],
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
      _entry: [send('CHANGE')],
      CHANGE: 'end',
    },
    end: {},
  };

  const service = fsm<{}>('start', configStart);
  expect(service.current).toBe('end');
});

test('Entry actions - update context', () => {
  type Context = { count: number };

  const configStart = {
    start: { CHANGE: 'end' },
    end: {
      _entry: [assign(countAction)],
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

  const configStart = {
    start: { CHANGE: 'end' },
    end: {
      _entry: [assign(countAction)],
    },
  };

  const service = fsm<Context>('start', configStart, { count: 0 });
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
      _entry: [assign(countAction), send<Context>('CHANGE')],
    },
    end: {},
  };

  const service = fsm<Context>('start', configStart, { count: 0 });
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
      _exit: [assign(countAction)],
    },
    end: {},
  };

  const service = fsm<Context>('start', configStart, { count: 0 });
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
        actions: [assign(countAction)],
      },
    },
    end: {},
  };

  const service = fsm<Context>('start', configStart, { count: 0 });
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

  const service = fsm<Context>('green', config, { allowed: true });
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('yellow');
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

  const service = fsm<Context>('green', config, { allowed: false });
  expect(service.current).toBe('green');
  service.send('CHANGE');
  expect(service.current).toBe('green');
});
