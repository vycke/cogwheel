type Options = { delay?: number };
type ActionCreator = (event: string, options?: Options) => void;
type Action = (creator: ActionCreator, event: string) => void;

type Node = { on: { [key: string]: string }; entry?: Action };

type Listener = (source: string, target: string, event: string) => void;
type Machine = {
  current: string;
  send: ActionCreator;
  listen(listener?: Listener): void;
};

// wrap a machine in a service
export function fsm(initial: string, config: Record<string, Node>): Machine {
  let _listener: Listener | undefined;
  let _timeout: ReturnType<typeof setTimeout>;
  const _state: Machine = {
    current: initial,
    send,
    listen: (l) => (_listener = l),
  };

  // function to exect
  function transition(target: string, event: string) {
    const oldstate = _state.current;
    _state.current = target;
    _listener?.(oldstate, _state.current, event);
    config[target].entry?.(send, event);
  }

  function send(event: string, options?: Options): void {
    clearTimeout(_timeout);
    const target = config[_state.current].on[event];
    if (!config[target]) return;

    if (options?.delay)
      _timeout = setTimeout(() => transition(target, event), options.delay);
    else transition(target, event);
  }

  return new Proxy(_state, { set: () => true });
}
