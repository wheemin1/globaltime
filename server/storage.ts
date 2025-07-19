import { rooms, participants, type Room, type InsertRoom, type Participant, type InsertParticipant, type RoomWithParticipants } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomWithParticipants(id: number): Promise<RoomWithParticipants | undefined>;
  updateRoomConfirmation(id: number, confirmedSlot: number): Promise<Room | undefined>;
  
  // Participant operations
  addParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipantAvailability(roomId: number, participantId: number, availability: string): Promise<Participant | undefined>;
  getParticipantsByRoom(roomId: number): Promise<Participant[]>;
  
  // Utility
  generateHeatmap(roomId: number): Promise<number[]>;
}

export class MemStorage implements IStorage {
  private rooms: Map<number, Room>;
  private participants: Map<number, Participant>;
  private currentRoomId: number;
  private currentParticipantId: number;

  constructor() {
    this.rooms = new Map();
    this.participants = new Map();
    this.currentRoomId = 1;
    this.currentParticipantId = 1;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    const room: Room = {
      ...insertRoom,
      id,
      isConfirmed: false,
      confirmedSlot: null,
      createdAt: new Date(),
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomWithParticipants(id: number): Promise<RoomWithParticipants | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const participants = await this.getParticipantsByRoom(id);
    const heatmap = await this.generateHeatmap(id);

    return {
      ...room,
      participants,
      heatmap,
    };
  }

  async updateRoomConfirmation(id: number, confirmedSlot: number): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const updatedRoom: Room = {
      ...room,
      isConfirmed: true,
      confirmedSlot,
    };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = this.currentParticipantId++;
    const participant: Participant = {
      id,
      roomId: insertParticipant.roomId ?? null,
      name: insertParticipant.name,
      timezone: insertParticipant.timezone,
      availability: insertParticipant.availability,
      createdAt: new Date(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  async updateParticipantAvailability(roomId: number, participantId: number, availability: string): Promise<Participant | undefined> {
    const participant = this.participants.get(participantId);
    if (!participant || participant.roomId !== roomId) return undefined;

    const updatedParticipant: Participant = {
      ...participant,
      availability,
    };
    this.participants.set(participantId, updatedParticipant);
    return updatedParticipant;
  }

  async getParticipantsByRoom(roomId: number): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      (participant) => participant.roomId === roomId
    );
  }

  async generateHeatmap(roomId: number): Promise<number[]> {
    const participants = await this.getParticipantsByRoom(roomId);
    const heatmap = new Array(168).fill(0);

    participants.forEach((participant) => {
      for (let i = 0; i < 168; i++) {
        if (participant.availability[i] === '1') {
          heatmap[i]++;
        }
      }
    });

    return heatmap;
  }
}

export const storage = new MemStorage();
