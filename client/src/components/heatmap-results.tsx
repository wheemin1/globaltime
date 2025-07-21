import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimeGrid } from "./time-grid";
import { Check, Edit, Calendar, ExternalLink } from "lucide-react";
import { convertSlotToLocalTime, formatTimeForDisplay, generateBestSlots } from "@/lib/time-slots";
import type { RoomWithParticipants } from "@shared/schema";

interface HeatmapResultsProps {
  room: RoomWithParticipants;
  viewingTimezone: string;
  selectedParticipant: number | null;
  onParticipantSelect: (participantId: number | null) => void;
  onConfirmSlot: (slotIndex: number) => void;
  onEditTimes?: () => void;
  isHost: boolean;
}

export function HeatmapResults({
  room,
  viewingTimezone,
  selectedParticipant,
  onParticipantSelect,
  onConfirmSlot,
  onEditTimes,
  isHost,
}: HeatmapResultsProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);

  const bestSlots = generateBestSlots(room.heatmap, room.participants);

  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlotIndex(slotIndex);
    setShowSlotModal(true);
  };

  const handleConfirmSelectedSlot = () => {
    if (selectedSlotIndex !== null) {
      onConfirmSlot(selectedSlotIndex);
      setShowSlotModal(false);
    }
  };

  const generateICSFile = (slotIndex: number) => {
    const dayIndex = Math.floor(slotIndex / 24);
    const hourIndex = slotIndex % 24;
    const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone);

    // Basic ICS content - in a real app, you'd use a proper ICS library
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TimeSync//TimeSync//EN
BEGIN:VEVENT
UID:${Date.now()}@timesync.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${room.name}
DTSTART:${localTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DURATION:PT1H
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${room.name.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSlotParticipants = (slotIndex: number) => {
    return room.participants.filter(p => p.availability[slotIndex] === "1");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Availability Heatmap</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Darker green indicates more people are available
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {onEditTimes && (
                <Button variant="outline" size="sm" onClick={onEditTimes}>
                  <Edit className="mr-2" size={16} />
                  Edit My Times
                </Button>
              )}
              {isHost && !room.isConfirmed && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  Waiting for confirmation
                </Badge>
              )}
              {room.isConfirmed && (
                <Badge className="bg-green-600">
                  <Check className="mr-1" size={14} />
                  Confirmed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <TimeGrid
            room={room}
            selectedSlots={[]}
            onSlotsChange={() => {}}
            viewingTimezone={viewingTimezone}
            isEditMode={false}
            heatmapData={room.heatmap}
            onSlotClick={handleSlotClick}
            selectedParticipant={selectedParticipant}
          />

          {/* Heatmap Legend */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-sm font-medium text-gray-700">Availability:</div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                  <span className="text-sm text-gray-600">0 people</span>
                </div>
                {[1, 2, 3, 4].map(count => (
                  <div key={count} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 heatmap-${count} rounded`}></div>
                    <span className="text-sm text-gray-600">{count}+ people</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-500">Click any cell for details</div>
          </div>
        </CardContent>
      </Card>

      {/* Best Time Slots */}
      {bestSlots.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Best Available Times</CardTitle>
            <p className="text-sm text-gray-600">
              Times when the most people are available
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestSlots.slice(0, 5).map((slot, index) => {
                const dayIndex = Math.floor(slot.slotIndex / 24);
                const hourIndex = slot.slotIndex % 24;
                const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone);
                const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

                return (
                  <div
                    key={slot.slotIndex}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      slot.participantCount === room.participants.length
                        ? "border-green-200 bg-green-50 hover:bg-green-100"
                        : "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                    }`}
                    onClick={() => handleSlotClick(slot.slotIndex)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {dayNames[dayIndex]} {formatTimeForDisplay(localTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {slot.availableParticipants.join(", ")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          slot.participantCount === room.participants.length
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}>
                          {slot.participantCount}/{room.participants.length}
                        </div>
                        <div className="text-xs text-gray-500">available</div>
                      </div>
                    </div>
                    {isHost && !room.isConfirmed && (
                      <Button
                        size="sm"
                        className="mt-2 bg-orange-600 hover:bg-orange-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmSlot(slot.slotIndex);
                        }}
                      >
                        <Check className="mr-1" size={14} />
                        Confirm This Time
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slot Detail Modal */}
      <Dialog open={showSlotModal} onOpenChange={setShowSlotModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time Slot Details</DialogTitle>
          </DialogHeader>
          {selectedSlotIndex !== null && (
            <div className="space-y-4">
              <div>
                <div className="font-medium text-gray-900">
                  {(() => {
                    const dayIndex = Math.floor(selectedSlotIndex / 24);
                    const hourIndex = selectedSlotIndex % 24;
                    const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone);
                    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                    return `${dayNames[dayIndex]}, ${formatTimeForDisplay(localTime)}`;
                  })()}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Available participants ({getSlotParticipants(selectedSlotIndex).length}):
                </div>
                <div className="space-y-2">
                  {getSlotParticipants(selectedSlotIndex).map((participant) => {
                    const dayIndex = Math.floor(selectedSlotIndex! / 24);
                    const hourIndex = selectedSlotIndex! % 24;
                    const participantTime = convertSlotToLocalTime(dayIndex, hourIndex, participant.timezone);

                    return (
                      <div key={participant.id} className="flex items-center justify-between text-sm">
                        <span>{participant.name}</span>
                        <span className="text-gray-500">
                          {formatTimeForDisplay(participantTime)} ({participant.timezone})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isHost && !room.isConfirmed && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Button
                    onClick={handleConfirmSelectedSlot}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Check className="mr-2" size={16} />
                    Confirm This Time
                  </Button>
                </div>
              )}

              {room.isConfirmed && selectedSlotIndex === room.confirmedSlot && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="text-center text-green-600 font-medium mb-3">
                    ✓ This time has been confirmed
                  </div>
                  <Button
                    onClick={() => generateICSFile(selectedSlotIndex)}
                    variant="outline"
                    className="w-full"
                  >
                    <Calendar className="mr-2" size={16} />
                    Download .ics file
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

```python
<replit_final_file>
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimeGrid } from "./time-grid";
import { Check, Edit, Calendar, ExternalLink } from "lucide-react";
import { convertSlotToLocalTime, formatTimeForDisplay, generateBestSlots } from "@/lib/time-slots";
import type { RoomWithParticipants } from "@shared/schema";

interface HeatmapResultsProps {
  room: RoomWithParticipants;
  viewingTimezone: string;
  selectedParticipant: number | null;
  onParticipantSelect: (participantId: number | null) => void;
  onConfirmSlot: (slotIndex: number) => void;
  onEditTimes?: () => void;
  isHost: boolean;
}

export function HeatmapResults({
  room,
  viewingTimezone,
  selectedParticipant,
  onParticipantSelect,
  onConfirmSlot,
  onEditTimes,
  isHost,
}: HeatmapResultsProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);

  const bestSlots = generateBestSlots(room.heatmap, room.participants);

  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlotIndex(slotIndex);
    setShowSlotModal(true);
  };

  const handleConfirmSelectedSlot = () => {
    if (selectedSlotIndex !== null) {
      onConfirmSlot(selectedSlotIndex);
      setShowSlotModal(false);
    }
  };

  const generateICSFile = (slotIndex: number) => {
    const dayIndex = Math.floor(slotIndex / 24);
    const hourIndex = slotIndex % 24;
    const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone);

    // Basic ICS content - in a real app, you'd use a proper ICS library
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TimeSync//TimeSync//EN
BEGIN:VEVENT
UID:${Date.now()}@timesync.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${room.name}
DTSTART:${localTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DURATION:PT1H
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${room.name.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSlotParticipants = (slotIndex: number) => {
    return room.participants.filter(p => p.availability[slotIndex] === "1");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Availability Heatmap</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Darker green indicates more people are available
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {onEditTimes && (
                <Button variant="outline" size="sm" onClick={onEditTimes}>
                  <Edit className="mr-2" size={16} />
                  Edit My Times
                </Button>
              )}
              {isHost && !room.isConfirmed && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  Waiting for confirmation
                </Badge>
              )}
              {room.isConfirmed && (
                <Badge className="bg-green-600">
                  <Check className="mr-1" size={14} />
                  Confirmed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <TimeGrid
            room={room}
            selectedSlots={[]}
            onSlotsChange={() => {}}
            viewingTimezone={viewingTimezone}
            isEditMode={false}
            heatmapData={room.heatmap}
            onSlotClick={handleSlotClick}
            selectedParticipant={selectedParticipant}
          />

          {/* Heatmap Legend */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-sm font-medium text-gray-700">Availability:</div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                  <span className="text-sm text-gray-600">0 people</span>
                </div>
                {[1, 2, 3, 4].map(count => (
                  <div key={count} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 heatmap-${count} rounded`}></div>
                    <span className="text-sm text-gray-600">{count}+ people</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-500">Click any cell for details</div>
          </div>
        </CardContent>
      </Card>

      {/* Best Time Slots */}
      {bestSlots.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Best Available Times</CardTitle>
            <p className="text-sm text-gray-600">
              Times when the most people are available
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestSlots.slice(0, 5).map((slot, index) => {
                const dayIndex = Math.floor(slot.slotIndex / 24);
                const hourIndex = slot.slotIndex % 24;
                const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone);
                const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

                return (
                  <div
                    key={slot.slotIndex}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      slot.participantCount === room.participants.length
                        ? "border-green-200 bg-green-50 hover:bg-green-100"
                        : "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                    }`}
                    onClick={() => handleSlotClick(slot.slotIndex)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {dayNames[dayIndex]} {formatTimeForDisplay(localTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {slot.availableParticipants.join(", ")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          slot.participantCount === room.participants.length
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}>
                          {slot.participantCount}/{room.participants.length}
                        </div>
                        <div className="text-xs text-gray-500">available</div>
                      </div>
                    </div>
                    {isHost && !room.isConfirmed && (
                      <Button
                        size="sm"
                        className="mt-2 bg-orange-600 hover:bg-orange-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmSlot(slot.slotIndex);
                        }}
                      >
                        <Check className="mr-1" size={14} />
                        Confirm This Time
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slot Detail Modal */}
      <Dialog open={showSlotModal} onOpenChange={setShowSlotModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time Slot Details</DialogTitle>
          </DialogHeader>
          {selectedSlotIndex !== null && (
            <div className="space-y-4">
              <div>
                <div className="font-medium text-gray-900">
                  {(() => {
                    const dayIndex = Math.floor(selectedSlotIndex / 24);
                    const hourIndex = selectedSlotIndex % 24;
                    const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone);
                    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                    return `${dayNames[dayIndex]}, ${formatTimeForDisplay(localTime)}`;
                  })()}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Available participants ({getSlotParticipants(selectedSlotIndex).length}):
                </div>
                <div className="space-y-2">
                  {getSlotParticipants(selectedSlotIndex).map((participant) => {
                    const dayIndex = Math.floor(selectedSlotIndex! / 24);
                    const hourIndex = selectedSlotIndex! % 24;
                    const participantTime = convertSlotToLocalTime(dayIndex, hourIndex, participant.timezone);

                    return (
                      <div key={participant.id} className="flex items-center justify-between text-sm">
                        <span>{participant.name}</span>
                        <span className="text-gray-500">
                          {formatTimeForDisplay(participantTime)} ({participant.timezone})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isHost && !room.isConfirmed && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Button
                    onClick={handleConfirmSelectedSlot}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Check className="mr-2" size={16} />
                    Confirm This Time
                  </Button>
                </div>
              )}

              {room.isConfirmed && selectedSlotIndex === room.confirmedSlot && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="text-center text-green-600 font-medium mb-3">
                    ✓ This time has been confirmed
                  </div>
                  <Button
                    onClick={() => generateICSFile(selectedSlotIndex)}
                    variant="outline"
                    className="w-full"
                  >
                    <Calendar className="mr-2" size={16} />
                    Download .ics file
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

```python
<replit_final_file>
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimeGrid } from "./time-grid";
import { Check, Edit, Calendar, ExternalLink } from "lucide-react";
import { convertSlotToLocalTime, formatTimeForDisplay, generateBestSlots } from "@/lib/time-slots";
import type { RoomWithParticipants } from "@shared/schema";

interface HeatmapResultsProps {
  room: RoomWithParticipants;
  viewingTimezone: string;
  selectedParticipant: number | null;
  onParticipantSelect: (participantId: number | null) => void;
  onConfirmSlot: (slotIndex: number) => void;
  onEditTimes?: () => void;
  isHost: boolean;
}

export function HeatmapResults({
  room,
  viewingTimezone,
  selectedParticipant,
  onParticipantSelect,
  onConfirmSlot,
  onEditTimes,
  isHost,
}: HeatmapResultsProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);

  const bestSlots = generateBestSlots(room.heatmap, room.participants);

  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlotIndex(slotIndex);
    setShowSlotModal(true);
  };

  const handleConfirmSelectedSlot = () => {
    if (selectedSlotIndex !== null) {
      onConfirmSlot(selectedSlotIndex);
      setShowSlotModal(false);
    }
  };

  const generateICSFile = (slotIndex: number) => {
    const dayIndex = Math.floor(slotIndex / 24);
    const hourIndex = slotIndex % 24;
    const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone);

    // Basic ICS content - in a real app, you'd use a proper ICS library
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TimeSync//TimeSync//EN
BEGIN:VEVENT
UID:${Date.now()}@timesync.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${room.name}
DTSTART:${localTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DURATION:PT1H
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${room.name.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSlotParticipants = (slotIndex: number) => {
    return room.participants.filter(p => p.availability[slotIndex] === "1");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Availability Heatmap</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Darker green indicates more people are available
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {onEditTimes && (
                <Button variant="outline" size="sm" onClick={onEditTimes}>
                  <Edit className="mr-2" size={16} />
                  Edit My Times
                </Button>
              )}
              {isHost && !room.isConfirmed && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  Waiting for confirmation
                </Badge>
              )}
              {room.isConfirmed && (
                <Badge className="bg-green-600">
                  <Check className="mr-1" size={14} />
                  Confirmed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <TimeGrid
            room={room}
            selectedSlots={[]}
            onSlotsChange={() => {}}
            viewingTimezone={viewingTimezone}
            isEditMode={false}
            heatmapData={room.heatmap}
            onSlotClick={handleSlotClick}
            selectedParticipant={selectedParticipant}
          />

          {/* Heatmap Legend */}
          <div className="mt-4 flex items-center justify-between">
             <div className="flex items-center space-x-6">
              <div className="text-sm font-medium text-gray-700">Availability:</div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                  <span className="text-sm text-gray-600">0 people</span>
                </div>
                {[1, 2, 3, 4].map(count => (
                  <div key={count} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 heatmap-${count} rounded`}></div>
                    <span className="text-sm text-gray-600">{count}+ people</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-500">Click any cell for details</div>
          </div>
        </CardContent>
      </Card>

      {/* Best Time Slots */}
      {bestSlots.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Best Available Times</CardTitle>
            <p className="text-sm text-gray-600">
              Times when the most people are available
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestSlots.slice(0, 5).map((slot, index) => {
                const dayIndex = Math.floor(slot.slotIndex / 24);
                const hourIndex = slot.slotIndex % 24;
                const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone);
                const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

                return (
                  <div
                    key={slot.slotIndex}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      slot.participantCount === room.participants.length
                        ? "border-green-200 bg-green-50 hover:bg-green-100"
                        : "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                    }`}
                    onClick={() => handleSlotClick(slot.slotIndex)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {dayNames[dayIndex]} {formatTimeForDisplay(localTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {slot.availableParticipants.join(", ")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          slot.participantCount === room.participants.length
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}>
                          {slot.participantCount}/{room.participants.length}
                        </div>
                        <div className="text-xs text-gray-500">available</div>
                      </div>
                    </div>
                    {isHost && !room.isConfirmed && (
                      <Button
                        size="sm"
                        className="mt-2 bg-orange-600 hover:bg-orange-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmSlot(slot.slotIndex);
                        }}
                      >
                        <Check className="mr-1" size={14} />
                        Confirm This Time
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slot Detail Modal */}
      <Dialog open={showSlotModal} onOpenChange={setShowSlotModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time Slot Details</DialogTitle>
          </DialogHeader>
          {selectedSlotIndex !== null && (
            <div className="space-y-4">
              <div>
                <div className="font-medium text-gray-900">
                  {(() => {
                    const dayIndex = Math.floor(selectedSlotIndex / 24);
                    const hourIndex = selectedSlotIndex % 24;
                    const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone);
                    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                    return `${dayNames[dayIndex]}, ${formatTimeForDisplay(localTime)}`;
                  })()}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Available participants ({getSlotParticipants(selectedSlotIndex).length}):
                </div>
                <div className="space-y-2">
                  {getSlotParticipants(selectedSlotIndex).map((participant) => {
                    const dayIndex = Math.floor(selectedSlotIndex! / 24);
                    const hourIndex = selectedSlotIndex! % 24;
                    const participantTime = convertSlotToLocalTime(dayIndex, hourIndex, participant.timezone);

                    return (
                      <div key={participant.id} className="flex items-center justify-between text-sm">
                        <span>{participant.name}</span>
                        <span className="text-gray-500">
                          {formatTimeForDisplay(participantTime)} ({participant.timezone})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isHost && !room.isConfirmed && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Button
                    onClick={handleConfirmSelectedSlot}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Check className="mr-2" size={16} />
                    Confirm This Time
                  </Button>
                </div>
              )}

              {room.isConfirmed && selectedSlotIndex === room.confirmedSlot && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="text-center text-green-600 font-medium mb-3">
                    ✓ This time has been confirmed
                  </div>
                  <Button
                    onClick={() => generateICSFile(selectedSlotIndex)}
                    variant="outline"
                    className="w-full"
                  >
                    <Calendar className="mr-2" size={16} />
                    Download .ics file
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}