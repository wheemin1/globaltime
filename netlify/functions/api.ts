import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { storage } from '../../server/storage';
import { createRoomSchema, joinRoomSchema, updateAvailabilitySchema } from '../../shared/schema';
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
    const { hostName, hostTimezone, ...roomData } = createRoomSchema.parse(req.body);
    
    // Generate unique host ID
    const hostId = nanoid();
    
    // Create room
    const room = await storage.createRoom({
      ...roomData,
      hostId,
    });

    // Calculate slots for the room
    const startDate = new Date(roomData.startDate);
    const endDate = new Date(roomData.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalSlots = daysDiff * 24;

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

    // Calculate slots for the room
    const startDate = new Date(room.startDate);
    const endDate = new Date(room.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalSlots = daysDiff * 24;

    // Add participant with empty availability
    const participant = await storage.addParticipant({
      roomId,
      name,
      timezone,
      availability: '0'.repeat(totalSlots), // Empty availability initially
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

// Export for Netlify Functions
export const handler = serverless(app) as any;
