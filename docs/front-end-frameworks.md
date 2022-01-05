# Front-end framework implementation

The cogwheel library is framework agnostic. It works perfectly with frameworks like React and Svelte.

## React Hook example

```js
import { machine } from 'cogwheel';
import { useLayoutEffect, useReducer, useRef } from 'react';

// Define the hook, with query for computed parameters
export default function usecogwheel(initial, config, context) {
  const [, rerender] = useReducer((c) => c + 1, 0);
  const value = useRef(machine(initial, config, context));

  useLayoutEffect(() => {
    const remove = value.current.listen(rerender);
    return () => remove();
  }, []); //eslint-disable-line

  return value.current;
}
```

## Svelte store example

```js
import { machine } from 'cogwheel';
import { writable } from 'svelte/store';

export function cogwheelStore(initial, states) {
  const machine = machine(initial, states);
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
