/* eslint-disable @typescript-eslint/ban-types */
import { test, expect, beforeEach, vi } from "vitest";
import { machine } from "../src";
import {
  Action,
  MachineErrors,
  MachineState,
  Event,
  O,
  State,
} from "../src/types";
import { delay } from "./helpers";

// Types
type Context = { count: number };

// Default configuration
let cb;

const configDefault = {
  green: { CHANGE: "yellow" },
  yellow: { CHANGE: "red" },
  red: {},
};

const countAssign: Action<Context, CountEvent> = function ({
  state,
  event,
  assign,
}) {
  if (event?.count) return assign({ count: state.context.count + event.count });
  return assign({ count: state.context.count + 1 });
};

type CountEvent = { type: string; count?: number };

const logAction: Action<{}, Event> = function (state) {
  cb(state);
};

// Actual tests
beforeEach(() => {
  cb = vi.fn();
});

test("Send - existing event", () => {
  const service = machine({ init: "green", states: configDefault });
  expect(service.current).toBe("green");
  service.send({ type: "CHANGE" });
  expect(service.current).toBe("yellow");
});

test("Send - non-existing event", () => {
  const service = machine({ init: "green", states: configDefault });
  expect(service.current).toBe("green");
  service.send({ type: "NON_EXISTING_EVENT" });
  expect(service.current).toBe("green");
});

test("Send - state without transition definition", () => {
  const config = { red: {} };
  const service = machine({ init: "red", states: config });
  service.send({ type: "CHANGE" });
  expect(service.current).toBe("red");
});

test("Send - transition object", () => {
  const config = {
    green: { CHANGE: { target: "yellow" } },
    yellow: {},
  };

  const service = machine({ init: "green", states: config });
  service.send({ type: "CHANGE" });
  expect(service.current).toBe("yellow");
});

test("immutability", () => {
  const service = machine({ init: "green", states: configDefault });
  expect(service.current).toBe("green");
  service.current = "yellow";
  expect(service.current).toBe("green");
});

test("Incorrect initial state", () => {
  expect(() =>
    machine({ init: "WrongInitialState", states: configDefault }),
  ).toThrow(MachineErrors.init);
});

test("Non-existing target in configuration", () => {
  const config = {
    green: { CHANGE: "blue" },
    yellow: { CHANGE: "red" },
    red: {},
  };

  expect(() => machine({ init: "green", states: config })).toThrow(
    MachineErrors.target,
  );
});

test("General purpose action", () => {
  const configStart = {
    start: {
      CHANGE: "end",
      _entry: [logAction],
    },
    end: {},
  };

  machine<{}>({ init: "start", states: configStart });
  expect(cb.mock.calls.length).toBe(1);
});

test("General purpose action (double)", () => {
  const configStart = {
    start: {
      CHANGE: "end",
      _entry: [logAction, logAction],
    },
    end: {},
  };

  machine<{}>({ init: "start", states: configStart });
  expect(cb.mock.calls.length).toBe(2);
});

test("Entry actions - auto-transition", async () => {
  const configAutomatic: Record<string, State<{}, Event>> = {
    green: { CHANGE: "yellow" },
    yellow: {
      CHANGE: "red",
      _entry: [({ send }) => send({ type: "CHANGE" })],
    },
    red: {
      CHANGE: "green",
      _entry: [({ send }) => send({ type: "CHANGE" }, 100)],
    },
  };

  const service = machine<{}>({ init: "green", states: configAutomatic });
  expect(service.current).toBe("green");
  service.send({ type: "CHANGE" });
  expect(service.current).toBe("red");
  await delay(100);
  expect(service.current).toBe("green");
});

test("Entry actions - auto-transition on initial state", () => {
  const configStart: Record<string, State<{}, Event>> = {
    start: {
      _entry: [({ send }) => send({ type: "CHANGE" })],
      CHANGE: "end",
    },
    end: {},
  };

  const service = machine<{}>({ init: "start", states: configStart });
  expect(service.current).toBe("end");
});

