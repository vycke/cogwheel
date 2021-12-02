/* eslint-disable @typescript-eslint/ban-types */
import { ActionObject, ActionTypes, O } from './types';

// Action creator
export function send(
  event: string,
  values?: unknown,
  delay?: number
): ActionObject {
  return { type: ActionTypes.send, meta: { event, values, delay } };
}

// Action creator
export function assign<T extends O>(ctx: T): ActionObject {
  return { type: ActionTypes.assign, meta: ctx };
}
