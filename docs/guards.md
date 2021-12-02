# Guards

Transitions can also be guarded. This allows you to add a condition that needs to pass, in order for the transition to successfully fire. Guards are basically functions that should return a boolean. They have access to the interal context of the machine. When the guard evaluates as `true`, the transition is allowed.

```js
const config = {
  start: {
    CHANGE: {
      target: 'end',
      guard: (ctx) => ctx?.allowed,
    },
  },
  end: {},
};
```

## [Next: actions](./actions.md)
