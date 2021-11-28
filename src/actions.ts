/* eslint-disable @typescript-eslint/ban-types */
import { ActionObject, Action, ActionTypes } from './types';

// Action creator
export function send<T extends object>(
  event: string,
  delay?: number
): ActionObject<T> {
  return { type: ActionTypes.send, meta: { event, delay } };
}

// Action creator
export function assign<T extends object>(action: Action<T>): ActionObject<T> {
  return { type: ActionTypes.assign, invoke: action, meta: {} };
}
