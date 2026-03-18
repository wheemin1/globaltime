import { db } from "./db";
import { rooms, participants } from "@shared/schema";
import { calculateTotalSlots, isValidAvailabilityString } from "@shared/scheduling";
import { eq, and, sql } from "drizzle-orm";
import type { Room, Participant } from "@shared/schema";

export const storage = {
  async createRoom(data: {
    name: string;
    hostId: string;
    startDate: string;
    endDate: string;
    timeStart: number;
    timeEnd: number;
    description?: string | null;
    deadline?: Date | null;
    slotMinutes?: number;
  }): Promise<Room> {
    const [room] = await db.insert(rooms).values(data).returning();
    return room;
  },

  async createRoomWithHost(data: {
    room: {
      name: string;
      hostId: string;
      startDate: string;
      endDate: string;
      timeStart: number;
      timeEnd: number;
      description?: string | null;
      deadline?: Date | null;
      slotMinutes?: number;
    };
    hostName: string;
    hostTimezone: string;
    totalSlots: number;
  }): Promise<Room> {
    return db.transaction(async (tx) => {
      const [room] = await tx.insert(rooms).values(data.room).returning();
      await tx.insert(participants).values({
        roomId: room.id,
        name: data.hostName,
        timezone: data.hostTimezone,
        availability: "0".repeat(data.totalSlots),
      });
      return room;
    });
  },

  async getRoom(id: number): Promise<Room | null> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room ?? null;
  },

  async getRoomWithParticipants(id: number): Promise<any> {
    const room = await this.getRoom(id);
    if (!room) return null;

    const roomParticipants = await this.getParticipantsByRoom(id);

    const totalSlots = calculateTotalSlots(room.startDate, room.endDate, room.slotMinutes ?? 60);

    // Generate heatmap for the actual number of slots
    // Treat both '1' (available) and '2' (legacy 'if needed') as available
    const heatmap = new Array(totalSlots).fill(0);
    roomParticipants.forEach(participant => {
      if (!isValidAvailabilityString(participant.availability)) {
        console.warn(`Skipping malformed availability for participant ${participant.id} in room ${id}`);
        return;
      }
      for (let i = 0; i < Math.min(totalSlots, participant.availability.length); i++) {
        if (participant.availability[i] === '1' || participant.availability[i] === '2') {
          heatmap[i]++;
        }
      }
    });

    return {
      ...room,
      participants: roomParticipants,
      heatmap,
      softHeatmap: [], // kept for schema compat; no longer used
    };
  },

  async addParticipant(data: {
    roomId: number;
    name: string;
    timezone: string;
    availability: string;
  }): Promise<Participant> {
    const [participant] = await db.insert(participants).values(data).returning();
    return participant;
  },

  async updateParticipantAvailability(
    roomId: number,
    participantId: number,
    availability: string
  ): Promise<Participant | null> {
    const [updated] = await db
      .update(participants)
      .set({ availability })
      .where(and(eq(participants.id, participantId), eq(participants.roomId, roomId)))
      .returning();
    return updated ?? null;
  },

  async updateRoomConfirmation(roomId: number, slotIndex: number): Promise<Room | null> {
    const [updated] = await db
      .update(rooms)
      .set({ isConfirmed: true, confirmedSlot: slotIndex })
      .where(eq(rooms.id, roomId))
      .returning();
    return updated ?? null;
  },

  async unconfirmRoom(roomId: number): Promise<Room | null> {
    const [updated] = await db
      .update(rooms)
      .set({ isConfirmed: false, confirmedSlot: null })
      .where(eq(rooms.id, roomId))
      .returning();
    return updated ?? null;
  },

  async confirmMeetingTime(roomId: number, slotIndex: number): Promise<any> {
    const room = await this.updateRoomConfirmation(roomId, slotIndex);
    if (!room) return null;
    return await this.getRoomWithParticipants(roomId);
  },

  async getParticipantsByRoom(roomId: number): Promise<Participant[]> {
    return db.select().from(participants).where(eq(participants.roomId, roomId));
  },

  async updateRoom(roomId: number, data: { name?: string; description?: string | null }): Promise<Room | null> {
    const [updated] = await db
      .update(rooms)
      .set(data)
      .where(eq(rooms.id, roomId))
      .returning();
    return updated ?? null;
  },

  async deleteParticipant(roomId: number, participantId: number): Promise<boolean> {
    await db
      .delete(participants)
      .where(and(eq(participants.id, participantId), eq(participants.roomId, roomId)));
    return true;
  },

  async getStats(): Promise<{ totalRooms: number; totalParticipants: number }> {
    const [roomResult] = await db.select({ count: sql<number>`count(*)` }).from(rooms);
    const [participantResult] = await db.select({ count: sql<number>`count(*)` }).from(participants);
    return {
      totalRooms: Number(roomResult.count),
      totalParticipants: Number(participantResult.count),
    };
  },
};
