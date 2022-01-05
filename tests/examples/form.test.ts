import { machine, send, assign } from '../../src';
import { State } from '../../src/types';

type O = Record<string, unknown>;
type Context = {
  values: O;
  errors: O;
};

function validator(ctx: Context) {
  if (ctx.values.key === 'test') return {};
  return { key: 'required' };
}

function isValid(ctx: Context) {
  const _res = validator(ctx);
  if (Object.keys(_res).length === 0) return true;
  return false;
}

function updateEntry(_s: string, ctx: Context, values: unknown) {
  const _ctx = { ...ctx };
  const _values = values as { key: string; value: unknown };
  _ctx.values[_values.key] = _values.value;
  _ctx.errors[_values.key] = '';
  return assign(_ctx);
}

const config: Record<string, State<Context>> = {
  init: { LOADED: 'ready' },
  ready: {
    CHANGED: 'touched',
    _entry: [(_s, _ctx, values) => assign({ values: values as O, errors: {} })],
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
      (_s, ctx: Context) => {
        if (isValid(ctx)) return send('SUBMITTED');
        else return send('REJECTED', validator(ctx));
      },
    ],
  },
  invalid: {
    CHANGED: 'touched',
    _entry: [
      (_s, ctx: Context, values) =>
        assign({
          ...ctx,
          errors: values as O,
        }),
    ],
  },
  submitting: { FINISHED: 'ready' },
};

test('Form - happy flow', () => {
  const service = machine<Context>('init', config);
  expect(service.current).toBe('init');
  service.send('LOADED', { key: '' });
  expect(service.current).toBe('ready');
  expect(service.context.values).toEqual({ key: '' });
  service.send('CHANGED', { key: 'key', value: 't' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 't' });
  service.send('CHANGED', { key: 'key', value: 'test' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 'test' });
  service.send('SUBMITTED');
  expect(service.current).toBe('submitting');
  expect(service.context.values).toEqual({ key: 'test' });
  service.send('FINISHED');
  expect(service.current).toBe('ready');
});

test('Form - happy flow', () => {
  const service = machine<Context>('init', config);
  expect(service.current).toBe('init');
  service.send('LOADED', { key: '' });
  expect(service.current).toBe('ready');
  expect(service.context.values).toEqual({ key: '' });
  service.send('CHANGED', { key: 'key', value: 't' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 't' });
  service.send('CHANGED', { key: 'key', value: '' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: '' });
  service.send('SUBMITTED');
  expect(service.current).toBe('invalid');
  expect(service.context.values).toEqual({ key: '' });
  expect(service.context.errors).toEqual({ key: 'required' });
  service.send('CHANGED', { key: 'key', value: 't' });
  expect(service.current).toBe('touched');
  expect(service.context.values).toEqual({ key: 't' });
  expect(service.context.errors).toEqual({ key: '' });
});
