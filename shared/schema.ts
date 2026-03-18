import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

function isValidIsoDateString(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const dt = new Date(Date.UTC(year, month - 1, day));

  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() + 1 === month &&
    dt.getUTCDate() === day
  );
}

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hostId: text("host_id").notNull(),
  startDate: text("start_date").notNull(), // ISO date string
  endDate: text("end_date").notNull(), // ISO date string
  timeStart: integer("time_start").notNull(), // hour 0-23
  timeEnd: integer("time_end").notNull(), // hour 1-24 (24 means midnight)
  isConfirmed: boolean("is_confirmed").default(false),
  confirmedSlot: integer("confirmed_slot"), // slot index if confirmed
  description: text("description"),
  deadline: timestamp("deadline"),
  slotMinutes: integer("slot_minutes").default(60),
  createdAt: timestamp("created_at").defaultNow(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id),
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  availability: text("availability").notNull(), // Dynamic bit string based on room date range
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

// Additional schemas for API requests
export const createRoomSchema = z.object({
  name: z.string().min(1, "Meeting name is required"),
  hostName: z.string().min(1, "Host name is required"),
  hostTimezone: z.string().min(1, "Timezone is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").refine(isValidIsoDateString, "Invalid calendar date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").refine(isValidIsoDateString, "Invalid calendar date"),
  timeStart: z.number().int().min(0).max(23),
  timeEnd: z.number().int().min(1).max(24),
  description: z.string().max(500).optional(),
  deadline: z.string().optional(),
  slotMinutes: z.union([z.literal(30), z.literal(60)]).default(60),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
}).refine((data) => {
  // Special case: 24 represents midnight (next day)
  if (data.timeEnd === 24) {
    return true; // Always valid with 24 as end time
  }
  return data.timeStart < data.timeEnd;
}, {
  message: "End time must be after start time",
  path: ["timeEnd"]
});

export const joinRoomSchema = z.object({
  name: z.string().min(1),
  timezone: z.string(),
});

export const updateAvailabilitySchema = z.object({
  availability: z.string().min(1).regex(/^[012]*$/, "Invalid availability format"),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
  hostId: z.string().optional(),
  hostToken: z.string().optional(),
}).refine((data) => {
  return Boolean((data.hostToken && data.hostToken.trim().length > 0) || (data.hostId && data.hostId.trim().length > 0));
}, {
  message: "hostToken or hostId is required",
  path: ["hostToken"],
});

export type UpdateRoomRequest = z.infer<typeof updateRoomSchema>;

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type UpdateAvailabilityRequest = z.infer<typeof updateAvailabilitySchema>;

// Response types
export interface RoomWithParticipants extends Room {
  participants: Participant[];
  heatmap: number[];      // count of available participants per slot
  softHeatmap: number[];  // deprecated, always empty []
}

export interface HeatmapData {
  slotIndex: number;
  participantCount: number;
  availableParticipants: string[];
}
