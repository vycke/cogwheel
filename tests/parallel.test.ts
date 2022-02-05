/* eslint-disable @typescript-eslint/ban-types */
import { machine } from '../src';
import { parallel } from '../src/parallel';

// Default configuration
const configDefault = {
  green: { CHANGE: 'yellow' },
  yellow: { CHANGE: 'red' },
  red: {},
};

test('Parallel - simple multi-transition', () => {
  const service = parallel({
    one: machine('green', configDefault),
    two: machine('yellow', configDefault),
  });

  expect(service.one.current).toBe('green');
  expect(service.two.current).toBe('yellow');
  service.send({ type: 'CHANGE' });
  expect(service.one.current).toBe('yellow');
  expect(service.two.current).toBe('red');
});

test('Parallel - immutable', () => {
  const service = parallel({
    one: machine('green', configDefault),
    two: machine('yellow', configDefault),
  });

  expect(service.one.current).toBe('green');
  service.one = machine('red', configDefault);
  expect(service.one.current).toBe('green');
});
