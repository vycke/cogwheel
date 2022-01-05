import { machine, send } from '../../src';
import { O } from '../../src/types';
import { delay } from '../helpers';

function toggling(_s: string, ctx: O) {
  return send('TOGGLE', ctx, 10);
}

const config = {
  visible: { TOGGLE: 'closing' },
  closing: {
    TOGGLE: 'invisible',
    _entry: [toggling],
  },
  invisible: { TOGGLE: 'opening' },
  opening: {
    TOGGLE: 'visible',
    _entry: [toggling],
  },
};

test('Offscreen UI - open', async () => {
  const service = machine('invisible', config);
  expect(service.current).toBe('invisible');
  service.send('TOGGLE');
  expect(service.current).toBe('opening');
  await delay(10);
  expect(service.current).toBe('visible');
});

test('Offscreen UI - close', async () => {
  const service = machine('visible', config);
  expect(service.current).toBe('visible');
  service.send('TOGGLE');
  expect(service.current).toBe('closing');
  await delay(10);
  expect(service.current).toBe('invisible');
});
