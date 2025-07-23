import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Clock, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { TimezoneSelector } from "@/components/timezone-selector";
import { getUserTimezone } from "@/lib/timezone-utils";
import type { CreateRoomRequest } from "@shared/schema";

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [roomName, setRoomName] = useState("");
  const [hostName, setHostName] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeStart, setTimeStart] = useState(9);
  const [timeEnd, setTimeEnd] = useState(17);
  const [hostTimezone, setHostTimezone] = useState(getUserTimezone());

  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomRequest) => {
      console.log("Sending create room request:", data);
      const response = await apiRequest("POST", "/api/rooms", data);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Room created successfully:", data);
      toast({
        title: "Room created successfully!",
        description: "You can now add your availability and share with your team.",
      });
      setLocation(`/room/${data.roomId}?host=${data.hostId}`);
    },
    onError: (error) => {
      console.error("Create room error:", error);
      toast({
        title: "Error creating room",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      toast({
        title: "Meeting name required",
        description: "Please enter a meeting name.",
        variant: "destructive",
      });
      return;
    }

    if (!hostName.trim()) {
      toast({
        title: "Your name required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDates.length === 0) {
      toast({
        title: "No dates selected",
        description: "Please select at least one date for the meeting.",
        variant: "destructive",
      });
      return;
    }

    if (timeStart >= timeEnd) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    const sortedDates = selectedDates.sort((a, b) => a.getTime() - b.getTime());
    const startDate = format(sortedDates[0], "yyyy-MM-dd");
    const endDate = format(sortedDates[sortedDates.length - 1], "yyyy-MM-dd");

    createRoomMutation.mutate({
      name: roomName.trim(),
      hostName: hostName.trim(),
      hostTimezone,
      startDate,
      endDate,
      timeStart,
      timeEnd,
    });
  };

  const today = new Date();
  const maxDate = addDays(today, 14); // 2 weeks from today

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
              </Link>
              <Link href="/" className="flex items-center text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors cursor-pointer">
                <Clock className="inline mr-2" size={24} />
                TimeSync
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Meeting Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Meeting Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Meeting Name *</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Weekly Standup Meeting"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostName">Your Name *</Label>
                  <Input
                    id="hostName"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              {/* Timezone Selection */}
              <div className="space-y-2">
                <Label>Your Timezone *</Label>
                <TimezoneSelector
                  value={hostTimezone}
                  onChange={setHostTimezone}
                />
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Select Available Dates *</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Choose the dates when the meeting could potentially happen (up to 2 weeks ahead)
                </p>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    disabled={(date) => date < today || date > maxDate}
                    className="rounded-md border-0 bg-transparent"
                  />
                </div>
                {selectedDates.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Selected {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Time Range */}
              <div className="space-y-2">
                <Label>Time Range (Hours)</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Set the daily time boundaries for potential meetings
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeStart">Start Hour</Label>
                    <select
                      id="timeStart"
                      value={timeStart}
                      onChange={(e) => setTimeStart(parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeEnd">End Hour</Label>
                    <select
                      id="timeEnd"
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {(i + 1).toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createRoomMutation.isPending}
              >
                {createRoomMutation.isPending ? "Creating Room..." : "Create Room & Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
