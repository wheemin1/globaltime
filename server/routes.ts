import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createRoomSchema, joinRoomSchema, updateAvailabilitySchema } from "@shared/schema";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new room
  app.post("/api/rooms", async (req, res) => {
    try {
      const { hostName, hostTimezone, ...roomData } = createRoomSchema.parse(req.body);
      
      // Generate unique host ID
      const hostId = nanoid();
      
      // Create room
      const room = await storage.createRoom({
        ...roomData,
        hostId,
      });

      // Add host as first participant with empty availability
      await storage.addParticipant({
        roomId: room.id,
        name: hostName,
        timezone: hostTimezone,
        availability: '0'.repeat(168), // Empty availability initially
      });

      res.json({ roomId: room.id, hostId });
    } catch (error) {
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
      const participantData = joinRoomSchema.parse(req.body);

      // Check if room exists
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Add participant
      const participant = await storage.addParticipant({
        roomId,
        ...participantData,
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

      const participant = await storage.updateParticipantAvailability(roomId, participantId, availability);
      
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }

      // Return updated room data with new heatmap
      const updatedRoom = await storage.getRoomWithParticipants(roomId);
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

  const httpServer = createServer(app);
  return httpServer;
}
