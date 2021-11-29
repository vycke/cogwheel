/* eslint-disable @typescript-eslint/ban-types */
export enum ActionTypes {
  send,
  assign,
}

export type Action<T extends object> = (
  state: string,
  context: T,
  values?: unknown
) => void | T;

export type ActionObject<T extends object> = {
  type: ActionTypes;
  invoke?: Action<T>;
  meta: { [key: string]: unknown };
};

export type ActionList<T extends object> = (ActionObject<T> | Action<T>)[];

export type Guard<T> = (context: T) => boolean;
export type Transition<T extends object> = {
  target: string;
  guard?: Guard<T>;
  actions?: ActionList<T>;
};

export type State<T extends object> = {
  _entry?: ActionList<T>;
  _exit?: ActionList<T>;
  [key: string]: string | Transition<T> | ActionList<T> | undefined;
};

export type Machine<T extends object> = {
  current: string;
  send(event: string, values?: unknown, delay?: number): void;
  context: T;
  listen(listener?: Action<T>): void;
};
