type Send = (name: string) => void;
type Effect = (send: Send) => void;
type Node = Record<string, string> | { effect: Effect };
type Config = Record<string, Node>;
type State = { value: string };
type CB = (state: State) => void;
type Machine = { send: Send; state: State };

// wrap a machine in a service
export default function fsm(init: string, states: Config, cb?: CB): Machine {
  let _state = Object.freeze({ value: init });

  function send(name: string): void {
    const event = states[_state.value][name];
    if (!event || !states[event]) return;

    _state = Object.freeze({ value: event });
    cb?.(_state);
    (states[event].effect as Effect)?.(send), 0;
  }

  return {
    get state() {
      return _state;
    },
    send,
  };
}
