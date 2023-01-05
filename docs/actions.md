# Actions

You are able to define 'actions'. These actions are executed when you leave a state (after guard checks), when you enter a state, or when a transition is executed. Actions can be used to invoke external side-effects (e.g. start a fetch request), or invoke changes within the state machine via an `ActionObject: { type: string, payload?: unknown }`. Each action takes the current state and context as input parameters. In addition, the values coming from `machine.send(...)` or via the `send` action creator (more on that later), comes as a third parameter.

```js
import type { MachineState, Callbacks, Event } from 'cogwheel/types';
// MachineState = { current, id, context };
type Ctx = {};
const action = ({ state: MachineState<Ctx>, event: Event, send: Send<Event>, assign: Assign<Ctx> }) => { ... }
```

> NOTE: `_entry` and `_exit` are reserved transition names to provide for a simplified API.

```js
const config = {
  init: 'green',
  states: {
    green: {
      CHANGE: {
        target: 'red',
        actions: [
          ({ state }) => {
            console.log(state);
          },
        ],
      },
    },
    red: {
      _entry: [
        ({ state, event }) => {
          console.log(state, event);
        },
      ],
      _exit: [
        ({ state, event }) => {
          console.log(state, event);
        },
        ({ state }) => {
          console.log(state);
        },
      ],
    },
  },
};
```

The `actions` on transactions and `_entry`/`_exit` on state configuration allow for multiple actions. The configured actions are executed in their defined order. An example can be seen in the above code for the `red` state's `_exit` action list.

You are free to define actions in the way you want, but there are helper functions for creation an `ActionObject`. These are called action creaters.

## Callbacks

The `callbacks.send(event, delay?: number)` action allows you to automatically fire a new (delayed) transition on entry of a state.

```js
const config = {
  init: 'green',
  states: {
    green: { CHANGE: 'red' },
    red: {
      CHANGE: 'green',
      _entry: [({ send }) => send({ type: 'CHANGE' }, 3000)],
    },
  },
};
```

**NOTE**: after a send action, no further actions are executed anymore, as a new transition is invoked.

The `callbacks.assign(newContext)` action allows you to update the context of the machine.

```js
const config = {
  init: 'green',
  states: {
    green: { CHANGE: 'yellow' },
    yellow: {
      CHANGE: 'red',
      _entry: [
        ({ state, assign }) => assign({ count: state.context.count + 1 }),
      ],
    },
    yellow: {
      CHANGE: 'green',
      _entry: [
        ({ state, assign }) =>
          assign({ count: state.context.count + event.count }),
      ],
    },
  },
};

// { count: 2 } corresponds with the 'values' in the entry action of the red state
machine.send({ type: 'CHANGE', count: 2 });
```

## Listeners

Listeners are special actions that trigger on each successful transition of the machine. You can have multiple listeners on the machine.

```js
function listener({ state }) {
  console.log(state);
}

const remove = machine.listen(listener); // subscribe
remove(); // remove subscription to avoid memory leaks
```

## [Next: Hierarchical machines](./hierarchical-machines.md)
