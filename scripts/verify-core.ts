import assert from "node:assert/strict";

import { createRoomSchema } from "../shared/schema";
import {
  calculateInclusiveDays,
  calculateTotalSlots,
  getSlotsPerDay,
  getSlotsPerHour,
  isValidAvailabilityString,
  normalizeSlotMinutes,
} from "../shared/scheduling";
import { createHostToken, verifyHostToken } from "../server/host-auth";
import { getTimezoneOffset } from "../client/src/lib/timezone-utils";

function testSchedulingCore(): void {
  assert.equal(normalizeSlotMinutes(undefined), 60);
  assert.equal(normalizeSlotMinutes(999), 60);
  assert.equal(normalizeSlotMinutes(30), 30);

  assert.equal(getSlotsPerHour(60), 1);
  assert.equal(getSlotsPerHour(30), 2);
  assert.equal(getSlotsPerDay(60), 24);
  assert.equal(getSlotsPerDay(30), 48);

  assert.equal(calculateInclusiveDays("2026-03-18", "2026-03-18"), 1);
  assert.equal(calculateInclusiveDays("2026-03-18", "2026-03-24"), 7);

  assert.equal(calculateTotalSlots("2026-03-18", "2026-03-24", 60), 168);
  assert.equal(calculateTotalSlots("2026-03-18", "2026-03-24", 30), 336);

  assert.equal(isValidAvailabilityString("012012"), true);
  assert.equal(isValidAvailabilityString(""), false);
  assert.equal(isValidAvailabilityString("01239"), false);

  assert.throws(() => calculateInclusiveDays("invalid", "2026-03-24"));
  assert.throws(() => calculateInclusiveDays("2026-03-25", "2026-03-24"));
}

function testSchemaDateValidation(): void {
  const valid = createRoomSchema.safeParse({
    name: "Daily Standup",
    hostName: "Host",
    hostTimezone: "Asia/Seoul",
    startDate: "2026-03-18",
    endDate: "2026-03-19",
    timeStart: 9,
    timeEnd: 18,
    slotMinutes: 30,
  });
  assert.equal(valid.success, true);

  const invalidCalendarDate = createRoomSchema.safeParse({
    name: "Bad Date",
    hostName: "Host",
    hostTimezone: "Asia/Seoul",
    startDate: "2026-02-31",
    endDate: "2026-03-01",
    timeStart: 9,
    timeEnd: 18,
    slotMinutes: 60,
  });
  assert.equal(invalidCalendarDate.success, false);
}

function testHostTokenAuth(): void {
  const roomId = 123;
  const hostId = "host_abc";
  const token = createHostToken(roomId, hostId);

  assert.equal(verifyHostToken(token, roomId, hostId), true);
  assert.equal(verifyHostToken(token, roomId + 1, hostId), false);
  assert.equal(verifyHostToken(token, roomId, "other_host"), false);

  const brokenToken = `${token}broken`;
  assert.equal(verifyHostToken(brokenToken, roomId, hostId), false);
}

function testDstBehavior(): void {
  const nyWinter = getTimezoneOffset("America/New_York", new Date("2026-01-15T12:00:00Z"));
  const nySummer = getTimezoneOffset("America/New_York", new Date("2026-07-15T12:00:00Z"));

  // The exact offset can vary by environment rules, but DST regions must differ seasonally.
  assert.notEqual(nyWinter, nySummer);
}

function main(): void {
  testSchedulingCore();
  testSchemaDateValidation();
  testHostTokenAuth();
  testDstBehavior();
  console.log("verify-core: all checks passed");
}

main();
