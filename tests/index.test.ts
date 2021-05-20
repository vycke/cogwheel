/* eslint-disable @typescript-eslint/ban-types */
import { fsm } from '../src';

function delay(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const config = {
  green: { on: { CHANGE: 'yellow', BREAK: 'broken', TOSTATIC: 'static' } },
  yellow: {
    on: { CHANGE: 'red' },
    entry(send: Function) {
      send('CHANGE', { delay: 100 });
    },
  },
  red: { on: { CHANGE: 'green', WRONGTARGET: 'nonexisting' } },
  broken: {
    on: { STOP: 'red' },
    entry(send: Function) {
      send('STOP');
    },
  },
  static: {
    on: { CANCEL: 'red', DELAYED: 'green' },
    entry(send: Function) {
      console.log('yay');
      send('DELAYED', { delay: 500 });
    },
  },
};

describe('finite state machine', () => {
  test('service', () => {
    const service = fsm('green', config);
    expect(service.current).toBe('green');
    service.send('CHANGE');
    expect(service.current).toBe('yellow');
    service.send('CHANGE');
    expect(service.current).toBe('red');
    service.send('NONEXISTING');
    expect(service.current).toBe('red');
    service.send('WRONGTARGET');
    expect(service.current).toBe('red');
  });

  test('side effects', () => {
    const service = fsm('green', config);
    service.send('BREAK');
    expect(service.current).toBe('red');
  });

  test('async side effects', async () => {
    const service = fsm('green', config);
    service.send('CHANGE');
    expect(service.current).toBe('yellow');
    await delay(200);
    expect(service.current).toBe('red');
  });

  test('listeners', async () => {
    const cb = jest.fn((x) => x);
    const service = fsm('green', config);
    expect(cb.mock.calls.length).toBe(0);
    service.listen(cb);
    service.send('CHANGE');
    expect(cb.mock.calls.length).toBe(1);
    await delay(200);
    expect(cb.mock.calls.length).toBe(2);
    service.listen();
    service.send('CHANGE');
    expect(cb.mock.calls.length).toBe(2);
  });

  test('immutability', () => {
    const service = fsm('green', config);
    expect(service.current).toBe('green');
    service.current = 'red';
    expect(service.current).toBe('green');
  });

  test('cancel delay', async () => {
    const cb = jest.fn((x) => x);
    const service = fsm('green', config);
    service.listen(cb);
    expect(service.current).toBe('green');
    service.send('TOSTATIC');
    expect(service.current).toBe('static');
    await delay(100);
    service.send('CANCEL');
    expect(service.current).toBe('red');
    expect(cb.mock.calls.length).toBe(2);
    await delay(500);
    expect(service.current).toBe('red');
    expect(cb.mock.calls.length).toBe(2);
  });
});
