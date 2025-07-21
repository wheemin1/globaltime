
interface Room {
  id: number;
  name: string;
  hostId: string;
  startDate: string;
  endDate: string;
  timeStart: number;
  timeEnd: number;
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
    
    // Generate heatmap (168 slots for 7 days * 24 hours)
    const heatmap = new Array(168).fill(0);
    roomParticipants.forEach(participant => {
      for (let i = 0; i < 168; i++) {
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

    room.confirmedSlot = slotIndex;
    return room;
  },

  async getParticipantsByRoom(roomId: number): Promise<Participant[]> {
    return participants.filter(p => p.roomId === roomId);
  },
};
