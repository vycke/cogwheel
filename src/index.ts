/* eslint-disable @typescript-eslint/ban-types */
import { assign, send } from './actions';
import {
  Action,
  ActionTypes,
  Transition,
  O,
  Event,
  Machine,
  MachineConfig,
} from './types';
import { copy, freeze } from './utils';
import { parallel } from './parallel';

// wrap a machine in a service
export function machine<T extends O>(config: MachineConfig<T>): Machine<T> {
  // Throw error if initial state does not exist
  if (!config.states[config.init]) throw Error('Initial state does not exist');

  let _timeout: ReturnType<typeof setTimeout>;
  const _listeners: Action<T>[] = [];
  const _state: Machine<T> = {
    current: config.init,
    send,
    context: freeze(config.context || ({} as T)),
    listen: (l: Action<T>) => {
      _listeners.push(l);
      return () => _listeners.splice(_listeners.indexOf(l) >>> 0, 1);
    },
  };

  // find and transform transition based on config
  function find(eventName: string): Transition<T> {
    const transition = config.states[_state.current][eventName];
    if (typeof transition === 'string') return { target: transition };
    return (transition ?? { target: '' }) as Transition<T>;
  }

  // Execution of a send action
  function send(event: Event): boolean | void {
    clearTimeout(_timeout);
    if (event.delay)
      _timeout = setTimeout(() => transition(event), event.delay);
    else return transition(event);
  }

  // function to execute actions within a machine
  function execute(actions?: Action<T>[], payload?: unknown): void {
    if (!actions) return;
    // Run over all actions
    for (const action of actions) {
      const aObj = action(_state.current, copy<T>(_state.context), payload);
      if (!aObj) return;

      if (aObj.type === ActionTypes.assign)
        _state.context = freeze<T>(aObj.payload as T);
      if (aObj.type === ActionTypes.send) send(aObj.payload as Event);
    }
  }

  // function to execute the state machine
  function transition(event: Event): boolean {
    const { target, guard, actions } = find(event.type);

    // invalid end result or guard holds result
    if (!config.states[target]) return false;
    if (guard && !guard(_state.context)) return false;

    // Invoke exit effects
    execute(config.states[_state.current]._exit, event.payload);
    // Invoke transition effects
    execute(actions, event.payload);

    // update state
    _state.current = target;

    // Invoke entry effects
    execute(config.states[_state.current]._entry, event.payload);
    _listeners.forEach((listener) =>
      listener(_state.current, _state.context, event.payload)
    );
    return true;
  }

  // Invoke entry if existing on the initial state
  execute(config.states[config.init]._entry);
  return new Proxy(_state, { set: () => true });
}

// Export action creators & utilities
export { send, assign, parallel };
