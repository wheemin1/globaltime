
interface Room {
  id: number;
  name: string;
  hostId: string;
  startDate: string;
  endDate: string;
  timeStart: number;
  timeEnd: number;
  isConfirmed: boolean;
  confirmedSlot?: number;
  createdAt: Date;
}

interface Participant {
  id: number;
  roomId: number;
  name: string;
  timezone: string;
  availability: string;
  joinedAt: Date;
}

// In-memory storage for development
let rooms: Room[] = [];
let participants: Participant[] = [];
let nextRoomId = 1;
let nextParticipantId = 1;

export const storage = {
  async createRoom(data: {
    name: string;
    hostId: string;
    startDate: string;
    endDate: string;
    timeStart: number;
    timeEnd: number;
  }): Promise<Room> {
    const room: Room = {
      id: nextRoomId++,
      ...data,
      isConfirmed: false,
      createdAt: new Date(),
    };
    rooms.push(room);
    return room;
  },

  async getRoom(id: number): Promise<Room | null> {
    return rooms.find(room => room.id === id) || null;
  },

  async getRoomWithParticipants(id: number): Promise<any> {
    const room = await this.getRoom(id);
    if (!room) return null;

    const roomParticipants = participants.filter(p => p.roomId === id);
    
    // Calculate total slots based on room date range
    const startDate = new Date(room.startDate);
    const endDate = new Date(room.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalSlots = daysDiff * 24;
    
    // Generate heatmap for the actual number of slots
    const heatmap = new Array(totalSlots).fill(0);
    roomParticipants.forEach(participant => {
      for (let i = 0; i < Math.min(totalSlots, participant.availability.length); i++) {
        if (participant.availability[i] === '1') {
          heatmap[i]++;
        }
      }
    });

    return {
      ...room,
      participants: roomParticipants,
      heatmap,
    };
  },

  async addParticipant(data: {
    roomId: number;
    name: string;
    timezone: string;
    availability: string;
  }): Promise<Participant> {
    const participant: Participant = {
      id: nextParticipantId++,
      ...data,
      joinedAt: new Date(),
    };
    participants.push(participant);
    return participant;
  },

  async updateParticipantAvailability(
    roomId: number,
    participantId: number,
    availability: string
  ): Promise<Participant | null> {
    const participant = participants.find(
      p => p.id === participantId && p.roomId === roomId
    );
    if (!participant) return null;

    participant.availability = availability;
    return participant;
  },

  async updateRoomConfirmation(roomId: number, slotIndex: number): Promise<Room | null> {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return null;

    room.isConfirmed = true;
    room.confirmedSlot = slotIndex;
    return room;
  },

  async confirmMeetingTime(roomId: number, slotIndex: number): Promise<any> {
    const room = await this.updateRoomConfirmation(roomId, slotIndex);
    if (!room) return null;
    return await this.getRoomWithParticipants(roomId);
  },

  async getParticipantsByRoom(roomId: number): Promise<Participant[]> {
    return participants.filter(p => p.roomId === roomId);
  },
};
