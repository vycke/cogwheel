/* eslint-disable @typescript-eslint/ban-types */
import { machine, assign } from '../../src';
import { Action, Machine, State, O, Event } from '../../src/types';

type Context = { data: O | null; errors: O | null; valid: boolean };
type FetchEvent = Event & { data?: unknown; errors?: unknown };
type ModifierEvent = Event & { key: string; value: unknown };
type MachineEvent = Event | ModifierEvent | FetchEvent;

const successEntry: Action<Context, FetchEvent> = (p, e) =>
  assign({ ...p.context, data: e.data, errors: null, valid: true });
const errorEntry: Action<Context, FetchEvent> = (p, e) =>
  assign({ ...p.context, errors: e.errors, data: null, valid: false });

const pendingEntry: Action<Context, FetchEvent> = (p) =>
  assign({ ...p.context, errors: null });

const invalidEntry: Action<Context, MachineEvent> = (p, e) => {
  const _e = e as ModifierEvent;
  return assign({
    ...p.context,
    data: {
      ...p.context.data,
      [_e.key]: _e.value,
    },
    valid: false,
  });
};

const config: Record<string, State<Context, MachineEvent>> = {
  idle: { STARTED: 'pending' },
  pending: { FINISHED: 'success', FAILED: 'error', _entry: [pendingEntry] },
  success: { STARTED: 'pending', MODIFIED: 'invalid', _entry: [successEntry] },
  invalid: { MODIFIED: 'invalid', _entry: [invalidEntry] },
  error: { STARTED: 'pending', _entry: [errorEntry] },
};

let service: Machine<Context, MachineEvent>;
const init: Context = { errors: null, data: null, valid: false };

beforeEach(() => {
  service = machine<Context>({
    init: 'idle',
    states: config,
    context: init,
  });
});

test('fetch - success', () => {
  expect(service.current).toBe('idle');
  service.send({ type: 'STARTED' });
  expect(service.current).toBe('pending');
  expect(service.context).toEqual(init);
  service.send({ type: 'FINISHED', data: { key: 'test' } });
  expect(service.current).toBe('success');
  expect(service.context).toEqual({
    data: { key: 'test' },
    errors: null,
    valid: true,
  });
  service.send({ type: 'STARTED' });
  expect(service.current).toBe('pending');
  expect(service.context).toEqual({
    data: { key: 'test' },
    errors: null,
    valid: true,
  });
});

test('fetch - error', () => {
  expect(service.current).toBe('idle');
  service.send({ type: 'STARTED' });
  expect(service.current).toBe('pending');
  expect(service.context).toEqual(init);
  service.send({ type: 'FAILED', errors: { key: 'required' } });
  expect(service.current).toBe('error');
  expect(service.context).toEqual({
    errors: { key: 'required' },
    data: null,
    valid: false,
  });
  service.send({ type: 'STARTED' });
  expect(service.current).toBe('pending');
  expect(service.context).toEqual({ errors: null, data: null, valid: false });
});

test('fetch - restart (not possible)', () => {
  expect(service.current).toBe('idle');
  service.send({ type: 'STARTED' });
  expect(service.current).toBe('pending');
  service.send({ type: 'STARTED' });
  expect(service.current).toBe('pending');
});

test('fetch - incorrect failed', () => {
  expect(service.current).toBe('idle');
  service.send({ type: 'STARTED' });
  service.send({ type: 'FINISHED' });
  service.send({ type: 'FAILED' });
  expect(service.current).toBe('success');
});

test('fetch - jump to success', () => {
  expect(service.current).toBe('idle');
  service.send({ type: 'FINISHED' });
  expect(service.current).toBe('idle');
});

test('fetch - invalidated & refetched', () => {
  expect(service.current).toBe('idle');
  service.send({ type: 'STARTED' });
  service.send({ type: 'FINISHED', data: { key: 'test' } });
  service.send({ type: 'MODIFIED', key: 'key', value: 'updated' });
  expect(service.current).toBe('invalid');
  expect(service.context).toEqual({
    errors: null,
    data: { key: 'updated' },
    valid: false,
  });
});
