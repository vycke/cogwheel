# JavaScript FSM

![](https://github.com/crinklesio/fsm/workflows/test/badge.svg)
[![Node version](https://img.shields.io/npm/v/@crinkles/fsm.svg?style=flat)](https://www.npmjs.com/package/@crinkles/fsm)
[![NPM Downloads](https://img.shields.io/npm/dm/@crinkles/fsm.svg?style=flat)](https://www.npmjs.com/package/@crinkles/fsm)
[![Minified size](https://img.shields.io/bundlephobia/min/@crinkles/fsm?label=minified)](https://www.npmjs.com/package/@crinkles/fsm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Simple finite state machines that can be used for state/process management.

## Getting started

A simple state machine can be initiated using the `fsm` function from the package. It allows you to view the current state (`machine.current`), or invoke a transition via the `.send(event: string, delay?: number, values?: object)` function. `delay` and `values` are optional input parameters.

```js
import { fsm } from '@crinkles/fsm';

const config = {
  green: { on: { CHANGE: 'yellow' } },
  yellow: { on: { CHANGE: 'red' } },
  red: { on: { CHANGE: 'green' } },
};

const machine = fsm('green', config);
// machine.current = 'green'
machine.send('CHANGE', { key: 'value' }, 3000);
// machine.current = 'yellow'
```

The `machine.send` function returns a `boolean` showing if the transition was successful or not. NOTE: this does not work with delayed transitions.

## Context

The library also allows for 'extended finite state machine', or in other words: context aware state machines. You can define an intial 'context' as a third parameter in the `fsm` function. You can access the values via the `.context` attribute of the resulting machine.

```js
import { fsm } from 'crinkles/fsm';
const machine = fsm('green', config, { count: 0 });
// machine.context.count === 0
```

## Guarded transitions

Transitions can also be guarded. This allows you to add a condition that needs to pass, in order for the transition to successfully fire. Guards are basically functions that should return a boolean. They have access to the interal context of the machine.

```js
const config = {
  start: {
    on: {
      CHANGE: {
        target: 'end',
        guard: (ctx) => ctx?.allowed,
      },
    },
  },
  end: {},
};
```

## Adding a listener

A single listener can be registered on each machine, allowing you to invoke additional side-effects based on the source state, target state and invoked event. The listener will be invoked on each successful transition.

```js
function listener(state, context) {
  console.log(state, contextt);
}

machine.listen(listener);
```

## Actions

You are able to define 'actions'. These actions are executed when you leave a state (after guard checks), when you enter a state, or when a transition is executed. They are defined by providing a function to a state in the configuration. All actions have access to the state machine's internal context, and the `values` you provide in the `.send()` action when invoking a transition.

```js
const config = {
  green: {
    on: {
      CHANGE: {
        target: 'red',
        actions: [
          (state, ctx, values) => {
            console.log(state, ctx);
          },
        ],
      },
    },
  },
  red: {
    entry: [
      (state, ctx, values) => {
        console.log(state, ctx, values);
      },
    ],
    exit: [
      (state, ctx, values) => {
        console.log(state, ctx, values);
      },
    ],
  },
};
```

You can define multiple actions that should get executed in a list. These get executed in order on how they are defined. s

```js
import { assign, send } from '@crinkles/fsm';

const config = {
  green: {
    on: { CHANGE: 'red' },
  },
  red: {
    on: { CHANGE: 'green' },
    entry: [
      (state) => {
        console.log(state);
      },
      (_s, context) => {
        console.log(context);
      },
    ],
  },
};
```

## Action creators

Action creators are helper functions that create an `ActionObject`. During runtime, action objects are converted into actions and executed. You are able to mix and match actions and action creators in the same action list on transitions, entry and exit.

### `send` action creator

The `send` action creator allows you to automatically fire a new (delayed) transition on entry of a state.

```js
import { send } from '@crinkles/fsm';
const config = {
  green: { on: { CHANGE: 'red' } },
  red: {
    on: { CHANGE: 'green' },
    entry: [send('CHANGE', 3000)],
  },
};
```

### `assign` action creator

The `assign` action creator allows you to update the context of the machine. It can use the current context of the machine, or the values that are send as a third parameter in the `machine.send(event, values)` function.

```js
import { assign } from '@crinkles/fsm';

const config = {
  green: { on: { CHANGE: 'yellow' } },
  yellow: {
    on: { CHANGE: 'red' },
    entry: [assign((_s, ctx) => ({ count: ctx.count + 1 })),
  },
  yellow: {
    on: { CHANGE: 'green' },
    entry: assign((_s, ctx, values) => ({ count: ctx.count + values.count })),
  },
};

// { count: 2 } corresponds with the 'values' in the entry action of the red state
machine.send('CHANGE', { count: 2 });
```

## React Hook example

```js
import { fsm } from '@crinkles/fsm';
import { useLayoutEffect, useReducer, useRef } from 'react';

// Define the hook, with query for computed parameters
export default function useFsm(initial, config, context) {
  const [, rerender] = useReducer((c) => c + 1, 0);
  const value = useRef(fsm(initial, config, context));

  useLayoutEffect(() => {
    value.current.listen(rerender);
  }, []); //eslint-disable-line

  return value.current;
}
```

## Svelte store example

```js
import { fsm } from '@crinkles/fsm';
import { writable } from 'svelte/store';

export function fsmStore(initial, states) {
  const machine = fsm(initial, states);
  const { subscribe, update } = writable({
    state: machine.current,
    context: machine.context,
  });

  machine.listen((state, context) => {
    update(() => ({ state, context }));
  });

  return { subscribe, send: machine.send };
}
```
