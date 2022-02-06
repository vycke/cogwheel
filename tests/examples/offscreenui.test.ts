import { machine, send } from '../../src';
import { delay } from '../helpers';

function toggling(_s: string) {
  return send({ type: 'TOGGLE', delay: 10 });
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
  const service = machine({ init: 'invisible', states: config });
  expect(service.current).toBe('invisible');
  service.send({ type: 'TOGGLE' });
  expect(service.current).toBe('opening');
  await delay(10);
  expect(service.current).toBe('visible');
});

test('Offscreen UI - close', async () => {
  const service = machine({ init: 'visible', states: config });
  expect(service.current).toBe('visible');
  service.send({ type: 'TOGGLE' });
  expect(service.current).toBe('closing');
  await delay(10);
  expect(service.current).toBe('invisible');
});
