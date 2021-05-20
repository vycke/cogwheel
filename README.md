# JavaScript FSM

![](https://github.com/kevtiq/fsm/workflows/test/badge.svg)
[![Node version](https://img.shields.io/npm/v/@crinkle/fsm.svg?style=flat)](https://www.npmjs.com/package/@crinkle/fsm)
[![NPM Downloads](https://img.shields.io/npm/dm/@crinkle/fsm.svg?style=flat)](https://www.npmjs.com/package/@crinkle/fsm)
[![Minified size](https://img.shields.io/bundlephobia/min/@crinkle/fsm?label=minified)](https://www.npmjs.com/package/@crinkle/fsm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Simple finite state machines that can be used for state/process management. It has optional guards on the transitions. If a guard returns true, a transition cannot fire.

```js
import fsm from '@crinkle/fsm';

const config = {
  green: { on: { CHANGE: 'yellow', BREAK: 'broken' } },
  yellow: {
    on: { CHANGE: 'red' },
    entry(send: Function) {
      send('CHANGE', { delay: 3000 });
    },
  },
  red: { on: { CHANGE: 'green' } },
  broken: {
    on: { STOP: 'red', REPAIRED: 'green' },
    entry: (send) => send('STOP', { delay: 3000 }),
  },
};

// Simple invoking
const machine = fsm('green', states);
machine.send('CHANGE');
machine.send('CHANGE');
console.log(machine.current); // red

// direct sideeffects on state change
machine.send('BREAK');
console.log(machine.current); // red

// delayed sideeffects
console.log(machine.current); // green
machine.send('CHANGE');
console.log(machine.current); // yellow
// wait for delay
console.log(machine.current); // red

// canceable sideeffects
console.log(machine.current); // green
machine.send('BREAK');
console.log(machine.current); // broken
machine.send('REPAIRED'); // fired within delay of 3000ms
console.log(machine.current); // green

// listeners
let calls = 0;
const cb = (s, t, e) => calls++;
machine.listen(cb);
machine.send('CHANGE');
console.log(machine.current, calls); // yellow, 1
machine.listen(); // remove listener
```

## React hook example

```js
import { fsm } from '@crinkle/fsm';
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
