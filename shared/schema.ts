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
  timeEnd: integer("time_end").notNull(), // hour 0-23
  isConfirmed: boolean("is_confirmed").default(false),
  confirmedSlot: integer("confirmed_slot"), // slot index if confirmed
  createdAt: timestamp("created_at").defaultNow(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id),
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  availability: text("availability").notNull(), // 168-bit string representation
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
  name: z.string().min(1),
  hostName: z.string().min(1),
  hostTimezone: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  timeStart: z.number().min(0).max(23),
  timeEnd: z.number().min(0).max(23),
});

export const joinRoomSchema = z.object({
  name: z.string().min(1),
  timezone: z.string(),
  availability: z.string().length(168), // 168 bits as string
});

export const updateAvailabilitySchema = z.object({
  availability: z.string().length(168),
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type UpdateAvailabilityRequest = z.infer<typeof updateAvailabilitySchema>;

// Response types
export interface RoomWithParticipants extends Room {
  participants: Participant[];
  heatmap: number[]; // 168 numbers representing participant count per slot
}

export interface HeatmapData {
  slotIndex: number;
  participantCount: number;
  availableParticipants: string[];
}
