# Examples

## Fetching data

![](./img/fetch.png)

This state machine allows you to maintain the state of a single fetch operation (e.g. GET/POST). The context of the machine holds the data/errors (response) of the fetch, and can be used to show this information on the screen. It can be combined with caching, where each url you try to fetch is the key in the cache, and the corresponding state machine the value in the cache. By triggering the `MODIFIED` event, the cache is flagged as `invalid`, allow correct data refreshing strategies.

```js
// ACTIONS
const successEntry = ({ state, event, assign }) =>
  assign({ ...state.context, data: event.data, errors: null, valid: true });

const errorEntry = ({ state, event, assign }) =>
  assign({ ...state, context, errors: event.errors, data: null, valid: false });

const pendingEntry = ({ state, assign }) =>
  assign({ ...state.context, errors: null });

const invalidEntry = ({ state, event, assign }) =>
  assign({
    ...state.context,
    data: {
      ...state.context.data,
      [event.key]: event.value,
    },
    valid: false,
  });

// CONFIG
const config = {
  init: 'idle',
  states: {
    idle: { STARTED: 'pending' },
    pending: { FINISHED: 'success', FAILED: 'error', _entry: [pendingEntry] },
    success: {
      STARTED: 'pending',
      MODIFIED: 'invalid',
      _entry: [successEntry],
    },
    invalid: { MODIFIED: 'invalid', _entry: [invalidEntry] },
    error: { STARTED: 'pending', _entry: [errorEntry] },
  },
};

// EXAMPLE USAGE
machine.send({ type: 'FINISHED', data });
machine.send({ type: 'FAILED', errors });
machine.send({ type: 'MODIFIED', key: 'test', value: 'test' });
```

## Offscreen UI elements

![](./img/offscreen-ui.png)

Think of modals, sidebars, etc. that you want to appear/dissappear on the screen. This state machine takes into account that the element might have a transition state in which animations etc. happen.

```js
// ACTIONS
const toggling = ({ send }) => send({ type: 'TOGGLE' }, 10);

// CONFIG
const config = {
  init: 'invisible',
  states: {
    visible: { TOGGLE: 'closing' },
    closing: { TOGGLE: 'invisible', _entry: [toggling] },
    invisible: { TOGGLE: 'opening' },
    opening: { TOGGLE: 'visible', _entry: [toggling] },
  },
};
```

## Toasts

![](./img/toast.png)

Toast messages are a special kind of offscreen UI element. Once appeared, they will automatically disappear, unless they are triggered again. Manual closing of the toast message should also be possible. The context of the machine Note that this machine does not have transitional states for animation purposes.

```js
// CONFIG
const config = {
  init: 'invisible',
  states: {
    visible: {
      CLOSED: 'invisible',
      OPENED: 'visible',
      _entry: [
        ({ state, event, assign }) =>
          assign({ ...state.context, label: event.label }),
        ({ send }) => send({ type: 'CLOSED' }, 6000),
      ],
    },
    invisible: { OPENED: 'visible' },
  },
};

// EXAMPLE USAGE
machine.send({ type: 'OPENED', label: 'my toast message' });
```

## Forms

![](./img/form.png)

```js
// ACTIONS
function validator(ctx) {
  if (ctx.values.key === 'test') return {};
  return { key: 'required' };
}

function isValid(ctx) {
  const _res = validator(ctx);
  if (Object.keys(_res).length === 0) return true;
  return false;
}

function updateEntry({ state, event, assign }) {
  const _ctx = { ...state.context };
  _ctx.values[event.key] = event.value;
  _ctx.errors[event.key] = '';
  assign(_ctx);
}

function validationAction({ state, send }) {
  if (isValid(state.context)) send({ type: 'SUBMITTED' });
  else send('REJECTED', validator(state.context));
}

// CONFIG
const config = {
  init: 'init',
  states: {
    init: { LOADED: 'ready' },
    ready: {
      CHANGED: 'touched',
      _entry: [({ event }) => assign({ values: event.values, errors: null })],
    },
    touched: {
      CHANGED: 'touched',
      SUBMITTED: 'validating',
      _entry: [updateEntry],
    },
    validating: {
      SUBMITTED: { target: 'submitting', guard: isValid },
      REJECTED: { target: 'invalid', guard: (s) => !isValid(s.context) },
      _entry: [validationAction],
    },
    invalid: {
      CHANGED: 'touched',
      _entry: [
        ({ state, event, assign }) =>
          assign({ ...state.context, errors: event.errors }),
      ],
    },
    submitting: { FINISHED: 'ready' },
  },
};

//EXAMPLE USAGE
machine.send('CHANGED', { key: 'test', value: 'test' });
```

## Object state

![](./img/object-state.png)

By storing the actual state of an object, you can use the state of the object to disallow features, or rendering of elements, client-side. In addition, you can ensure optimistic UI is applied according to the available state machine corresponding to the object.

```js
const config = {
  init: 'draft',
  states: {
    draft: { SUBMIT: 'pending' },
    pending: { APPROVE: 'approved', REJECT: 'rejected' },
    approved: { REJECT: 'rejected', PROCESS: 'processed' },
    rejected: { SUBMIT: 'pending' },
    processed: {},
  },
};

function approve() {
  if (machine.current !== 'pending') return;
}
```

## Authentication

![](./img/authentication.png)

Authentication, especially token-based authentication has several steps and paths that can be modelled in a state machine. This machine can be used to guard routes, rendering, and invoke the correct actions (e.g. send a signout signal to a server to terminate a session).

```js
import { send } from 'cogwheel';

const config = {
  init: 'not_authenticated',
  states: {
    not_authenticated: { SIGNIN_STARTED: 'signing_in' },
    signing_in: { FINISHED: 'authenticated', FAILED: 'not_authenticated' },
    authenticated: {
      SIGNOUT_STARTED: 'signing_out',
      EXPIRED: 'expired',
      _entry: ({ send }) => send({ type: 'EXPIRED' }, 90000),
    },
    expired: { REFRESH_STARTED: 'refreshing' },
    signing_out: { FINISHED: 'not_authenticated' },
    refreshing: { FINISHED: 'authenticated', FAILED: 'signing_out' },
  },
};
```
