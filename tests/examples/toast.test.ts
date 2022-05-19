import { assign, machine, send } from '../../src';
import { ActionObject, MachineState, O, State, Event } from '../../src/types';
import { delay } from '../helpers';

type Context = { label: string };

function valueAssign<T extends O>(
  s: MachineState<Context>,
  e: Event
): ActionObject {
  return assign({ ...s.context, ...(e.payload as T) });
}

const config: Record<string, State<Context>> = {
  visible: {
    CLOSED: 'invisible',
    OPENED: 'visible',
    _entry: [valueAssign, () => send({ type: 'CLOSED', delay: 10 })],
  },
  invisible: { OPENED: 'visible' },
};

test('Toast - open toast', () => {
  const service = machine<Context>({ init: 'invisible', states: config });
  expect(service.current).toBe('invisible');
  service.send({ type: 'OPENED', payload: { label: 'message' } });
  expect(service.current).toBe('visible');
  expect(service.context.label).toBe('message');
});

test('Toast - auto close-toast', async () => {
  const service = machine({ init: 'invisible', states: config });
  expect(service.current).toBe('invisible');
  service.send({ type: 'OPENED', payload: { label: 'message ' } });
  expect(service.current).toBe('visible');
  await delay(100);
  expect(service.current).toBe('invisible');
});

test('Toast - manual close-toast', () => {
  const service = machine({ init: 'invisible', states: config });
  expect(service.current).toBe('invisible');
  service.send({ type: 'OPENED', payload: { label: 'message ' } });
  expect(service.current).toBe('visible');
  service.send({ type: 'CLOSED' });
  expect(service.current).toBe('invisible');
});
