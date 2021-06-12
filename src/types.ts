/* eslint-disable @typescript-eslint/ban-types */
export enum ActionTypes {
  send,
  assign,
}
export type SingleArray<T> = T[] | T;

export type Guard<T> = (context: T) => boolean;
export type Transition<T> = { target: string; guard?: Guard<T> };

export type ActionFn<T extends object> = (ctx?: T, values?: unknown) => T;
export type Action<T extends object> = {
  type: ActionTypes;
  action?: ActionFn<T>;
  [key: string]: unknown;
};

export type State<T extends object> = {
  on?: { [key: string]: string | Transition<T> };
  entry?: SingleArray<Action<T>>;
};

export type Listener = (source: string, target: string, event: string) => void;

export type Machine<T> = {
  current: string;
  send(event: string, delay?: number, values?: unknown): void;
  context: T;
  listen(listener?: Listener): void;
};
