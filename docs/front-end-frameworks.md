# Front-end framework implementation

The FSM library is framework agnostic. It works perfectly with frameworks like React and Svelte.

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

## [Next: state machine examples](./examples.md)
