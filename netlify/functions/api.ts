import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { storage } from '../../server/storage';
import { createRoomSchema, joinRoomSchema, updateAvailabilitySchema, updateRoomSchema } from '../../shared/schema';
import { nanoid } from 'nanoid';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware for Netlify
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Create a new room
app.post("/api/rooms", async (req, res) => {
  try {
    console.log("Creating room with data:", req.body);
    const { hostName, hostTimezone, deadline: deadlineStr, ...roomData } = createRoomSchema.parse(req.body);
    
    // Generate unique host ID
    const hostId = nanoid();
    
    // Create room
    const room = await storage.createRoom({
      ...roomData,
      hostId,
      ...(deadlineStr ? { deadline: new Date(deadlineStr) } : {}),
    });

    // Calculate slots for the room
    const startDate = new Date(roomData.startDate);
    const endDate = new Date(roomData.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const slotMinutes = roomData.slotMinutes ?? 60;
    const totalSlots = daysDiff * 24 * Math.round(60 / slotMinutes);

    // Add host as first participant with empty availability
    await storage.addParticipant({
      roomId: room.id,
      name: hostName,
      timezone: hostTimezone,
      availability: '0'.repeat(totalSlots), // Empty availability initially
    });

    console.log("Room created successfully:", room.id);
    res.json({ roomId: room.id, hostId });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(400).json({ message: "Invalid room data", error: error instanceof Error ? error.message : String(error) });
  }
});

// Get room details with participants and heatmap
app.get("/api/rooms/:id", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const room = await storage.getRoomWithParticipants(roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: "Error fetching room", error: error instanceof Error ? error.message : String(error) });
  }
});

// Join room as participant
app.post("/api/rooms/:id/join", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { name, timezone } = joinRoomSchema.parse(req.body);

    // Check if room exists
    const room = await storage.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if name already exists in this room
    const existingParticipants = await storage.getParticipantsByRoom(roomId);
    const nameExists = existingParticipants.some((p: { name: string }) =>
      p.name.toLowerCase() === name.toLowerCase()
    );
    if (nameExists) {
      return res.status(400).json({
        message: "Name already taken",
        error: "A participant with this name already exists in the room. Please choose a different name.",
      });
    }

    // Calculate slots for the room
    const startDate = new Date(room.startDate);
    const endDate = new Date(room.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const slotMinutes = room.slotMinutes ?? 60;
    const totalSlots = daysDiff * 24 * Math.round(60 / slotMinutes);

    // Add participant with empty availability
    const participant = await storage.addParticipant({
      roomId,
      name,
      timezone,
      availability: '0'.repeat(totalSlots),
    });

    // Return updated room data
    const updatedRoom = await storage.getRoomWithParticipants(roomId);
    res.json({ participant, room: updatedRoom });
  } catch (error) {
    res.status(400).json({ message: "Invalid participant data", error: error instanceof Error ? error.message : String(error) });
  }
});

// Update participant availability
app.put("/api/rooms/:roomId/participants/:participantId", async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const participantId = parseInt(req.params.participantId);
    const { availability } = updateAvailabilitySchema.parse(req.body);

    // Validate availability string length matches room's totalSlots
    const room = await storage.getRoom(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const startDate = new Date(room.startDate);
    const endDate = new Date(room.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const slotMinutes = room.slotMinutes ?? 60;
    const totalSlots = daysDiff * 24 * Math.round(60 / slotMinutes);
    if (availability.length !== totalSlots) {
      return res.status(400).json({
        message: `Availability length ${availability.length} does not match expected ${totalSlots} slots`,
      });
    }

    const participant = await storage.updateParticipantAvailability(
      roomId,
      participantId,
      availability
    );

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    res.json({ success: true, participant });
  } catch (error) {
    res.status(400).json({ message: "Invalid availability data", error: error instanceof Error ? error.message : String(error) });
  }
});

// Confirm meeting time
app.post("/api/rooms/:id/confirm", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { slotIndex, hostId } = req.body;

    const room = await storage.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.hostId !== hostId) {
      return res.status(403).json({ message: "Only the host can confirm meeting times" });
    }

    const updatedRoom = await storage.confirmMeetingTime(roomId, slotIndex);
    res.json({ success: true, room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: "Error confirming meeting time", error: error instanceof Error ? error.message : String(error) });
  }
});

// Unconfirm time slot (host only)
app.post("/api/rooms/:id/unconfirm", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { hostId } = req.body;
    const room = await storage.getRoom(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.hostId !== hostId) return res.status(403).json({ message: "Only the host can unconfirm" });
    const updatedRoom = await storage.unconfirmRoom(roomId);
    res.json(updatedRoom);
  } catch (error) {
    res.status(400).json({ message: "Error unconfirming", error: error instanceof Error ? error.message : String(error) });
  }
});

// Update room name/description (host only)
app.patch("/api/rooms/:id", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const parsed = updateRoomSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const { hostId, ...data } = parsed.data;
    const room = await storage.getRoom(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.hostId !== hostId) return res.status(403).json({ message: "Unauthorized" });
    const updated = await storage.updateRoom(roomId, data);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating room", error: error instanceof Error ? error.message : String(error) });
  }
});

// Delete participant (host only)
app.delete("/api/rooms/:roomId/participants/:participantId", async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const participantId = parseInt(req.params.participantId);
    const hostId = req.query.hostId as string;
    const room = await storage.getRoom(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.hostId !== hostId) return res.status(403).json({ message: "Unauthorized" });
    await storage.deleteParticipant(roomId, participantId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error deleting participant", error: error instanceof Error ? error.message : String(error) });
  }
});

// Get global stats
app.get("/api/stats", async (_req, res) => {
  try {
    const stats = await storage.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// Export for Netlify Functions
export const handler = serverless(app) as any;
