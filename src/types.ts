/* eslint-disable @typescript-eslint/ban-types */
export enum ActionTypes {
  send,
  assign,
}

export type Action<T extends O> = (
  state: string,
  context: T,
  values?: unknown
) => void | ActionObject;

export type O = {
  [key: string]: unknown;
};

export type ActionObject = {
  type: ActionTypes;
  meta: O;
};

export type Guard<T> = (context: T) => boolean;
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

export type Machine<T extends O> = {
  current: string;
  send(event: string, values?: unknown, delay?: number): void;
  context: T;
  listen(listener?: Action<T>): void;
};

// never is used as the type for the Machine is not important in this stage
// and to avoid sending multiple generics
export type PMachine = { [key: string]: Machine<never> };

export type ParallelMachine<T extends PMachine> = T & {
  send(event: string, values?: unknown, delay?: number): void;
};
