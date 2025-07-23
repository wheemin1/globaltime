import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  timeStart: z.number().int().min(0).max(23),
  timeEnd: z.number().int().min(1).max(24),
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
  availability: z.string().min(1), // Dynamic length based on room date range
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type UpdateAvailabilityRequest = z.infer<typeof updateAvailabilitySchema>;

// Response types
export interface RoomWithParticipants extends Room {
  participants: Participant[];
  heatmap: number[]; // Dynamic array representing participant count per slot
}

export interface HeatmapData {
  slotIndex: number;
  participantCount: number;
  availableParticipants: string[];
}
