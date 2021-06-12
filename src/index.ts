/* eslint-disable @typescript-eslint/ban-types */
enum ActionTypes {
  send,
  assign,
}

type Guard<T> = (ctx: T) => boolean;
type Transition<T> = { target: string; guard?: Guard<T> };
type SendAction = { event: string; delay?: number };
type AssignAction<T> = T;

type ActionCreator<T> = {
  type: ActionTypes;
  action: SendAction | AssignAction<T>;
};
type EntryAction<T> = (
  ctx?: T,
  values?: unknown
) => void | ActionCreator<T | unknown> | ActionCreator<T | unknown>[];
type State<T> = {
  on?: { [key: string]: string | Transition<T> };
  entry?: EntryAction<T>;
};

type Listener = (source: string, target: string, event: string) => void;
type Machine<T> = {
  current: string;
  send(event: string, delay?: number, values?: unknown): void;
  context: T;
  listen(listener?: Listener): void;
};

// Action creator
export function send<T>(action: SendAction): ActionCreator<T> {
  return { type: ActionTypes.send, action };
}

// Action creator
export function assign<T>(ctx: T): ActionCreator<T> {
  return { type: ActionTypes.assign, action: ctx };
}

// wrap a machine in a service
export function fsm<T extends object>(
  initial: string,
  config: Record<string, State<T>>,
  context?: T
): Machine<T> {
  // Throw error if initial state does not exist
  if (!config[initial]) throw Error('Initial state does not exist');

  let _listener: Listener | undefined;
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

  function executeAction(creator: ActionCreator<T | unknown>): void {
    let _action;
    if (creator.type === ActionTypes.send) {
      _action = creator.action as SendAction;
      send(_action.event, _action.delay);
    }
    if (creator.type === ActionTypes.assign)
      _state.context = creator.action as AssignAction<T>;
  }

  // function to execture various actions
  function executeEntryAction(entry?: EntryAction<T>, values?: unknown): void {
    const actions = entry?.(_state.context, values);
    if (!actions) return;

    if (Array.isArray(actions)) actions.forEach((a) => executeAction(a));
    else executeAction(actions);
  }

  // function to execute the state machine
  function transition(event: string, values?: unknown) {
    const { target, guard } = find(event);

    // invalid end result or guard holds result
    if (!config[target]) return;
    if (guard && !guard(_state.context)) return;

    const oldstate = _state.current;
    _state.current = target;
    _listener?.(oldstate, _state.current, event);

    executeEntryAction(config[target].entry, values);
  }

  // Invoke entry if existing on the initial state
  executeEntryAction(config[initial].entry);

  return new Proxy(_state, { set: () => true });
}
