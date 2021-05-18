type ActionCreator = (event: string) => void;
type Action = (creator: ActionCreator) => void;

type Node = { on: { [key: string]: string }; entry?: Action };

type Listener = (source: string, target: string, event: string) => void;
type Machine = {
  current: string;
  send: ActionCreator;
  listen(listener?: Listener): void;
};

// wrap a machine in a service
export function fsm(initial: string, states: Record<string, Node>): Machine {
  let _listener: Listener | undefined;
  const _state: Machine = {
    current: initial,
    send,
    listen: (l) => (_listener = l),
  };

  function send(event: string): void {
    const target = states[_state.current].on[event];
    if (!states[target]) return;

    _listener?.(_state.current, target, event);
    _state.current = target;
    states[target].entry?.(send);
  }

  return new Proxy(_state, { set: () => true });
}
