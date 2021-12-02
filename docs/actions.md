# Actions

You are able to define 'actions'. These actions are executed when you leave a state (after guard checks), when you enter a state, or when a transition is executed. Actions can be used to invoke external side-effects (e.g. start a fetch request), or invoke changes within the state machine via an `ActionObject: { type: string, meta?: object }`. Each action takes the current state and context as input parameters. In addition, the values coming from `machine.send(...)` or via the `send` action creator (more on that later), comes as a third parameter.

```js
const action = (state, context, values) => { ... }
```

> NOTE: `_entry` and `_exit` are reserved transition names to provide for a simplified API.

```js
const config = {
  green: {
    CHANGE: {
      target: 'red',
      actions: [
        (state, ctx, values) => {
          console.log(state, ctx);
        },
      ],
    },
  },
  red: {
    _entry: [
      (state, ctx, values) => {
        console.log(state, ctx, values);
      },
    ],
    _exit: [
      (state, ctx, values) => {
        console.log(state, ctx, values);
      },
      (state) => {
        console.log(state);
      },
    ],
  },
};
```

The `actions` on transactions and `_entry`/`_exit` on state configuration allow for multiple actions. The configured actions are executed in their defined order. An example can be seen in the above code for the `red` state's `_exit` action list.

You are free to define actions in the way you want, but there are helper functions for creation an `ActionObject`. These are called action creaters.

## `send` action creator

The `send(event, values, delay)` action creator allows you to automatically fire a new (delayed) transition on entry of a state.

```js
import { send } from '@crinkles/fsm';
const config = {
  green: { CHANGE: 'red' },
  red: {
    CHANGE: 'green',
    _entry: [() => send('CHANGE', {}, 3000)],
  },
};
```

## `assign` action creator

The `assign(newContext)` action creator allows you to update the context of the machine.

```js
import { assign } from '@crinkles/fsm';

const config = {
  green: { CHANGE: 'yellow' },
  yellow: {
    CHANGE: 'red',
    _entry: [(_s, ctx) => assign({ count: ctx.count + 1 })],
  },
  yellow: {
    CHANGE: 'green',
    _entry: [(_s, ctx, values) => assign({ count: ctx.count + values.count })],
  },
};

// { count: 2 } corresponds with the 'values' in the entry action of the red state
machine.send('CHANGE', { count: 2 });
```

## Listener action

The listener action is a special single purpose action. It is an action that is executed on each succesful state transition.

```js
function listener(state, context) {
  console.log(state, contextt);
}

machine.listen(listener);
```

## [Next: front-end framework implementation](./front-end-frameworks.md)
