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
    one: machine({ init: 'green', states: configDefault }),
    two: machine({ init: 'yellow', states: configDefault }),
  });

  expect(service.one.current).toBe('green');
  expect(service.two.current).toBe('yellow');
  service.send({ type: 'CHANGE' });
  expect(service.one.current).toBe('yellow');
  expect(service.two.current).toBe('red');
});

test('Parallel - immutable', () => {
  const service = parallel({
    one: machine({ init: 'green', states: configDefault }),
    two: machine({ init: 'yellow', states: configDefault }),
  });

  expect(service.one.current).toBe('green');
  service.one = machine({ init: 'red', states: configDefault });
  expect(service.one.current).toBe('green');
});
