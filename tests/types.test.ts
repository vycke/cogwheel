import { test, expect } from "vitest";
import { machine, type Action } from "../src";

// Compile-time checks: `pnpm typecheck` fails if an @ts-expect-error stops erroring.
type Ctx = { count: number };
type Ev = { type: "INC"; by?: number } | { type: "RESET" };

// A discriminated event union narrows without casts
const inc: Action<Ctx, Ev> = ({ state, event, assign }) => {
  if (event.type === "INC")
    assign({ count: state.context.count + (event.by ?? 1) });
};

test("types - states, context and events are inferred from the config", () => {
  const service = machine({
    init: "idle",
    context: { count: 0 },
    states: {
      idle: { INC: { target: "counting", actions: [inc] } },
      counting: { INC: { target: "counting", actions: [inc] }, RESET: "idle" },
    },
  });

  const current: "idle" | "counting" = service.current;
  const count: number = service.context.count;
  expect([current, count]).toEqual(["idle", 0]);

  service.send({ type: "INC", by: 2 });
  expect(service.current).toBe("counting");
  expect(service.context.count).toBe(2);

  // @ts-expect-error not a state of this machine
  const other: "other" = service.current;
  // @ts-expect-error not an event of this machine
  service.send({ type: "DEC" });
  // @ts-expect-error machine is read-only
  service.current = "idle";
  expect(other).toBe("counting");
});

test("types - config mistakes are compile errors", () => {
  // @ts-expect-error init must be a state
  expect(() => machine({ init: "nope", states: { a: {} } })).toThrow();
  // @ts-expect-error target must be a state
  expect(() => machine({ init: "a", states: { a: { GO: "b" } } })).toThrow();
  // @ts-expect-error event key must be one of the typed events
  machine({ init: "a", states: { a: { GOO: "a", _entry: [inc] } } });
});

test("types - pre-declared config keeps working with `as const`", () => {
  const states = { on: { TOGGLE: "off" }, off: { TOGGLE: "on" } } as const;
  const service = machine({ init: "on", states });
  const current: "on" | "off" = service.current;
  expect(current).toBe("on");
});
