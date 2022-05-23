/* eslint-disable @typescript-eslint/ban-types */
export enum ActionTypes {
  send,
  assign,
}

export type O = {
  [key: string]: unknown;
};

export type Event = {
  type: string;
};

export type Action<C extends O, E extends Event> = (
  partial: MachineState<C>,
  event: E
) => void | ActionObject;

export type ActionObject = {
  type: ActionTypes;
  payload: O;
};

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
  context?: C;
};

// Partial machine
export type MachineState<C extends O> = {
  current: string;
  id: string;
  context: C;
};

export type Machine<C extends O, E extends Event> = MachineState<C> & {
  send(event: E, delay?: number): void;
  listen(listener?: Action<C, E>): () => void;
};

export enum MachineErrors {
  init = 'invalid initial state',
  target = 'non-existing transition target',
}
