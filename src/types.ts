/* eslint-disable @typescript-eslint/ban-types */
export type O = {
  [key: string]: unknown;
};

export type Event = {
  type: string;
};

type Send<E extends Event> = (event: E, delay?: number) => boolean;
type Assign<C extends O> = (ctx: C) => void;
type Listen<C extends O, E extends Event> = (
  listener: Action<C, E>
) => () => void;

export type Action<C extends O, E extends Event> = (
  partial: MachineState<C>,
  event: E,
  actions: { send: Send<E>; assign: Assign<C> }
) => void;

export type Guard<C extends O> = (state: MachineState<C>) => boolean;
export type Transition<C extends O, E extends Event> = {
  target: string;
  guard?: Guard<C>;
  actions?: Action<C, E>[];
};

export type State<C extends O, E extends Event> = {
  _entry?: Action<C, E>[];
  _exit?: Action<C, E>[];
  [key: string]: string | Transition<C, E> | Action<C, E>[] | undefined;
};

export type MachineConfig<C extends O, E extends Event> = {
  init: string;
  states: Record<string, State<C, E>>;
  id?: string;
  context?: C;
};

// Partial machine
export type MachineState<C extends O> = {
  current: string;
  id: string;
  context: C;
};

export type Machine<C extends O, E extends Event> = MachineState<C> & {
  send: Send<E>;
  listen: Listen<C, E>;
};

export enum MachineErrors {
  init = 'invalid initial state',
  target = 'non-existing transition target',
}
