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
machine.send('CHANGE', { delay?: 3000 });
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

## Entry actions & auto-transitions

When entering a state, an entry action can be triggered by setting a function the `entry` attribute of a state configuration. It provides access to the internal `send()` function, allowing you to define auto-transitions when entering a state. These auto-transitions are event triggered on the initial state.

```js
const config = {
  left: {
    on: { CHANGE: 'right' },
    entry: (send) => send('CHANGE', { delay: 3000 }),
  },
  right: {
    on: { CHANGE: 'left' },
    entry: (send) => send('CHANGE', { delay: 3000 }),
  },
};

const machine = fsm('left', config);
// machine.current = 'left', after 3000ms, it will be 'right'
```

When you manually invoke a transition, while a delayed auto-transition did not yet happen (e.g. within the `3000ms` delay of the above example), the auto-transition gets canceled to avoid unwanted side-effects.

As the machines of this library are context unaware, you can send an `object` as a third parameter in the `.send()` object. This added context is provided as a second parameter in an entry action definition. This allows you to create conditional auto-transitions.

```js
function myEntryAction(send, ctx) {
  if (ctx.isAdmin) send('SUDO');
  else send('ERROR');
}

machine.send('START', {}, { isAdmin: true });
```

## Guarded transitions

Transitions can also be guarded. This allows you to add aa condition that needs to pass, in order for the transition to successfully fire. Similar to entry actions, the context object as the third parameter of the `send()` can be used allow the guard to operate based on the context. Only when the result is `true`, will the transition happen.

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

const machine = fsm('start', config);
machine.send('CHANGE'); // will result in no changes
machine.send('CHANGE', {}, { allowed: false }); // will result in no changes
machine.send('CHANGE', {}, { allowed: true }); // will result changes
```

## React Hook example

```js
import { fsm } from '@crinkles/fsm';
import { useLayoutEffect, useReducer, useRef } from 'react';

// Define the hook, with query for computed parameters
export default function useFsm(initial, config) {
  const [, rerender] = useReducer((c) => c + 1, 0);
  const value = useRef(fsm(initial, config));

  useLayoutEffect(() => {
    value.current.listen(rerender);
  }, []); //eslint-disable-line

  return value.current;
}
```
