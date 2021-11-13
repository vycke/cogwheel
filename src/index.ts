/* eslint-disable @typescript-eslint/ban-types */
import {
  Action,
  ActionTypes,
  ActionFn,
  State,
  Machine,
  Listener,
  SingleArray,
  Transition,
} from './types';

// Action creator
export function send<T extends object>(
  event: string,
  delay?: number
): Action<T> {
  return { type: ActionTypes.send, event, delay };
}

// Action creator
export function assign<T extends object>(assigner: ActionFn<T>): Action<T> {
  return { type: ActionTypes.assign, action: assigner };
}

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

  //
  function executeAction(creator: Action<T>, values?: unknown): void {
    if (creator.type === ActionTypes.send)
      send(creator.event as string, creator.delay as number | undefined);
    if (creator.type === ActionTypes.assign && creator.action)
      _state.context = (creator.action as ActionFn<T>)(_state.context, values);
  }

  // function to execture various actions
  function executeEntryAction(
    entry?: SingleArray<Action<T>>,
    values?: unknown
  ): void {
    if (!entry) return;
    if (Array.isArray(entry)) entry.forEach((e) => executeAction(e, values));
    else executeAction(entry, values);
  }

  // function to execute the state machine
  function transition(event: string, values?: unknown) {
    const { target, guard } = find(event);

    // invalid end result or guard holds result
    if (!config[target]) return;
    if (guard && !guard(_state.context)) return;

    const oldstate = _state.current;
    _state.current = target;

    executeEntryAction(config[target].entry, values);
    _listener?.(oldstate, _state.current, event, _state.context);
  }

  // Invoke entry if existing on the initial state
  executeEntryAction(config[initial].entry);

  return new Proxy(_state, { set: () => true });
}
