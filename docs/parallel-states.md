# Parallel states

Some scenarios require having state machines run in parallel. The `parallel` helper allows you to register multiple machines in a `key-machine` pair. With the resulting parallel machine you can send one event that triggers a transition (if allowed by the machine) in all the machines. The `send` action is the same as the send action in a standard [machine](./getting-started.md).

```js
import { machine, parallel } from 'cogwheel';

const legsConfig = {
	init: 'still',
	states: { still: { WALK: 'move' }, move: { STOP: 'still' } },
};
const tailConfig = {
	init: 'still',
	states: { still: { WALK: 'waggle' }, waggle: { STOP: 'still' } },
};

const tail = machine(tailConfig);
const legs = machine(legsConfig);
const dog = parallel({ tail, legs });
console.log(dog.tail.current, dog.legs.current); // 'still', 'still'
dog.send({ type: 'walk' });
console.log(dog.tail.current, dog.legs.current); // 'waggle', 'move'
```

## [Next: front-end framework implementation](./front-end-frameworks.md)
