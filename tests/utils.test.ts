/* eslint-disable @typescript-eslint/ban-types */
import { getStates, getTransitions } from '../src/utils';

describe('Utility functions', () => {
  test('getStates', () => {
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
    expect(getStates(configAutomatic)).toEqual([
      { data: { label: 'green' }, id: 'green' },
      { data: { entry: 'CHANGE', label: 'yellow' }, id: 'yellow' },
      { data: { delay: 100, entry: 'CHANGE', label: 'red' }, id: 'red' },
    ]);
  });

  test('getTransitions', () => {
    const config = {
      green: {
        on: {
          CHANGE: {
            target: 'yellow',
            guard: (u: { allowed?: boolean }) => u.allowed as boolean,
          },
          RESET: 'green',
        },
      },
      yellow: {},
    };

    expect(getTransitions(config)).toEqual([
      {
        data: { guard: '(u) => u.allowed', label: 'CHANGE' },
        source: 'green',
        target: 'yellow',
      },
      {
        data: { label: 'RESET' },
        source: 'green',
        target: 'green',
      },
    ]);
  });
});