test("Entry actions - update context", () => {
  type Context = { count: number };

  const configStart = {
    start: { CHANGE: "end" },
    end: {
      _entry: [countAssign],
    },
  };

  const service = machine<Context>({
    init: "start",
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: "CHANGE" });
  expect(service.current).toBe("end");
  expect(service.context.count).toBe(1);
});

test("Entry actions - update context based on transition input", () => {
  type Context = { count: number };

  const configStart: Record<string, State<Context, Event>> = {
    start: { CHANGE: "end" },
    end: {
      _entry: [countAssign],
    },
  };

  const service = machine<Context, CountEvent>({
    init: "start",
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: "CHANGE", count: 2 });
  expect(service.current).toBe("end");
  expect(service.context.count).toBe(2);
});

test("Entry actions - multiple actions", () => {
  type Context = { count: number };

  const configStart: Record<string, State<Context, Event>> = {
    start: { CHANGE: "middle" },
    middle: {
      CHANGE: "end",
      _entry: [countAssign, ({ send }) => send({ type: "CHANGE" })],
    },
    end: {},
  };

  const service = machine<Context>({
    init: "start",
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: "CHANGE" });
  expect(service.context.count).toBe(1);
  expect(service.current).toBe("end");
});

test("Exit actions - update context", () => {
  type Context = { count: number };

  const configStart = {
    start: {
      CHANGE: "end",
      _exit: [countAssign],
    },
    end: {},
  };

  const service = machine<Context>({
    init: "start",
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: "CHANGE" });
  expect(service.current).toBe("end");
  expect(service.context.count).toBe(1);
});

test("Transition actions - update context", () => {
  type Context = { count: number };

  const configStart = {
    start: {
      CHANGE: {
        target: "end",
        actions: [countAssign],
      },
    },
    end: {},
  };

  const service = machine<Context>({
    init: "start",
    states: configStart,
    context: { count: 0 },
  });
  expect(service.context.count).toBe(0);
  service.send({ type: "CHANGE" });
  expect(service.current).toBe("end");
  expect(service.context.count).toBe(1);
});

test("Guard - allowed", () => {
  type Context = { allowed: boolean };

  const config = {
    green: {
      CHANGE: {
        target: "yellow",
        guard: (s: MachineState<Context>) => s.context.allowed,
      },
    },
    yellow: {},
  };

  const service = machine<Context>({
    init: "green",
    states: config,
    context: { allowed: true },
  });
  expect(service.current).toBe("green");
  service.send({ type: "CHANGE" });
  expect(service.current).toBe("yellow");
});

test("Guard - not allowed", () => {
  type Context = { allowed: boolean };

  const config = {
    green: {
      CHANGE: {
        target: "yellow",
        guard: (s: MachineState<Context>) => s.context.allowed,
      },
    },
    yellow: {},
  };

  const service = machine<Context>({
    init: "green",
    states: config,
    context: { allowed: false },
  });
  expect(service.current).toBe("green");
  service.send({ type: "CHANGE" });
  expect(service.current).toBe("green");
});

test("listener - default behaviour", () => {
  const service = machine({ init: "green", states: configDefault });
  const remove = service.listen(cb);
  service.send({ type: "CHANGE" });
  expect(cb.mock.calls.length).toBe(1);
  remove();
  service.send({ type: "CHANGE" });
  expect(cb.mock.calls.length).toBe(1);
});

// In version <=3.0 there is a bug that arrays in the context are converted
// into objects, when accessing the context through actions, guards and
// listeners. Accessing the context directly does not provide this issue
// This tests validates that this does not happen anymore
test("listener - nested context maintains state", () => {
  type Context = { data: O };
  type FetchEvent = Event & { data?: unknown };

  const successEntry: Action<Context, FetchEvent> = ({ assign, event }) =>
    assign({ data: event.data } as Context);
  const service = machine({
    init: "pending",
    states: {
      pending: { FINISHED: "success" },
      success: { _entry: [successEntry] },
    },
  });
  const remove = service.listen(cb);
  expect(service.current).toBe("pending");
  service.send({ type: "FINISHED", data: { arr: ["test"] } });
  expect(service.current).toBe("success");
  expect(service.context).toEqual({ data: { arr: ["test"] } });

  remove();
});
