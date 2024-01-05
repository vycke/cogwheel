/* eslint-disable @typescript-eslint/ban-types */
export type Event = {
  type: string;
};

type Send<E extends Event> = (event: E, delay?: number) => boolean;
type Assign<C extends object> = (ctx: C) => void;
type Listen<C extends object, E extends Event> = (
  listener: Action<C, E>,
) => () => void;

export type ActionInput<C extends object, E extends Event> = {
  state: MachineState<C>;
  event: E;
  send: Send<E>;
  assign: Assign<C>;
};

export type Action<C extends object, E extends Event> = (
  input: ActionInput<C, E>,
) => void;

export type Guard<C extends object> = (state: MachineState<C>) => boolean;
export type Transition<C extends object, E extends Event> = {
  target: string;
  guard?: Guard<C>;
  actions?: Action<C, E>[];
};

export type State<C extends object, E extends Event> = {
  _entry?: Action<C, E>[];
  _exit?: Action<C, E>[];
  [key: string]: string | Transition<C, E> | Action<C, E>[] | undefined;
};

export type MachineConfig<C extends object, E extends Event> = {
  init: string;
  states: Record<string, State<C, E>>;
  id?: string;
  context?: C;
};

// Partial machine
export type MachineState<C extends object> = {
  current: string;
  id: string;
  context: C;
};

export type Machine<C extends object, E extends Event> = MachineState<C> & {
  send: Send<E>;
  listen: Listen<C, E>;
};
