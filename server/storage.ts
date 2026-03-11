import { db } from "./db";
import { rooms, participants } from "@shared/schema";
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

  async getRoom(id: number): Promise<Room | null> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room ?? null;
  },

  async getRoomWithParticipants(id: number): Promise<any> {
    const room = await this.getRoom(id);
    if (!room) return null;

    const roomParticipants = await this.getParticipantsByRoom(id);

    // Calculate total slots based on room date range
    const startDate = new Date(room.startDate);
    const endDate = new Date(room.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const slotMinutes = room.slotMinutes ?? 60;
    const slotsPerDay = 24 * Math.round(60 / slotMinutes);
    const totalSlots = daysDiff * slotsPerDay;

    // Generate heatmap for the actual number of slots
    const heatmap = new Array(totalSlots).fill(0);
    const softHeatmap = new Array(totalSlots).fill(0);
    roomParticipants.forEach(participant => {
      for (let i = 0; i < Math.min(totalSlots, participant.availability.length); i++) {
        if (participant.availability[i] === '1') {
          heatmap[i]++;
        } else if (participant.availability[i] === '2') {
          softHeatmap[i]++;
        }
      }
    });

    return {
      ...room,
      participants: roomParticipants,
      heatmap,
      softHeatmap,
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
