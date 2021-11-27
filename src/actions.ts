/* eslint-disable @typescript-eslint/ban-types */
import { Action, Assign, ActionTypes, SingleArray } from './types';

// Action creator
export function send<T extends object>(
  event: string,
  delay?: number
): Action<T> {
  return { type: ActionTypes.send, event, delay };
}

// Action creator
export function assign<T extends object>(assigner: Assign<T>): Action<T> {
  return { type: ActionTypes.assign, action: assigner };
}

// function to execute actions within a machine
export function invokeAction<T extends object>(
  execute: Function,
  actions?: SingleArray<Action<T>>,
  values?: unknown
): void {
  if (!actions) return;
  if (Array.isArray(actions))
    actions.forEach((action) => execute(action, values));
  else execute(actions, values);
}
