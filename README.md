# JavaScript FSM

![](https://github.com/crinklesio/fsm/workflows/test/badge.svg)
[![Node version](https://img.shields.io/npm/v/@crinkles/fsm.svg?style=flat)](https://www.npmjs.com/package/@crinkles/fsm)
[![NPM Downloads](https://img.shields.io/npm/dm/@crinkles/fsm.svg?style=flat)](https://www.npmjs.com/package/@crinkles/fsm)
[![Minified size](https://img.shields.io/bundlephobia/min/@crinkles/fsm?label=minified)](https://www.npmjs.com/package/@crinkles/fsm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Simple finite state machines that can be used for state/process management.

## Getting started

A simple state machine can be initiated using the `fsm` function from the package. It allows you to view the current state (`machine.current`), or invoke a transition via the `.send(event: string)` function, with an optional `delay` .

```js
import { fsm } from '@crinkles/fsm';

const config = {
  green: { on: { CHANGE: 'yellow' } },
  yellow: { on: { CHANGE: 'red' } },
  red: { on: { CHANGE: 'green' } },
};

const machine = fsm('green', config);
// machine.current = 'green'
machine.send('CHANGE', 3000);
// machine.current = 'yellow'
```

## Adding a listener

A single listener can be registered on each machine, allowing you to invoke additional side-effects based on the source state, target state and invoked event. The listener will be invoked on each successful transition.

```js
function listener(source, target, event) {
  console.log(source, target, event);
}

machine.listen(listener);
```

## Context

The library also allows for 'extended finite state machine', or in other words: context aware state machines. You can define an intial 'context' as a third parameter in the `fsm` function. You can access the values via the `.context` attribute of the resulting machine.

```js
import { fsm } from 'crinkles/fsm';
const machine = fsm('green', config, { count: 0 });
// machine.context.count === 0
```

## Actions and action creators

You are able to define 'actions'. Currently, only entry actions are supported. These actions are executed at the end of a transition, and allow you enhance your state machine. They are defined by providing a function to a state in the configuration. All actions have access to the state machine's internal context.

```js
const config = {
  green: { on: { CHANGE: 'red' } },
  red: {
    entry: (ctx) => {
      console.log(ctx);
    },
  },
};
```

In addition to flat actions, there are also several 'action creators'. These are helper functions that let the machine know, that it needs to execute additional functions within the action.

### `send` action creator

The `send` action creator allows you to automatically fire a new (delayed) transition on entry of a state.

```js
import { send } from '@crinkles/fsm';
const config = {
  green: { on: { CHANGE: 'red' } },
  red: {
    on: { CHANGE: 'green' },
    entry: () => send({ event: 'CHANGE', delay: 3000 }),
  },
};
```

> NOTE: it is important that the 'return' value of the 'entry' action is the action creator

### `assign` action creator

The `assign` action creator allows you to update the context of the machine. It can use the current context of the machine, or the values that are send as a third parameter in the `machine.send(event, delay, values)` function.

```js
import { assign } from '@crinkles/fsm';

const config = {
  green: { on: { CHANGE: 'yellow' } },
  yellow: {
    on: { CHANGE: 'red' },
    entry: (ctx) => assign({ count: ctx.count + 1 }),
  },
  yellow: {
    on: { CHANGE: 'green' },
    entry: (ctx, values) => assign({ count: ctx.count + values.count }),
  },
};

// { count: 2 } corresponds with the 'values' in the entry action of the red state
machine.send('CHANGE', 0, { count: 2 });
..
```

> NOTE: it is important that the 'return' value of the 'entry' action is the action creator

### Multiple action creators on entry

You can also invoke multiple action creators in an entry action.

```js
import { assign, send } from '@crinkles/fsm';

const config = {
  green: {
    on: { CHANGE: 'red' },
  },
  red: {
    on: { CHANGE: 'green' },
    entry: (ctx, event) => [
      assign({ count: ctx.count + 1 + event.count }),
      send({ event: 'CHANGE', delay: 3000 }),
    ],
  },
};
```

> NOTE: it is important that the 'return' value of the 'entry' action is an array of action creators

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
