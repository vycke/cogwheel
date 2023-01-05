/* eslint-disable @typescript-eslint/ban-types */
import { machine } from '../../src';
import { Action, Machine, State, Event } from '../../src/types';
import { delay } from '../helpers';

type Context = { label: string };
type MachineEvent = Event;
let service: Machine<Context, MachineEvent>;

const pendingEntryAction: Action<Context, Event> = async ({ send, assign }) => {
  await delay(50);
  assign({ label: 'test' });
  send({ type: 'FINISHED' });
};

const config: Record<string, State<Context, MachineEvent>> = {
  init: { STARTED: 'pending' },
  pending: {
    FINISHED: 'success',
    FAILED: 'invalid',
    _entry: [pendingEntryAction],
  },
  success: {},
  invalid: {},
};

beforeEach(() => {
  service = machine<Context>({
    init: 'init',
    states: config,
    context: { label: '' },
  });
});

test('async actions', async () => {
  expect(service.current).toBe('init');
  service.send({ type: 'STARTED' });
  expect(service.current).toBe('pending');
  expect(service.context.label).toBe('');
  await delay(50);
  expect(service.current).toBe('success');
  expect(service.context.label).toBe('test');
});
