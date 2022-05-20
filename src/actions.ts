/* eslint-disable @typescript-eslint/ban-types */
import { ActionObject, ActionTypes, Event, O } from './types';

// Action creator
export function send(event: Event, delay?: number): ActionObject {
  return { type: ActionTypes.send, payload: { event, delay } };
}

// Action creator
export function assign<T extends O>(ctx: T): ActionObject {
  return { type: ActionTypes.assign, payload: ctx };
}
