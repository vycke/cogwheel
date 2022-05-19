import { machine, send, assign } from '../../src';
import { MachineState, State, Event } from '../../src/types';

type O = Record<string, unknown>;
type Context = {
  values: O;
  errors: O;
};

function validator(ctx: Context) {
  if (ctx.values.key === 'test') return {};
  return { key: 'required' };
}

function isValid(s: MachineState<Context>) {
  const _res = validator(s.context);
  if (Object.keys(_res).length === 0) return true;
  return false;
}

function updateEntry(p: MachineState<Context>, e: Event) {
  const _ctx = { ...p.context };
  const _pl = e.payload as { key: string; value: unknown };
  _ctx.values[_pl.key] = _pl.value;
  _ctx.errors[_pl.key] = '';
  return assign(_ctx);
}

const config: Record<string, State<Context>> = {
  init: { LOADED: 'ready' },
  ready: {
    CHANGED: 'touched',
    _entry: [(_p, e) => assign({ values: e.payload, errors: {} })],
  },
  touched: {
    CHANGED: 'touched',
    SUBMITTED: 'validating',
    _entry: [updateEntry],
  },
  validating: {
    SUBMITTED: { target: 'submitting', guard: isValid },
    REJECTED: { target: 'invalid', guard: (ctx) => !isValid(ctx) },
    _entry: [
      (p: MachineState<Context>) => {
        if (isValid(p)) return send({ type: 'SUBMITTED' });
        else return send({ type: 'REJECTED', payload: validator(p.context) });
      },
    ],
  },
  invalid: {
    CHANGED: 'touched',
    _entry: [
      (p: MachineState<Context>, e) =>
        assign({
          ...p.context,
          errors: e.payload as O,
        }),
    ],
  },
  submitting: { FINISHED: 'ready' },
};

test('Form - happy flow', () => {
  const service = machine<Context>({ init: 'init', states: config });
  expect(service.current).toBe('init');
  service.send({ type: 'LOADED', payload: { key: '' } });
  expect(service.current).toBe('ready');
  expect(service.context.values).toEqual({ key: '' });
  service.send({ type: 'CHANGED', payload: { key: 'key', value: 't' } });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 't' });
  service.send({ type: 'CHANGED', payload: { key: 'key', value: 'test' } });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 'test' });
  service.send({ type: 'SUBMITTED' });
  expect(service.current).toBe('submitting');
  expect(service.context.values).toEqual({ key: 'test' });
  service.send({ type: 'FINISHED' });
  expect(service.current).toBe('ready');
});

test('Form - happy flow', () => {
  const service = machine<Context>({ init: 'init', states: config });
  expect(service.current).toBe('init');
  service.send({ type: 'LOADED', payload: { key: '' } });
  expect(service.current).toBe('ready');
  expect(service.context.values).toEqual({ key: '' });
  service.send({ type: 'CHANGED', payload: { key: 'key', value: 't' } });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 't' });
  service.send({ type: 'CHANGED', payload: { key: 'key', value: '' } });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: '' });
  service.send({ type: 'SUBMITTED' });
  expect(service.current).toBe('invalid');
  expect(service.context.values).toEqual({ key: '' });
  expect(service.context.errors).toEqual({ key: 'required' });
  service.send({ type: 'CHANGED', payload: { key: 'key', value: 't' } });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 't' });
  expect(service.context.errors).toEqual({ key: '' });
});
