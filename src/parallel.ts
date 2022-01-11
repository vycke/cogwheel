import { ParallelMachine, PMachine } from './types';

export function parallel<T extends PMachine>(config: T): ParallelMachine<T> {
  function send(event: string, values?: unknown, delay?: number): void {
    Object.values(config).forEach((machine) => {
      machine.send(event, values, delay);
    });
    return;
  }

  return new Proxy({ ...config, send }, { set: () => true });
}
