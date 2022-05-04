/* eslint-disable @typescript-eslint/ban-types */
export enum ActionTypes {
  send,
  assign,
}

export type O = {
  [key: string]: unknown;
};

export type Action<T extends O> = (
  partial: MachineState<T>,
  payload?: unknown
) => void | ActionObject;

export type ActionObject = {
  type: ActionTypes;
  payload: O;
};

export type Guard<T extends O> = (state: MachineState<T>) => boolean;
export type Transition<T extends O> = {
  target: string;
  guard?: Guard<T>;
  actions?: Action<T>[];
};

export type State<T extends O> = {
  _entry?: Action<T>[];
  _exit?: Action<T>[];
  [key: string]: string | Transition<T> | Action<T>[] | undefined;
};

export type Event = {
  type: string;
  payload?: unknown;
  delay?: number;
};

export type MachineConfig<T extends O> = {
  init: string;
  states: Record<string, State<T>>;
  context?: T;
};

// Partial machine
export type MachineState<T extends O> = {
  current: string;
  id: string;
  context: T;
};

export type Machine<T extends O> = MachineState<T> & {
  send(event: Event): void;
  listen(listener?: Action<T>): () => void;
};

// never is used as the type for the Machine is not important in this stage
// and to avoid sending multiple generics
export type OMachine = { [key: string]: Machine<never> };

export type ParallelMachine<T extends OMachine> = T & {
  send(event: Event): void;
};

export enum MachineErrors {
  init = 'Invalid initial state',
  target = 'A non-configured state is targeted in a transition',
}
