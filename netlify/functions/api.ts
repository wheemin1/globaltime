import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { storage } from '../../server/storage';
import { createRoomSchema, joinRoomSchema, updateAvailabilitySchema, updateRoomSchema } from '../../shared/schema';
import { calculateTotalSlots } from '../../shared/scheduling';
import { nanoid } from 'nanoid';
import { createHostToken, verifyHostToken } from '../../server/host-auth';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function parseIdParam(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function hasHostAccess(roomId: number, persistedHostId: string, hostId?: string, hostToken?: string): boolean {
  if (typeof hostToken === "string" && hostToken.length > 0) {
    return verifyHostToken(hostToken, roomId, persistedHostId);
  }
  return typeof hostId === "string" && hostId.length > 0 && hostId === persistedHostId;
}

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
    
    const totalSlots = calculateTotalSlots(roomData.startDate, roomData.endDate, roomData.slotMinutes ?? 60);

    const room = await storage.createRoomWithHost({
      room: {
        ...roomData,
        hostId,
        ...(deadlineStr ? { deadline: new Date(deadlineStr) } : {}),
      },
      hostName,
      hostTimezone,
      totalSlots,
    });

    const hostToken = createHostToken(room.id, hostId);
    console.log("Room created successfully:", room.id);
    res.json({ roomId: room.id, hostId, hostToken });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(400).json({ message: "Invalid room data", error: error instanceof Error ? error.message : String(error) });
  }
});

// Get room details with participants and heatmap
app.get("/api/rooms/:id", async (req, res) => {
  try {
    const roomId = parseIdParam(req.params.id);
    if (roomId === null) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
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
    const roomId = parseIdParam(req.params.id);
    if (roomId === null) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
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
    const slotMinutes = room.slotMinutes ?? 60;
    const totalSlots = calculateTotalSlots(room.startDate, room.endDate, slotMinutes);

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
    const roomId = parseIdParam(req.params.roomId);
    if (roomId === null) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    const participantId = parseIdParam(req.params.participantId);
    if (participantId === null) {
      return res.status(400).json({ message: "Invalid participant ID" });
    }
    const { availability } = updateAvailabilitySchema.parse(req.body);

    // Validate availability string length matches room's totalSlots
    const room = await storage.getRoom(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const slotMinutes = room.slotMinutes ?? 60;
    const totalSlots = calculateTotalSlots(room.startDate, room.endDate, slotMinutes);
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

    const updatedRoom = await storage.getRoomWithParticipants(roomId);
    res.json({ participant, room: updatedRoom });
  } catch (error) {
    res.status(400).json({ message: "Invalid availability data", error: error instanceof Error ? error.message : String(error) });
  }
});

// Confirm meeting time
app.post("/api/rooms/:id/confirm", async (req, res) => {
  try {
    const roomId = parseIdParam(req.params.id);
    if (roomId === null) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    const { slotIndex, hostId } = req.body;
    const hostToken = req.body?.hostToken;
    if (
      (typeof hostToken !== "string" || hostToken.trim().length === 0) &&
      (typeof hostId !== "string" || hostId.trim().length === 0)
    ) {
      return res.status(400).json({ message: "Invalid host ID" });
    }
    const parsedSlotIndex =
      typeof slotIndex === "number"
        ? slotIndex
        : Number.parseInt(String(slotIndex), 10);
    if (!Number.isInteger(parsedSlotIndex)) {
      return res.status(400).json({ message: "Invalid slot index" });
    }

    const room = await storage.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const totalSlots = calculateTotalSlots(room.startDate, room.endDate, room.slotMinutes ?? 60);
    if (parsedSlotIndex < 0 || parsedSlotIndex >= totalSlots) {
      return res.status(400).json({ message: "Slot index out of range" });
    }

    if (!hasHostAccess(roomId, room.hostId, hostId, hostToken)) {
      return res.status(403).json({ message: "Only the host can confirm meeting times" });
    }

    const updatedRoom = await storage.confirmMeetingTime(roomId, parsedSlotIndex);
    res.json({ success: true, room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: "Error confirming meeting time", error: error instanceof Error ? error.message : String(error) });
  }
});

// Unconfirm time slot (host only)
app.post("/api/rooms/:id/unconfirm", async (req, res) => {
  try {
    const roomId = parseIdParam(req.params.id);
    if (roomId === null) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    const { hostId } = req.body;
    const hostToken = req.body?.hostToken;
    if (
      (typeof hostToken !== "string" || hostToken.trim().length === 0) &&
      (typeof hostId !== "string" || hostId.trim().length === 0)
    ) {
      return res.status(400).json({ message: "Invalid host ID" });
    }
    const room = await storage.getRoom(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!hasHostAccess(roomId, room.hostId, hostId, hostToken)) {
      return res.status(403).json({ message: "Only the host can unconfirm" });
    }
    const updatedRoom = await storage.unconfirmRoom(roomId);
    res.json(updatedRoom);
  } catch (error) {
    res.status(400).json({ message: "Error unconfirming", error: error instanceof Error ? error.message : String(error) });
  }
});

// Refresh host token (host only)
app.post("/api/rooms/:id/host-token/refresh", async (req, res) => {
  try {
    const roomId = parseIdParam(req.params.id);
    if (roomId === null) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const { hostId, hostToken } = req.body ?? {};
    if (
      (typeof hostToken !== "string" || hostToken.trim().length === 0) &&
      (typeof hostId !== "string" || hostId.trim().length === 0)
    ) {
      return res.status(400).json({ message: "Invalid host credentials" });
    }

    const room = await storage.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!hasHostAccess(roomId, room.hostId, hostId, hostToken)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const refreshedHostToken = createHostToken(roomId, room.hostId);
    return res.json({ hostToken: refreshedHostToken });
  } catch (error) {
    return res.status(500).json({ message: "Error refreshing host token", error: error instanceof Error ? error.message : String(error) });
  }
});

// Update room name/description (host only)
app.patch("/api/rooms/:id", async (req, res) => {
  try {
    const roomId = parseIdParam(req.params.id);
    if (roomId === null) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    const parsed = updateRoomSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const { hostId, hostToken, ...data } = parsed.data;
    if (
      (typeof hostToken !== "string" || hostToken.trim().length === 0) &&
      (typeof hostId !== "string" || hostId.trim().length === 0)
    ) {
      return res.status(400).json({ message: "Invalid host ID" });
    }
    const room = await storage.getRoom(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!hasHostAccess(roomId, room.hostId, hostId, hostToken)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const updated = await storage.updateRoom(roomId, data);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating room", error: error instanceof Error ? error.message : String(error) });
  }
});

// Delete participant (host only)
app.delete("/api/rooms/:roomId/participants/:participantId", async (req, res) => {
  try {
    const roomId = parseIdParam(req.params.roomId);
    if (roomId === null) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    const participantId = parseIdParam(req.params.participantId);
    if (participantId === null) {
      return res.status(400).json({ message: "Invalid participant ID" });
    }
    const hostId = req.query.hostId as string | undefined;
    const hostToken = req.query.hostToken as string | undefined;
    if (
      (typeof hostToken !== "string" || hostToken.trim().length === 0) &&
      (typeof hostId !== "string" || hostId.trim().length === 0)
    ) {
      return res.status(400).json({ message: "Invalid host ID" });
    }
    const room = await storage.getRoom(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!hasHostAccess(roomId, room.hostId, hostId, hostToken)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
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
