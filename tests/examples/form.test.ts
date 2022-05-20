import { machine, send, assign } from '../../src';
import { MachineState, State, Event } from '../../src/types';

type O = Record<string, unknown>;
type Context = {
  values: O;
  errors: O;
};

type InitEvent = { type: string; values: O };
type ErrorEvent = { type: string; errors: O };
type ModifierEvent = { type: string; key: string; value: unknown };
type FormEvent = Event | InitEvent | ModifierEvent | ErrorEvent;

function validator(ctx: Context) {
  if (ctx.values.key === 'test') return {};
  return { key: 'required' };
}

function isValid(s: MachineState<Context>) {
  const _res = validator(s.context);
  if (Object.keys(_res).length === 0) return true;
  return false;
}

function updateAction(p: MachineState<Context>, e: FormEvent) {
  const _ctx = { ...p.context };
  const _e = e as ModifierEvent;
  _ctx.values[_e.key] = _e.value;
  _ctx.errors[_e.key] = '';
  return assign(_ctx);
}

function initAction(_p: MachineState<Context>, e: FormEvent) {
  return assign({ values: (e as InitEvent).values, errors: {} });
}

function errorAction(p: MachineState<Context>, e: FormEvent) {
  return assign({
    ...p.context,
    errors: (e as ErrorEvent).errors,
  });
}

function validationAction(p: MachineState<Context>) {
  if (isValid(p)) return send({ type: 'SUBMITTED' });
  else
    return send({
      type: 'REJECTED',
      errors: validator(p.context),
    } as ErrorEvent);
}

const config: Record<string, State<Context, FormEvent>> = {
  init: { LOADED: 'ready' },
  ready: {
    CHANGED: 'touched',
    _entry: [initAction],
  },
  touched: {
    CHANGED: 'touched',
    SUBMITTED: 'validating',
    _entry: [updateAction],
  },
  validating: {
    SUBMITTED: { target: 'submitting', guard: isValid },
    REJECTED: { target: 'invalid', guard: (ctx) => !isValid(ctx) },
    _entry: [validationAction],
  },
  invalid: {
    CHANGED: 'touched',
    _entry: [errorAction],
  },
  submitting: { FINISHED: 'ready' },
};

test('Form - happy flow', () => {
  const service = machine<Context, FormEvent>({ init: 'init', states: config });
  expect(service.current).toBe('init');
  service.send({ type: 'LOADED', values: { key: '' } });
  expect(service.current).toBe('ready');
  expect(service.context.values).toEqual({ key: '' });
  service.send({ type: 'CHANGED', key: 'key', value: 't' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 't' });
  service.send({ type: 'CHANGED', key: 'key', value: 'test' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 'test' });
  service.send({ type: 'SUBMITTED' });
  expect(service.current).toBe('submitting');
  expect(service.context.values).toEqual({ key: 'test' });
  service.send({ type: 'FINISHED' });
  expect(service.current).toBe('ready');
});

test('Form - happy flow', () => {
  const service = machine<Context, FormEvent>({ init: 'init', states: config });
  expect(service.current).toBe('init');
  service.send({ type: 'LOADED', values: { key: '' } });
  expect(service.current).toBe('ready');
  expect(service.context.values).toEqual({ key: '' });
  service.send({ type: 'CHANGED', key: 'key', value: 't' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 't' });
  service.send({ type: 'CHANGED', key: 'key', value: '' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: '' });
  service.send({ type: 'SUBMITTED' });
  expect(service.current).toBe('invalid');
  expect(service.context.values).toEqual({ key: '' });
  expect(service.context.errors).toEqual({ key: 'required' });
  service.send({ type: 'CHANGED', key: 'key', value: 't' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 't' });
  expect(service.context.errors).toEqual({ key: '' });
});
