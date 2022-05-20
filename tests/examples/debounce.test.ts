import { machine, send } from '../../src';
import { delay } from '../helpers';

const config = {
  init: { CHANGED: 'debouncing' },
  debouncing: {
    GO: 'executing',
    CHANGED: 'debouncing',
    _entry: [() => send({ type: 'GO' }, 10)],
  },
  executing: { FINISHED: 'init' },
};

test('Debounce', async (): Promise<void> => {
  const service = machine({ init: 'init', states: config });
  expect(service.current).toBe('init');
  service.send({ type: 'CHANGED' });
  expect(service.current).toBe('debouncing');
  service.send({ type: 'CHANGED' });
  expect(service.current).toBe('debouncing');
  await delay(10);
  expect(service.current).toBe('executing');
});
