import { Options, State, Transition } from './fsm';

type Node = {
  id: string;
  data: { label: string; [key: string]: string | number };
};

type Edge = {
  source: string;
  target: string;
  data: {
    label: string;
    guard?: string;
  };
};

function mockSend(state: Node) {
  return function (event: string, options?: Options): void {
    state.data.entry = event;
    if (options?.delay) state.data.delay = options.delay;
  };
}

export function getStates(config: Record<string, State>): Node[] {
  const states: Node[] = [];

  for (const key in config) {
    const state = { id: key, data: { label: key } };
    config[key].entry?.(mockSend(state));
    states.push(state);
  }

  return states;
}

function converter(_key: unknown, val: { constructor: RegExpConstructor }) {
  return String(val);
}

export function getTransitions(config: Record<string, State>): Edge[] {
  const edges: Edge[] = [];

  for (const key in config) {
    const transitions = config[key].on;

    for (const t in transitions) {
      const transition = transitions[t];
      const target =
        (transition as Transition).target || (transition as string);

      const edge: Edge = { source: key, target, data: { label: t } };

      if ((transition as Transition)?.guard) {
        const guard = (transition as Transition).guard;
        edge.data.guard = JSON.stringify(guard, converter).replaceAll('"', '');
      }

      edges.push(edge);
    }
  }

  return edges;
}
