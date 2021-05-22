/* eslint-disable @typescript-eslint/ban-types */
import { fsm } from '../src';

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

describe('finite state machine', () => {
  test('default service with a manual traffic light', () => {
    const service = fsm('green', configDefault);
    expect(service.current).toBe('green');
    service.send('CHANGE');
    expect(service.current).toBe('yellow');
  });

  test('non-existing transition', () => {
    const service = fsm('green', configDefault);
    expect(service.current).toBe('green');
    service.send('NON_EXISTING_EVENT');
    expect(service.current).toBe('green');
  });

  test('incorrect transition', () => {
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

  test('Add a listener', () => {
    const cb = jest.fn((x) => x);
    const service = fsm('green', configDefault);
    service.listen(cb);
    service.send('CHANGE');
    expect(cb.mock.calls.length).toBe(1);
  });

  test('End state', () => {
    const service = fsm('yellow', configDefault);
    service.send('CHANGE');
    service.send('CHANGE');
    expect(service.current).toBe('red');
  });

  test('Wrong initial state', () => {
    expect(() => fsm('wrongInitialState', configDefault)).toThrow(
      'Initial state does not exist'
    );
  });

  test('entry actions on for auto-transitions', async () => {
    const configAutomatic = {
      green: { on: { CHANGE: 'yellow' } },
      yellow: {
        on: { CHANGE: 'red' },
        entry: (s: Function) => s('CHANGE'),
      },
      red: {
        on: { CHANGE: 'green' },
        entry: (s: Function) => s('CHANGE', { delay: 100 }),
      },
    };

    const service = fsm('green', configAutomatic);
    expect(service.current).toBe('green');
    service.send('CHANGE');
    expect(service.current).toBe('red');
    await delay(100);
    expect(service.current).toBe('green');
  });

  test('auto transition on start', () => {
    const configStart = {
      start: {
        on: { CHANGE: 'end' },
        entry: (s: Function) => s('CHANGE'),
      },
      end: {},
    };

    const service = fsm('start', configStart);
    expect(service.current).toBe('end');
  });
});
