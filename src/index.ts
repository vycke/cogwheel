/**
 * Types
 */
export type MachineEvent = { type: string };
/** @deprecated Use `MachineEvent`; `Event` shadows the DOM `Event` type. */
export type Event = MachineEvent;

type Send<E extends MachineEvent> = (event: E, delay?: number) => boolean;
type Assign<C extends object> = (ctx: C) => void;
type Listen<C extends object, E extends MachineEvent> = (
  listener: Action<C, E>,
) => () => void;

// Partial machine
export type MachineState<C extends object> = {
  readonly current: string;
  readonly id: string;
  readonly context: C;
};

export type ActionInput<C extends object, E extends MachineEvent> = {
  state: MachineState<C>;
  event: E;
  send: Send<E>;
  assign: Assign<C>;
};

export type Action<C extends object, E extends MachineEvent> = (
  input: ActionInput<C, E>,
) => void;

export type Guard<C extends object> = (state: MachineState<C>) => boolean;

// S is the union of state names, inferred by `machine()` from the keys of `states`
export type Transition<
  C extends object,
  E extends MachineEvent,
  S extends string = string,
> = {
  target: S;
  guard?: Guard<C>;
  actions?: readonly Action<C, E>[];
};

type LooseState<C extends object, E extends MachineEvent, S extends string> = {
  _entry?: readonly Action<C, E>[];
  _exit?: readonly Action<C, E>[];
  [key: string]: S | Transition<C, E, S> | readonly Action<C, E>[] | undefined;
};

// Events with literal `type`s get their keys checked; `{ type: string }` falls
// back to an index signature that accepts any key.
export type State<
  C extends object,
  E extends MachineEvent,
  S extends string = string,
> = string extends E["type"]
  ? LooseState<C, E, S>
  : { _entry?: readonly Action<C, E>[]; _exit?: readonly Action<C, E>[] } & {
      [K in E["type"]]?: S | Transition<C, E, S>;
    };

// NoInfer: state names are inferred from the keys of `states` only, so a typo
// in `init` or a `target` is an error instead of a new state.
export type MachineConfig<
  C extends object,
  E extends MachineEvent,
  S extends string = string,
> = {
  init: NoInfer<S>;
  states: Record<S, State<C, E, NoInfer<S>>>;
  id?: string;
  context?: C;
};

export type Machine<
  C extends object,
  E extends MachineEvent,
  S extends string = string,
> = {
  readonly current: S;
  readonly id: string;
  readonly context: C;
  send: Send<E>;
  listen: Listen<C, E>;
};

/**
 * Constants
 */
const MachineErrors = {
  init: "invalid initial state",
  target: "non-existing transition target",
};

/**
 * Code
 */

// deep-freeze for immutability
function freeze<T extends object>(obj: T): T {
  if (Object.isFrozen(obj)) return obj;
  Object.freeze(obj);
  Object.keys(obj).forEach((prop: string) => {
    if (typeof obj[prop] !== "object" || Object.isFrozen(obj[prop])) return;
    freeze(obj[prop] as object);
  });
  return obj;
}

function validate(
  init: string,
  states: Record<string, object>,
): string | undefined {
  if (!states[init]) return MachineErrors.init;

  let valid = true;
  const names = Object.keys(states);
  names.forEach((state) => {
    Object.entries(states[state]).forEach(([key, value]) => {
      if (["_exit", "_entry"].includes(key)) return;

      const target =
        typeof value === "string"
          ? value
          : (value as { target: string }).target;

      if (!names.includes(target)) valid = false;
    });
  });

  return valid ? undefined : MachineErrors.target;
}

// wrap a machine in a service
export function machine<
  C extends object,
  E extends MachineEvent = MachineEvent,
  S extends string = string,
>(config: MachineConfig<C, E, S>): Machine<C, E, S> {
  // The checked `State` type is only for callers; internally every state is loose
  const states = config.states as Record<string, LooseState<C, E, S>>;
  // Throw error if configuration is invalid
  const isInvalid = validate(config.init, states);
  if (isInvalid) throw Error(isInvalid);
  let _timeout: ReturnType<typeof setTimeout>;
  const _listeners: Action<C, E>[] = [];
  const _state = {
    id: config.id || "",
    current: config.init as S,
    send,
    context: freeze(config.context || ({} as C)),
    listen: (l: Action<C, E>) => {
      _listeners.push(l);
      return () => _listeners.splice(_listeners.indexOf(l) >>> 0, 1);
    },
  };

  // Get partial information of the machine
  function partial(): MachineState<C> {
    const { id, context, current } = _state;
    return { id, current, context: JSON.parse(JSON.stringify(context)) };
  }

  // Execution of a send action
  function send(event: E, delay?: number): boolean {
    clearTimeout(_timeout);
    if (delay) {
      _timeout = setTimeout(() => transition(event), delay);
      return true;
    } else return transition(event);
  }
  // Execution of context mutations
  function assign(ctx: C): void {
    _state.context = freeze<C>(ctx);
  }

  // function to execute actions within a machine
  function execute(event: E, actions?: readonly Action<C, E>[]): void {
    if (!actions) return;
    // Run over all actions
    for (const action of actions) {
      action({ state: partial(), event, send, assign });
    }
  }

  // function to execute the state machine
  function transition(event: E): boolean {
    let target: S, guard, actions;
    const transition = states[_state.current][event.type];
    if (!transition) return false;
    if (typeof transition === "string") target = transition;
    else ({ target, guard, actions } = transition as Transition<C, E, S>);

    // guard holds result
    if (guard && !guard(partial())) return false;

    // Invoke exit effects
    execute(event, states[_state.current]._exit);
    // Invoke transition effects
    execute(event, actions);

    // update state
    _state.current = target;

    // Invoke entry effects
    execute(event, states[_state.current]._entry);
    _listeners.forEach((listener) =>
      listener({ state: partial(), event, send, assign }),
    );
    return true;
  }

  // Invoke entry if existing on the initial state
  execute({ type: "__init__" } as E, states[config.init]._entry);
  return new Proxy(_state, { set: () => true });
}
