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
    async entry(send: Function) {
      await delay(100); // delay for 3000ms
      send('CHANGE');
    },
  },
  red: { on: { CHANGE: 'green' } },
  broken: {
    on: { STOP: 'red' },
    entry: (send) => send('STOP'),
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

// listeners
let calls = 0;
const cb = (s, t, e) => calls++;
machine.listen(cb);
machine.send('CHANGE');
console.log(machine.current, calls); // yellow, 1
machine.listen(); // remove listener
```
