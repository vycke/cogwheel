# JavaScript FSM

![](https://github.com/kevtiq/fsm/workflows/test/badge.svg)
[![Node version](https://img.shields.io/npm/v/@crinkle/fsm.svg?style=flat)](https://www.npmjs.com/package/@crinkle/fsm)
[![NPM Downloads](https://img.shields.io/npm/dm/@crinkle/fsm.svg?style=flat)](https://www.npmjs.com/package/@crinkle/fsm)
[![Minified size](https://img.shields.io/bundlephobia/min/@crinkle/fsm?label=minified)](https://www.npmjs.com/package/@crinkle/fsm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Simple finite state machines that can be used for state/process management. It has optional guards on the transitions. If a guard returns true, a transition cannot fire.

```js
import fsm from '@crinkle/fsm';

const states = {
  green: { CHANGE: 'yellow', BREAK: 'broken' },
  yellow: {
    CHANGE: 'red',
    async effect(send) {
      await delay(100); // delay for 3000ms
      send('CHANGE');
    },
  },
  red: { CHANGE: 'green' },
  broken: {
    STOP: 'red',
    effect(send) {
      send('STOP');
    },
  },
};

// Simple invoking
const myMachine = fsm('green', states);
myMachine.send('CHANGE');
myMachine.send('CHANGE');
console.log(myMachine.state); // { value: 'red' }

// direct sideeffects on state change
const myMachine = fsm('green', states);
myMachine.send('BREAK');
console.log(myMachine.state); // { value: 'red' }

// delayed effects and machine callbacks
let calls = 0;
const cb = () => calls++;
const myMachine = fsm('green', states, cb);
myMachine.send('CHANGE');
console.log(myMachine.state, calls); // { value: yellow }, 1
// wait for the delay
console.log(myMachine.state, calls); // { value: 'red' }, 2
```
