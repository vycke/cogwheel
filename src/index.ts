/* eslint-disable @typescript-eslint/ban-types */
import { assign, send } from './actions';
import { Action, ActionTypes, State, Machine, Transition, O } from './types';

// wrap a machine in a service
export function fsm<T extends O>(
  initial: string,
  config: Record<string, State<T>>,
  context?: T
): Machine<T> {
  // Throw error if initial state does not exist
  if (!config[initial]) throw Error('Initial state does not exist');

  let _timeout: ReturnType<typeof setTimeout>;
  const _listeners: Action<T>[] = [];
  const _state: Machine<T> = {
    current: initial,
    send,
    context: context || ({} as T),
    listen: (l: Action<T>) => {
      _listeners.push(l);
      return () => _listeners.splice(_listeners.indexOf(l) >>> 0, 1);
    },
  };

  // find and transform transition based on config
  function find(event: string): Transition<T> {
    const transition = config[_state.current][event];
    if (typeof transition === 'string') return { target: transition };
    return (transition ?? { target: '' }) as Transition<T>;
  }

  // Execution of a send action
  function send(
    event: string,
    values?: unknown,
    delay?: number
  ): boolean | void {
    clearTimeout(_timeout);
    if (delay) _timeout = setTimeout(() => transition(event, values), delay);
    else return transition(event, values);
  }

  // function to execute actions within a machine
  function execute(actions?: Action<T>[], values?: unknown): void {
    if (!actions) return;
    // Run over all actions
    for (const action of actions) {
      const aObj = action(_state.current, _state.context, values);
      if (!aObj) return;

      if (aObj.type === ActionTypes.assign) _state.context = aObj.meta as T;
      if (aObj.type === ActionTypes.send) {
        const { event, delay, values: _values } = aObj.meta;
        send(event as string, _values, delay as number | undefined);
      }
    }
  }

  // function to execute the state machine
  function transition(event: string, values?: unknown): boolean {
    const { target, guard, actions } = find(event);

    // invalid end result or guard holds result
    if (!config[target]) return false;
    if (guard && !guard(_state.context)) return false;

    // Invoke exit effects
    execute(config[_state.current]._exit, values);
    // Invoke transition effects
    execute(actions, values);

    // update state
    _state.current = target;

    // Invoke entry effects
    execute(config[_state.current]._entry, values);
    _listeners.forEach((listener) => listener(_state.current, _state.context));
    return true;
  }

  // Invoke entry if existing on the initial state
  execute(config[initial]._entry);
  return new Proxy(_state, { set: () => true });
}

// Export action creators
export { send, assign };
