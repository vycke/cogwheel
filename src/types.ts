/* eslint-disable @typescript-eslint/ban-types */
export enum ActionTypes {
  send,
  assign,
}
export type SingleArray<T> = T[] | T;

export type Guard<T> = (context: T) => boolean;
export type Transition<T extends object> = {
  target: string;
  guard?: Guard<T>;
  actions?: SingleArray<Action<T>>;
};

export type Assign<T extends object> = (ctx: T, values?: unknown) => T;
export type Action<T extends object> = {
  type: ActionTypes;
  action?: Assign<T>;
  [key: string]: unknown;
};

export type State<T extends object> = {
  on?: { [key: string]: string | Transition<T> };
  entry?: SingleArray<Action<T>>;
  exit?: SingleArray<Action<T>>;
};

export type Listener<T> = (
  event: string,
  source: string,
  state: { current: string; context: T }
) => void;

export type Machine<T> = {
  current: string;
  send(event: string, delay?: number, values?: unknown): void;
  context: T;
  listen(listener?: Listener<T>): void;
};
