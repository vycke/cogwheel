/* eslint-disable @typescript-eslint/ban-types */
import { machine, assign } from '../../src';
import { Action, MachineState, Machine, State, Event } from '../../src/types';

type Context = { data: object | null; errors: object | null; valid: boolean };
type Modifier = { key: string; value: unknown };

const successEntry: Action<Context> = (p: MachineState<Context>, e: Event) =>
  assign({ ...p.context, data: e.payload, errors: null, valid: true });

const errorEntry: Action<Context> = (p: MachineState<Context>, e: Event) =>
  assign({ ...p.context, errors: e.payload, data: null, valid: false });

const pendingEntry: Action<Context> = (p: MachineState<Context>) =>
  assign({ ...p.context, errors: null });

const invalidEntry: Action<Context> = (p: MachineState<Context>, e: Event) => {
  const _pl = e.payload as Modifier;
  return assign({
    ...p.context,
    data: {
      ...p.context.data,
      [_pl.key]: _pl.value,
    },
    valid: false,
  });
};

const config: Record<string, State<Context>> = {
  idle: { STARTED: 'pending' },
  pending: { FINISHED: 'success', FAILED: 'error', _entry: [pendingEntry] },
  success: { STARTED: 'pending', MODIFIED: 'invalid', _entry: [successEntry] },
  invalid: { MODIFIED: 'invalid', _entry: [invalidEntry] },
  error: { STARTED: 'pending', _entry: [errorEntry] },
};

let service: Machine<Context>;
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
  service.send({ type: 'FINISHED', payload: { key: 'test' } });
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
  service.send({ type: 'FAILED', payload: { key: 'required' } });
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
  service.send({ type: 'FINISHED', payload: { key: 'test' } });
  service.send({ type: 'MODIFIED', payload: { key: 'key', value: 'updated' } });
  expect(service.current).toBe('invalid');
  expect(service.context).toEqual({
    errors: null,
    data: { key: 'updated' },
    valid: false,
  });
});
