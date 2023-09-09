/* eslint-disable @typescript-eslint/ban-types */
import { test, expect } from "vitest";
import { machine } from "../../src";
import { MachineState, State, Event, Action } from "../../src/types";

type O = Record<string, unknown>;
type N = Record<string, never>;
type Context = MachineState<N>;
type NestedAction<T extends O> = (
  config: Record<string, State<T, Event>>,
  init: string,
) => Action<Context, Event>;
type NestedTransition = (
  exit: string,
  transition: string,
) => Action<Context, Event>;

const innerConfig: Record<string, State<N, Event>> = {
  walk: { START: "blink" },
  blink: { FINISH: "stop" },
  stop: {},
};

const nestedTransitionAction: NestedAction<N> = (config, init) => {
  return function ({ state, event, assign }) {
    const _machine = machine({
      states: config,
      init: state.context.current || init,
    });
    _machine.send(event);
    assign({ ...state.context, current: _machine.current });
  };
};

const nestedExitTransition: NestedTransition = function (exit, transition) {
  return function ({ state, send }) {
    if (state.context.current === exit) send({ type: transition });
  };
};

const outerConfig: Record<string, State<Context, Event>> = {
  green: {
    GO: { target: "red", guard: ({ context }) => context.current === "stop" },
    START: "green",
    FINISH: "green",
    _entry: [
      nestedTransitionAction(innerConfig, "walk"),
      nestedExitTransition("stop", "GO"),
    ],
  },
  red: { GO: "green" },
};

test("Hierarchical state machines", () => {
  const service = machine({ init: "red", states: outerConfig });
  service.send({ type: "GO" });
  expect(service.current).toBe("green");
  service.send({ type: "START" });
  service.send({ type: "GO" });
  expect(service.context.current).toBe("blink");
  service.send({ type: "FINISH" });
  expect(service.current).toBe("red");
});
