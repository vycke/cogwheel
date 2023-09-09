/* eslint-disable @typescript-eslint/ban-types */
import { test, expect } from "vitest";
import { machine } from "../../src";
import { Event, State } from "../../src/types";
import { delay } from "../helpers";

const config: Record<string, State<{}, Event>> = {
  init: { CHANGED: "debouncing" },
  debouncing: {
    GO: "executing",
    CHANGED: "debouncing",
    _entry: [({ send }) => send({ type: "GO" }, 10)],
  },
  executing: { FINISHED: "init" },
};

test("Debounce", async (): Promise<void> => {
  const service = machine({ init: "init", states: config });
  expect(service.current).toBe("init");
  service.send({ type: "CHANGED" });
  expect(service.current).toBe("debouncing");
  service.send({ type: "CHANGED" });
  expect(service.current).toBe("debouncing");
  await delay(10);
  expect(service.current).toBe("executing");
});
