# Hierarchical machines

Cogwheel does not support hierarchical machines by default. However, the API is build to allow a certain level of freedom to facilitate (unoptimised) hierarchical machines. An example can be found [here](../tests/examples/hierarchical.test.ts). This example follows these steps.

1. Create a generic action to allow allow for transitions internally.

```js
function nestedTransitionAction(config, init) {
  return function (state, event) {
    const _machine = machine({
      states: config,
      init: state.context.current || init,
    });
    _machine.send(event);
    return assign({ current: _machine.current });
  };
}
```

2. Create a generic action to transition automatically when the inner machine is in a certain state.

```js
function nestedExitTransition(exit, transition) {
  return function (state) {
    if (state.context.current === exit) return send({ type: transition });
  };
}
```

3. Create the configuration of the inner state machine.

```js
const inner = {
  walk: { START: 'blink' },
  blink: { FINISH: 'stop' },
  stop: {},
};
```

4. Create the configuration of the outer state machine. Note that you have to create self-transitions for each of the possible inner-transisions in this configuration to allow for this method to work.

```js
const outer = {
  green: {
    GO: { target: 'red', guard: ({ context }) => context.current === 'stop' },
    START: 'green',
    FINISH: 'green',
    _entry: [
      nestedTransitionAction(inner, 'walk'),
      nestedExitTransition('stop', 'GO'),
    ],
  },
  red: { GO: 'green' },
};
```

## [Next: front-end framework implementation](./front-end-frameworks.md)
