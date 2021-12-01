# Examples

## Fetching data

![](./img/fetch.png)

This state machine allows you to maintain the state of a single fetch operation (e.g. GET/POST). The context of the machine holds the data/errors (response) of the fetch, and can be used to show this information on the screen. It can be combined with caching, where each url you try to fetch is the key in the cache, and the corresponding state machine the value in the cache. By triggering the `MODIFIED` event, the cache is flagged as `invalid`, allow correct data refreshing strategies.

```js
const successEntry = (_s, ctx, values) =>
  assign({ ...ctx, data: values, errors: null, valid: true });

const errorEntry = (_s, ctx, values) =>
  assign({ ...ctx, errors: values, data: null, valid: false });

const pendingEntry = (_s, ctx) => assign({ ...ctx, errors: null });

const invalidEntry = (_s, ctx, values) =>
  assign({
    ...ctx,
    data: {
      ...ctx.data,
      [values.key]: values.value,
    },
    valid: false,
  });

const config = {
  idle: { STARTED: 'pending' },
  pending: { FINISHED: 'success', FAILED: 'error', _entry: [pendingEntry] },
  success: { STARTED: 'pending', MODIFIED: 'invalid', _entry: [successEntry] },
  invalid: { MODIFIED: 'invalid', _entry: [invalidEntry] },
  error: { STARTED: 'pending', _entry: [errorEntry] },
};

machine.send('FINISHED', data);
machine.send('FAILED', errors);
machine.send('MODIFIED', { key: 'test', value: 'test' });
```

## Offscreen UI elements

![](./img/offscreen-ui.png)

Think of modals, sidebars, etc. that you want to appear/dissappear on the screen. This state machine takes into account that the element might have a transition state in which animations etc. happen.

```js
import { send } from '@crinkles/fsm';

const toggling = (_s, ctx) => send('TOGGLE', ctx, 10);

const config = {
  visible: { TOGGLE: 'closing' },
  closing: { TOGGLE: 'invisible', _entry: [toggling] },
  invisible: { TOGGLE: 'opening' },
  opening: { TOGGLE: 'visible', _entry: [toggling] },
};
```

## Toasts

![](./img/toast.png)

Toast messages are a special kind of offscreen UI element. Once appeared, they will automatically disappear, unless they are triggered again. Manual closing of the toast message should also be possible. The context of the machine Note that this machine does not have transitional states for animation purposes.

```js
import { assign, send } from '@crinkles/fsm';

const config: Record<string, State<Context>> = {
  visible: {
    CLOSED: 'invisible',
    OPENED: 'visible',
    _entry: [
      (_s, ctx, values) => assign({ ...ctx, ...values }),
      (_s, ctx) => send('CLOSED', ctx, 6000),
    ],
  },
  invisible: { OPENED: 'visible' },
};

machine.send('OPENED', { label: 'my toast message' });
```

## Forms

![](./img/form.png)

```js
import { send, assign } from '@crinkles/fsm';

function validator(ctx) {
  if (ctx.values.key === 'test') return {};
  return { key: 'required' };
}

function isValid(ctx) {
  const _res = validator(ctx);
  if (Object.keys(_res).length === 0) return true;
  return false;
}

function updateEntry(_s, ctx, values) {
  const _ctx = { ...ctx };
  const _values = values;
  _ctx.values[_values.key] = _values.value;
  _ctx.errors[_values.key] = '';
  return assign(_ctx);
}

function validationAction(_s, ctx) {
  if (isValid(ctx)) return send('SUBMITTED');
  else return send('REJECTED', validator(ctx));
}

const config = {
  init: { LOADED: 'ready' },
  ready: {
    CHANGED: 'touched',
    _entry: [(_s, _ctx, values) => assign({ values: values, errors: {} })],
  },
  touched: {
    CHANGED: 'touched',
    SUBMITTED: 'validating',
    _entry: [updateEntry],
  },
  validating: {
    SUBMITTED: { target: 'submitting', guard: isValid },
    REJECTED: { target: 'invalid', guard: (ctx) => !isValid(ctx) },
    _entry: [validationAction],
  },
  invalid: {
    CHANGED: 'touched',
    _entry: [(_s, ctx, values) => assign({ ...ctx, errors: values })],
  },
  submitting: { FINISHED: 'ready' },
};
```

## Object state

## Authentication
