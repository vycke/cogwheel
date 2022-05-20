import { assign, machine, send } from '../../src';
import { Event, State, Action } from '../../src/types';
import { delay } from '../helpers';

type Context = { label: string };
type ToastEvent = Event & { label?: string };

const valueAssign: Action<Context, ToastEvent> = (p, e) =>
  assign({ ...p.context, label: e.label });

const config: Record<string, State<Context, ToastEvent>> = {
  visible: {
    CLOSED: 'invisible',
    OPENED: 'visible',
    _entry: [valueAssign, () => send({ type: 'CLOSED' }, 10)],
  },
  invisible: { OPENED: 'visible' },
};

test('Toast - open toast', () => {
  const service = machine({
    init: 'invisible',
    states: config,
  });
  expect(service.current).toBe('invisible');
  service.send({ type: 'OPENED', label: 'message' });
  expect(service.current).toBe('visible');
  expect(service.context.label).toBe('message');
});

test('Toast - auto close-toast', async () => {
  const service = machine({
    init: 'invisible',
    states: config,
  });
  expect(service.current).toBe('invisible');
  service.send({ type: 'OPENED', label: 'message' });
  expect(service.current).toBe('visible');
  await delay(100);
  expect(service.current).toBe('invisible');
});

test('Toast - manual close-toast', () => {
  const service = machine({ init: 'invisible', states: config });
  expect(service.current).toBe('invisible');
  service.send({ type: 'OPENED', label: 'message' });
  expect(service.current).toBe('visible');
  service.send({ type: 'CLOSED' });
  expect(service.current).toBe('invisible');
});
