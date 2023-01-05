# Front-end framework implementation

The cogwheel library is framework agnostic. It works perfectly with frameworks like React and Svelte.

## React Hook example

```js
import { machine } from 'cogwheel';
import { useLayoutEffect, useReducer, useRef } from 'react';

// Define the hook, with query for computed parameters
export default function useMachine(config) {
  const [, rerender] = useReducer((c) => c + 1, 0);
  const value = useRef(machine(config));

  useLayoutEffect(() => {
    const remove = value.current.listen(rerender);
    return () => remove();
  }, []); //eslint-disable-line

  return value.current;
}
```

## Svelte store example

```ts
import { machine as fsm } from 'cogwheel';
import type { MachineConfig, Event, MachineState } from 'cogwheel/dist/types';
import { readable } from 'svelte/store';
import type { Readable } from 'svelte/store';

type O = {
  [key: string]: unknown;
};

export type ReadableMachineStore<T extends O> = Readable<MachineState<T>>;
export type MachineStore<T extends O, E extends Event = Event> = {
  state: ReadableMachineStore<T>;
  send(event: E): void;
};

export function machineStore<T extends O, E extends Event = Event>(
  config: MachineConfig<T, E>
): MachineStore<T, E> {
  const machine = fsm(config);
  const { current, id, context } = machine;
  const state = readable({ current, id, context }, (set) => {
    return machine.listen(({ state }) => {
      const { context, current } = state;
      set({ context, current, id });
    });
  });

  return { state, send: machine.send };
}
```

## [Next: state machine examples](./examples.md)
