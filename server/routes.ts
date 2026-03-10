import type { Express } from "express";
import { createServer, type Server } from "http";
import { EventEmitter } from "events";
import { storage } from "./storage";
import { createRoomSchema, joinRoomSchema, updateAvailabilitySchema, updateRoomSchema } from "@shared/schema";
import { nanoid } from "nanoid";

const roomEmitters = new Map<number, EventEmitter>();
function getRoomEmitter(roomId: number): EventEmitter {
  if (!roomEmitters.has(roomId)) {
    const ee = new EventEmitter();
    ee.setMaxListeners(200);
    roomEmitters.set(roomId, ee);
  }
  return roomEmitters.get(roomId)!;
}
function broadcastRoomEvent(roomId: number): void {
  roomEmitters.get(roomId)?.emit("update");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new room
  app.post("/api/rooms", async (req, res) => {
    try {
      console.log("Creating room with data:", JSON.stringify(req.body, null, 2));
      
      // Validate the request body
      const validationResult = createRoomSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation failed:", validationResult.error.format());
        return res.status(400).json({ 
          message: "Invalid room data", 
          errors: validationResult.error.format(),
          receivedData: req.body
        });
      }
      
      const { hostName, hostTimezone, deadline: deadlineStr, ...roomData } = validationResult.data;
      
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
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ 
        message: "Invalid room data", 
        error: error instanceof Error ? error.message : String(error)
      });
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
      const nameExists = existingParticipants.some((p: {name: string}) => 
        p.name.toLowerCase() === name.toLowerCase());
      
      if (nameExists) {
        return res.status(400).json({ 
          message: "Name already taken", 
          error: "A participant with this name already exists in the room. Please choose a different name."
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
        availability: '0'.repeat(totalSlots), // Empty availability initially
      });

      // Return updated room data
      const updatedRoom = await storage.getRoomWithParticipants(roomId);
      broadcastRoomEvent(roomId);
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

      const participant = await storage.updateParticipantAvailability(roomId, participantId, availability);
      
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }

      // Return updated room data with new heatmap
      const updatedRoom = await storage.getRoomWithParticipants(roomId);
      broadcastRoomEvent(roomId);
      res.json({ participant, room: updatedRoom });
    } catch (error) {
      res.status(400).json({ message: "Invalid availability data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Confirm time slot (host only)
  app.post("/api/rooms/:id/confirm", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { slotIndex, hostId } = req.body;

      // Verify room exists and host authorization
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.hostId !== hostId) {
        return res.status(403).json({ message: "Only the host can confirm times" });
      }

      const updatedRoom = await storage.updateRoomConfirmation(roomId, slotIndex);
      broadcastRoomEvent(roomId);
      res.json(updatedRoom);
    } catch (error) {
      res.status(400).json({ message: "Error confirming time", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get heatmap data for specific slot
  app.get("/api/rooms/:id/slots/:slotIndex", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const slotIndex = parseInt(req.params.slotIndex);

      const participants = await storage.getParticipantsByRoom(roomId);
      const availableParticipants = participants.filter(
        p => p.availability[slotIndex] === '1'
      );

      res.json({
        slotIndex,
        participantCount: availableParticipants.length,
        availableParticipants: availableParticipants.map(p => ({
          name: p.name,
          timezone: p.timezone
        }))
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching slot data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // SSE — real-time room updates
  app.get("/api/rooms/:id/events", (req, res) => {
    const roomId = parseInt(req.params.id);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const emitter = getRoomEmitter(roomId);
    const handler = () => { res.write("data: update\n\n"); };
    emitter.on("update", handler);

    const heartbeat = setInterval(() => { res.write(": ping\n\n"); }, 25000);

    req.on("close", () => {
      emitter.off("update", handler);
      clearInterval(heartbeat);
      if (emitter.listenerCount("update") === 0) roomEmitters.delete(roomId);
    });
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
      broadcastRoomEvent(roomId);
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
      broadcastRoomEvent(roomId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting participant", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get global stats (total rooms and participants)
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
