# Getting started

A simple state machine can be initiated using the `fsm` function from the package. It allows you to view the current state (`machine.current`), or invoke a transition via the `.send(event: string, delay?: number, values?: object)` function. `delay` and `values` are optional input parameters.

```js
import { fsm } from '@crinkles/fsm';

const config = {
  green: { CHANGE: 'yellow' },
  yellow: { CHANGE: 'red' },
  red: { CHANGE: 'green' },
};

const machine = fsm('green', config);
// machine.current = 'green'
machine.send('CHANGE', { key: 'value' }, 3000);
// machine.current = 'yellow'
```

The `machine.send` function returns a `boolean` showing if the transition was successful or not. NOTE: this does not work with delayed transitions.

## Context

The library also allows for 'extended finite state machine', or in other words: context aware state machines. You can define an intial 'context' as a third parameter in the `fsm` function. You can access the values via the `.context` attribute of the resulting machine. The context is very useful when using [guards](./guards.md) or [actions](./actions.md).

```js
import { fsm } from 'crinkles/fsm';
const machine = fsm('green', config, { count: 0 });
// machine.context.count === 0
```

## [Next: guards](./guards.md)
