/* eslint-disable @typescript-eslint/ban-types */
import { assign, invokeAction, send } from './actions';
import {
  Action,
  ActionTypes,
  Assign,
  State,
  Machine,
  Listener,
  Transition,
} from './types';

// wrap a machine in a service
export function fsm<T extends object>(
  initial: string,
  config: Record<string, State<T>>,
  context?: T
): Machine<T> {
  // Throw error if initial state does not exist
  if (!config[initial]) throw Error('Initial state does not exist');

  let _listener: Listener<T> | undefined;
  let _timeout: ReturnType<typeof setTimeout>;
  const _state: Machine<T> = {
    current: initial,
    send,
    context: context || ({} as T),
    listen: (l) => (_listener = l),
  };

  // find and transform transition based on config
  function find(event: string): Transition<T> {
    const transition = config[_state.current].on?.[event];
    if (typeof transition === 'string') return { target: transition };
    return transition ?? { target: '' };
  }

  // Execution of a send action
  function send(event: string, delay?: number, values?: unknown): void {
    clearTimeout(_timeout);
    if (delay) _timeout = setTimeout(() => transition(event, values), delay);
    else transition(event, values);
  }

  // internal function to execute an action
  function execute(creator: Action<T>, values?: unknown): void {
    if (creator.type === ActionTypes.send)
      send(creator.event as string, creator.delay as number | undefined);
    if (creator.type === ActionTypes.assign && creator.action)
      _state.context = (creator.action as Assign<T>)(_state.context, values);
  }

  // function to execute the state machine
  function transition(event: string, values?: unknown) {
    const { target, guard, actions } = find(event);

    // invalid end result or guard holds result
    if (!config[target]) return;
    if (guard && !guard(_state.context)) return;

    // Invoke exit effects
    invokeAction(execute, config[_state.current].exit, values);
    // Invoke transition effects
    invokeAction(execute, actions, values);

    // update state
    const oldstate = _state.current;
    _state.current = target;

    // Invoke entry effects
    invokeAction(execute, config[target].entry, values);
    const { current, context } = _state;
    _listener?.(event, oldstate, { current, context });
  }

  // Invoke entry if existing on the initial state
  invokeAction(execute, config[initial].entry);

  return new Proxy(_state, { set: () => true });
}

// Export action creators
export { send, assign };
