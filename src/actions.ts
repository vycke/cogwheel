/* eslint-disable @typescript-eslint/ban-types */
import { ActionObject, ActionTypes, Event, O } from './types';

// Action creator
export function send(event: Event): ActionObject {
  return { type: ActionTypes.send, payload: event };
}

// Action creator
export function assign<T extends O>(ctx: T): ActionObject {
  return { type: ActionTypes.assign, payload: ctx };
}
