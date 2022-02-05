import { Event, ParallelMachine, PMachine } from './types';

export function parallel<T extends PMachine>(config: T): ParallelMachine<T> {
  function send(event: Event): void {
    Object.values(config).forEach((machine) => {
      machine.send(event);
    });
    return;
  }

  return new Proxy({ ...config, send }, { set: () => true });
}
