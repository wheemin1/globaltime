import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronUp } from "lucide-react";
import type { Participant } from "@shared/schema";

interface ParticipantPanelProps {
  participants: Participant[];
  selectedParticipant: number | null;
  onParticipantSelect: (participantId: number | null) => void;
  onViewResults?: () => void;
  onEditTimes?: () => void;
  isResultsMode?: boolean;
  isMobile?: boolean;
}

export function ParticipantPanel({
  participants,
  selectedParticipant,
  onParticipantSelect,
  onViewResults,
  onEditTimes,
  isResultsMode = false,
  isMobile = false,
}: ParticipantPanelProps) {
  const getParticipantInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvailabilityCount = (availability: string) => {
    return availability.split("").filter(bit => bit === "1").length;
  };

  const getParticipantColor = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700", 
      "bg-green-100 text-green-700",
      "bg-orange-100 text-orange-700",
      "bg-pink-100 text-pink-700",
      "bg-indigo-100 text-indigo-700",
    ];
    return colors[index % colors.length];
  };

  if (isMobile) {
    return (
      <div className="bottom-sheet fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg border-t border-gray-200 z-10">
        <div className="p-4 border-b border-gray-200">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              <Users className="inline mr-2" size={20} />
              Team Members
            </h3>
            <Badge variant="secondary">{participants.length} people</Badge>
          </div>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto space-y-3">
          {participants.map((participant, index) => (
            <div
              key={participant.id}
              className={`participant-card p-3 border rounded-lg ${
                selectedParticipant === participant.id
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200"
              }`}
              onClick={() => onParticipantSelect(
                selectedParticipant === participant.id ? null : participant.id
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getParticipantColor(index)}`}>
                    <span className="text-sm font-medium">
                      {getParticipantInitials(participant.name)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{participant.name}</div>
                    <div className="text-sm text-gray-500">{participant.timezone}</div>
                  </div>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  {getAvailabilityCount(participant.availability)} slots
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            <Users className="inline mr-2" size={20} />
            Participants
          </span>
          <Badge variant="secondary">{participants.length} people</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className={`participant-card p-4 border rounded-lg ${
              selectedParticipant === participant.id
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200"
            }`}
            onClick={() => onParticipantSelect(
              selectedParticipant === participant.id ? null : participant.id
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getParticipantColor(index)}`}>
                  <span className="text-sm font-medium">
                    {getParticipantInitials(participant.name)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{participant.name}</div>
                  <div className="text-sm text-gray-500">{participant.timezone}</div>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">
                {getAvailabilityCount(participant.availability)} slots
              </div>
            </div>
          </div>
        ))}
        
        {!isResultsMode && onViewResults && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={onViewResults}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              View Results Heatmap
            </Button>
          </div>
        )}
        
        {isResultsMode && onEditTimes && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={onEditTimes}
              variant="outline"
              className="w-full"
            >
              Edit My Times
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
