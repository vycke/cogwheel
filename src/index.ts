/* eslint-disable @typescript-eslint/ban-types */
import {
  Action,
  Transition,
  Event,
  Machine,
  MachineConfig,
  MachineState,
} from "./types";

const MachineErrors = {
  init: "invalid initial state",
  target: "non-existing transition target",
};

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

function validate<C extends object, E extends Event>(
  config: MachineConfig<C, E>,
): string | undefined {
  if (!config.states[config.init]) return MachineErrors.init;

  let valid = true;
  const states = Object.keys(config.states);
  states.forEach((state) => {
    Object.entries(config.states[state]).forEach(([key, value]) => {
      if (["_exit", "_entry"].includes(key)) return;

      const target =
        typeof value === "string" ? value : (value as Transition<C, E>).target;

      if (!states.includes(target)) valid = false;
    });
  });

  return valid ? undefined : MachineErrors.target;
}

// wrap a machine in a service
export function machine<C extends object, E extends Event = Event>(
  config: MachineConfig<C, E>,
): Machine<C, E> {
  // Throw error if configuration is invalid
  const isInvalid = validate(config);
  if (isInvalid) throw Error(isInvalid);
  let _timeout: ReturnType<typeof setTimeout>;
  const _listeners: Action<C, E>[] = [];
  const _state: Machine<C, E> = {
    id: config.id || "",
    current: config.init,
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
  function execute(event: E, actions?: Action<C, E>[]): void {
    if (!actions) return;
    // Run over all actions
    for (const action of actions) {
      action({ state: partial(), event, send, assign });
    }
  }

  // function to execute the state machine
  function transition(event: E): boolean {
    let target, guard, actions;
    const transition = config.states[_state.current][event.type];
    if (!transition) return false;
    if (typeof transition === "string") target = transition;
    else ({ target, guard, actions } = transition as Transition<C, E>);

    // guard holds result
    if (guard && !guard(partial())) return false;

    // Invoke exit effects
    execute(event, config.states[_state.current]._exit);
    // Invoke transition effects
    execute(event, actions);

    // update state
    _state.current = target;

    // Invoke entry effects
    execute(event, config.states[_state.current]._entry);
    _listeners.forEach((listener) =>
      listener({ state: partial(), event, send, assign }),
    );
    return true;
  }

  // Invoke entry if existing on the initial state
  execute({ type: "__init__" } as E, config.states[config.init]._entry);
  return new Proxy(_state, { set: () => true });
}
