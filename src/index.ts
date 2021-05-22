type Options = { delay?: number };
type Context = Record<string, unknown>;
type Send = (event: string, options?: Options, ctx?: Context) => void;
type Action = (send: Send, event?: string, ctx?: Context) => void;

// type Guard = (ctx?: Context) => boolean;
type Transition = string;
type State = { on?: { [key: string]: Transition }; entry?: Action };

type Listener = (source: string, target: string, event: string) => void;
type Machine = {
  current: string;
  send: Send;
  listen(listener?: Listener): void;
};

// wrap a machine in a service
export function fsm(initial: string, config: Record<string, State>): Machine {
  // Throw error if initial state does not exist
  if (!config[initial]) throw Error('Initial state does not exist');

  let _listener: Listener | undefined;
  let _timeout: ReturnType<typeof setTimeout>;
  const _state: Machine = {
    current: initial,
    send,
    listen: (l) => (_listener = l),
  };

  // function to execute the state machine
  function transition(event: string, ctx?: Context) {
    const target = config[_state.current].on?.[event];

    if (!target || !config[target]) return;
    const oldstate = _state.current;
    _state.current = target;
    _listener?.(oldstate, _state.current, event);
    config[target].entry?.(send, event, ctx);
  }

  // The action creator
  function send(event: string, options?: Options, ctx?: Context): void {
    clearTimeout(_timeout);
    if (options?.delay)
      _timeout = setTimeout(() => transition(event, ctx), options.delay);
    else transition(event, ctx);
  }

  // Invoke entry if existing on the initial state
  config[initial].entry?.(send);

  return new Proxy(_state, { set: () => true });
}
