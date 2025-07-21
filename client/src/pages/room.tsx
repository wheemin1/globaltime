import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useParams, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Copy, QrCode, Share, Users, Globe } from "lucide-react";
import { TimeGrid } from "@/components/time-grid";
import { ParticipantPanel } from "@/components/participant-panel";
import { HeatmapResults } from "@/components/heatmap-results";
import { TimezoneSelector } from "@/components/timezone-selector";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { getUserTimezone, getTimezoneOffset } from "@/lib/timezone-utils";
import type { RoomWithParticipants, JoinRoomRequest } from "@shared/schema";

export default function Room() {
  const params = useParams<{ roomId: string }>();
  const search = useSearch();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [currentView, setCurrentView] = useState<"select" | "results">("select");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<boolean[]>(new Array(168).fill(false));
  const [currentParticipantId, setCurrentParticipantId] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [participantTimezone, setParticipantTimezone] = useState(getUserTimezone());
  const [viewingTimezone, setViewingTimezone] = useState(getUserTimezone());
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);

  const roomId = parseInt(params.roomId!) || 0;
  const hostId = new URLSearchParams(search).get("host");

  // Initialize host status first
  useEffect(() => {
    if (hostId) {
      setIsHost(true);
    } else {
      setShowJoinDialog(true);
    }
  }, [hostId]);

  const { data: room, isLoading, error } = useQuery<RoomWithParticipants>({
    queryKey: ["/api/rooms", roomId],
    enabled: roomId > 0,
    retry: false,
  });

  // 호스트인 경우 참가자 ID 설정
  useEffect(() => {
    if (isHost && room?.participants.length > 0 && !currentParticipantId) {
      const hostParticipant = room.participants[0]; // 첫 번째 참가자가 호스트
      setCurrentParticipantId(hostParticipant.id);
    }
  }, [isHost, room, currentParticipantId]);

  const joinRoomMutation = useMutation({
    mutationFn: async (data: JoinRoomRequest) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/join`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentParticipantId(data.participant.id);
      setShowJoinDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({
        title: "Joined successfully!",
        description: "You can now select your available times.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error joining room",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (availability: string) => {
      if (!currentParticipantId) throw new Error("No participant ID");
      const response = await apiRequest(
        "PUT",
        `/api/rooms/${roomId}/participants/${currentParticipantId}`,
        { availability }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({
        title: "Availability updated!",
        description: "Your changes have been saved.",
      });
      if (isMobile) {
        setCurrentView("results");
      }
    },
    onError: (error) => {
      toast({
        title: "Error updating availability",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const confirmTimeMutation = useMutation({
    mutationFn: async (slotIndex: number) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/confirm`, {
        slotIndex,
        hostId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({
        title: "Time confirmed!",
        description: "Meeting time has been set and participants will be notified.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error confirming time",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the room.",
        variant: "destructive",
      });
      return;
    }

    joinRoomMutation.mutate({
      name: participantName.trim(),
      timezone: participantTimezone,
      availability: "0".repeat(168),
    });
  };

  const handleSaveAvailability = () => {
    const availabilityString = selectedAvailability.map(slot => slot ? "1" : "0").join("");
    updateAvailabilityMutation.mutate(availabilityString);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href.split("?")[0]);
    toast({
      title: "URL copied!",
      description: "Share this link with your team members.",
    });
  };

  const handleConfirmSlot = (slotIndex: number) => {
    if (!isHost) {
      toast({
        title: "Permission denied",
        description: "Only the host can confirm meeting times.",
        variant: "destructive",
      });
      return;
    }
    confirmTimeMutation.mutate(slotIndex);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto mb-4 animate-spin" size={48} />
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">
              {error ? "Failed to load room" : "Room not found"}
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentParticipant = currentParticipantId 
    ? room.participants.find(p => p.id === currentParticipantId)
    : null;

  // Load current participant's availability only once
  useEffect(() => {
    if (currentParticipant?.availability) {
      const availabilityBits = currentParticipant.availability.split("").map(bit => bit === "1");
      // Only update if current selection is empty to avoid overwriting user changes
      if (selectedAvailability.every(slot => !slot)) {
        setSelectedAvailability(availabilityBits);
      }
    }
  }, [currentParticipant?.id, currentParticipant?.availability]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-700">
                <Clock className="inline mr-2" size={24} />
                TimeSync
              </h1>
              <div className="ml-8 hidden md:block">
                <span className="text-sm text-gray-600">{room.name}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timezone Selector */}
              <div className="flex items-center space-x-2 text-sm">
                <Globe className="text-gray-500" size={16} />
                <TimezoneSelector
                  value={viewingTimezone}
                  onChange={setViewingTimezone}
                  compact
                />
              </div>
              
              {/* Share Actions */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
                  <Copy size={16} />
                </Button>
                <Button variant="ghost" size="sm">
                  <QrCode size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Segmented Control */}
      {isMobile && (
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <div className="segmented-control flex w-full">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium text-gray-700 ${
                currentView === "select" ? "active" : ""
              }`}
              onClick={() => setCurrentView("select")}
            >
              Select Times
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium text-gray-700 ${
                currentView === "results" ? "active" : ""
              }`}
              onClick={() => setCurrentView("results")}
            >
              View Results
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isMobile ? (
          /* Mobile Layout */
          <div>
            {currentView === "select" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Select Your Available Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeGrid
                    room={room}
                    selectedSlots={selectedAvailability}
                    onSlotsChange={setSelectedAvailability}
                    viewingTimezone={viewingTimezone}
                    isEditMode={true}
                  />
                  <Button
                    onClick={handleSaveAvailability}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    disabled={updateAvailabilityMutation.isPending}
                  >
                    {updateAvailabilityMutation.isPending ? "Saving..." : "Save & View Results"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                <HeatmapResults
                  room={room}
                  viewingTimezone={viewingTimezone}
                  selectedParticipant={selectedParticipant}
                  onParticipantSelect={setSelectedParticipant}
                  onConfirmSlot={handleConfirmSlot}
                  isHost={isHost}
                />
                <ParticipantPanel
                  participants={room.participants}
                  selectedParticipant={selectedParticipant}
                  onParticipantSelect={setSelectedParticipant}
                  isMobile={true}
                />
              </div>
            )}
          </div>
        ) : (
          /* Desktop Layout */
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as "select" | "results")}>
            <TabsList className="hidden">
              <TabsTrigger value="select">Select</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="select" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Your Available Times</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TimeGrid
                        room={room}
                        selectedSlots={selectedAvailability}
                        onSlotsChange={setSelectedAvailability}
                        viewingTimezone={viewingTimezone}
                        isEditMode={true}
                      />
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-600">
                          Click or drag to select times
                        </div>
                        <Button
                          onClick={handleSaveAvailability}
                          disabled={updateAvailabilityMutation.isPending}
                        >
                          {updateAvailabilityMutation.isPending ? "Saving..." : "Save Availability"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="lg:col-span-1">
                  <ParticipantPanel
                    participants={room.participants}
                    selectedParticipant={selectedParticipant}
                    onParticipantSelect={setSelectedParticipant}
                    onViewResults={() => setCurrentView("results")}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <HeatmapResults
                    room={room}
                    viewingTimezone={viewingTimezone}
                    selectedParticipant={selectedParticipant}
                    onParticipantSelect={setSelectedParticipant}
                    onConfirmSlot={handleConfirmSlot}
                    onEditTimes={() => setCurrentView("select")}
                    isHost={isHost}
                  />
                </div>
                <div className="lg:col-span-1">
                  <ParticipantPanel
                    participants={room.participants}
                    selectedParticipant={selectedParticipant}
                    onParticipantSelect={setSelectedParticipant}
                    isResultsMode={true}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Join Room Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {room.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Your Timezone</Label>
              <TimezoneSelector
                value={participantTimezone}
                onChange={setParticipantTimezone}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={joinRoomMutation.isPending}
            >
              {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
