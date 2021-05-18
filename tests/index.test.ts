/* eslint-disable @typescript-eslint/ban-types */
import { fsm } from '../src';

function delay(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const config = {
  green: { on: { CHANGE: 'yellow', BREAK: 'broken' } },
  yellow: {
    on: { CHANGE: 'red' },
    async entry(send: Function) {
      await delay(100); // delay for 3000ms
      send('CHANGE');
    },
  },
  red: { on: { CHANGE: 'green', WRONGTARGET: 'nonexisting' } },
  broken: {
    on: { STOP: 'red' },
    entry(send: Function) {
      send('STOP');
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
});
