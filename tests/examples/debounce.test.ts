import { machine, send } from '../../src';
import { O } from '../../src/types';
import { delay } from '../helpers';

const config = {
  init: { CHANGED: 'debouncing' },
  debouncing: {
    GO: 'executing',
    CHANGED: 'debouncing',
    _entry: [(_s: string, ctx: O) => send('GO', ctx, 10)],
  },
  executing: { FINISHED: 'init' },
};

test('Debounce', async () => {
  const service = machine('init', config);
  expect(service.current).toBe('init');
  service.send('CHANGED');
  expect(service.current).toBe('debouncing');
  service.send('CHANGED');
  expect(service.current).toBe('debouncing');
  await delay(10);
  expect(service.current).toBe('executing');
});
