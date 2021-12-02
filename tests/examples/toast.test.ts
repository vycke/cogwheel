import { assign, fsm, send } from '../../src';
import { ActionObject, O, State } from '../../src/types';
import { delay } from '../helpers';

type Context = { label: string };

function valueAssign<T extends O>(
  _s: string,
  ctx: T,
  values: unknown
): ActionObject {
  return assign({ ...ctx, ...(values as T) });
}

const config: Record<string, State<Context>> = {
  visible: {
    CLOSED: 'invisible',
    OPENED: 'visible',
    _entry: [valueAssign, (_s, ctx) => send('CLOSED', ctx, 10)],
  },
  invisible: { OPENED: 'visible' },
};

test('Toast - open toast', () => {
  const service = fsm<Context>('invisible', config);
  expect(service.current).toBe('invisible');
  service.send('OPENED', { label: 'message' });
  expect(service.current).toBe('visible');
  expect(service.context.label).toBe('message');
});

test('Toast - auto close-toast', async () => {
  const service = fsm('invisible', config);
  expect(service.current).toBe('invisible');
  service.send('OPENED', { label: 'message ' });
  expect(service.current).toBe('visible');
  await delay(100);
  expect(service.current).toBe('invisible');
});

test('Toast - manual close-toast', () => {
  const service = fsm('invisible', config);
  expect(service.current).toBe('invisible');
  service.send('OPENED', { label: 'message ' });
  expect(service.current).toBe('visible');
  service.send('CLOSED');
  expect(service.current).toBe('invisible');
});
