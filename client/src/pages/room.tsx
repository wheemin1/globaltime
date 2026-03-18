
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useParams, useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Copy, Globe, ChevronRight, Pencil, AlertCircle, QrCode, CheckCircle2, CalendarDays } from "lucide-react";
import { TimeGrid } from "@/components/time-grid";
import { ParticipantPanel } from "@/components/participant-panel";
import { HeatmapResults } from "@/components/heatmap-results";
import { TimezoneSelector } from "@/components/timezone-selector";
import { ThemeToggle } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { getUserTimezone } from "@/lib/timezone-utils";
import { parseISO, eachDayOfInterval, format } from "date-fns";
import { convertSlotToLocalTime, formatTimeForDisplay } from "@/lib/time-slots";
import { calculateTotalSlots, getSlotsPerDay } from "@shared/scheduling";
import type { RoomWithParticipants, JoinRoomRequest } from "@shared/schema";
import { SEO, seoConfigs } from "@/components/SEO";
import { BugReport } from "@/components/bug-report";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

export default function Room() {
  const params = useParams<{ roomId: string }>();
  const search = useSearch();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  
  // Constants derived from params - always computed
  const roomId = parseInt(params.roomId || "0") || 0;
  const queryParams = new URLSearchParams(search);
  const queryHostToken = queryParams.get("hostToken");
  const queryLegacyHostId = queryParams.get("host");
  const storedHostToken = typeof window !== 'undefined' ? localStorage.getItem(`room_${roomId}_hostToken`) : null;
  const storedLegacyHostId = typeof window !== 'undefined' ? localStorage.getItem(`room_${roomId}_hostId`) : null;
  const initialHostToken = queryHostToken || storedHostToken;
  const legacyHostId = queryLegacyHostId || storedLegacyHostId;
  const storedParticipantId = typeof window !== 'undefined' ? localStorage.getItem(`room_${roomId}_participantId`) : null;
  
  // All state hooks first - never conditional
  const [currentView, setCurrentView] = useState<"select" | "results">("select");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [confirmSlotIndex, setConfirmSlotIndex] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditRoomDialog, setShowEditRoomDialog] = useState(false);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomDescription, setEditRoomDescription] = useState("");
  const [currentParticipantId, setCurrentParticipantId] = useState<number | null>(
    storedParticipantId ? parseInt(storedParticipantId) : null
  );
  const [isHost, setIsHost] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [participantTimezone, setParticipantTimezone] = useState(getUserTimezone());
  const [viewingTimezone, setViewingTimezone] = useState(getUserTimezone());
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  const [use12h, setUse12hState] = useState<boolean>(() =>
    typeof window !== 'undefined' && localStorage.getItem('timeFormat') === '12h'
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingViewChange, setPendingViewChange] = useState<"select" | "results" | null>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showShareSection, setShowShareSection] = useState(true);
  const [hostToken, setHostToken] = useState<string | null>(initialHostToken);
  const [hostAuthStatus, setHostAuthStatus] = useState<"valid" | "refreshing" | "expired">(
    initialHostToken || legacyHostId ? "valid" : "expired"
  );

  const refreshHostToken = async (): Promise<string | null> => {
    if (roomId <= 0) return null;
    if (!hostToken && !legacyHostId) return null;
    setHostAuthStatus("refreshing");

    try {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/host-token/refresh`, {
        hostId: legacyHostId,
        hostToken,
      });
      const data = await response.json();
      if (!data?.hostToken || typeof data.hostToken !== "string") {
        return null;
      }

      setHostToken(data.hostToken);
      setHostAuthStatus("valid");
      if (typeof window !== 'undefined') {
        localStorage.setItem(`room_${roomId}_hostToken`, data.hostToken);
      }
      return data.hostToken;
    } catch {
      setHostAuthStatus("expired");
      return null;
    }
  };

  const withHostAuthRetry = async <T,>(request: (token: string | null) => Promise<T>): Promise<T> => {
    try {
      return await request(hostToken);
    } catch (error) {
      const isForbidden = error instanceof Error && error.message.startsWith("403:");
      if (!isForbidden) {
        if (initialHostToken || legacyHostId) {
          setHostAuthStatus("valid");
        }
        throw error;
      }

      const refreshedHostToken = await refreshHostToken();
      if (!refreshedHostToken) {
        throw new Error("403: Host session expired");
      }
      setHostAuthStatus("valid");
      return request(refreshedHostToken);
    }
  };

  const getHostActionErrorDescription = (error: Error): string => {
    if (error.message.includes("Host session expired")) {
      return "Host session expired. Re-open the host link or refresh the page.";
    }
    if (error.message.startsWith("403:")) {
      return "Host authorization failed. Please use the original host link.";
    }
    return error.message;
  };

  const getHostAuthStatusLabel = (): string => {
    if (hostAuthStatus === "refreshing") return "Host auth: refreshing";
    if (hostAuthStatus === "expired") return "Host auth: expired";
    return "Host auth: valid";
  };

  const handleManualHostAuthRefresh = async () => {
    const refreshed = await refreshHostToken();
    if (refreshed) {
      toast({ title: "Host authorization refreshed" });
      return;
    }
    toast({
      title: t("room.toast.error"),
      description: "Could not refresh host authorization. Use the original host link.",
      variant: "destructive",
    });
  };

  const setUse12h = (v: boolean) => {
    localStorage.setItem('timeFormat', v ? '12h' : '24h');
    setUse12hState(v);
  };

  const handleSlotsChange = (slots: number[]) => {
    setSelectedAvailability(slots);
    if (currentParticipantId) setHasUnsavedChanges(true);
  };

  const handleViewChange = (v: "select" | "results") => {
    if (hasUnsavedChanges && currentView === "select") {
      setPendingViewChange(v);
      setShowUnsavedDialog(true);
    } else {
      setCurrentView(v);
    }
  };

  // Query hook - always called
  const { data: room, isLoading, error } = useQuery<RoomWithParticipants>({
    queryKey: ["/api/rooms", roomId],
    enabled: roomId > 0,
    retry: false,
    refetchInterval: 30000,
  });

  // Calculate total slots based on room date range and slotMinutes
  const totalSlots = useMemo(() => {
    if (!room) return 168; // default fallback
    return calculateTotalSlots(room.startDate, room.endDate, room.slotMinutes ?? 60);
  }, [room?.startDate, room?.endDate, room?.slotMinutes]);

  const [selectedAvailability, setSelectedAvailability] = useState<number[]>([]);
  const hasLoadedAvailabilityRef = useRef(false);

  // Initialize selectedAvailability when totalSlots changes
  useEffect(() => {
    setSelectedAvailability(new Array(totalSlots).fill(0));
  }, [totalSlots]);

  // Mutation hooks - always called
  const joinRoomMutation = useMutation({
    mutationFn: async (data: JoinRoomRequest) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/join`, data);
      return response.json();
    },
    onSuccess: (data) => {
      const participantId = data.participant.id;
      setCurrentParticipantId(participantId);
      if (typeof window !== 'undefined' && roomId > 0) {
        localStorage.setItem(`room_${roomId}_participantId`, participantId.toString());
      }
      setShowJoinDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({
        title: "Joined successfully!",
        description: t('room.selectTitle'),
      });
    },
    onError: (error) => {
      let description = t('room.toast.errorJoining');
      const colonIdx = error.message.indexOf(': ');
      if (colonIdx !== -1) {
        try {
          const parsed = JSON.parse(error.message.slice(colonIdx + 2));
          if (parsed.error) description = parsed.error;
          else if (parsed.message) description = parsed.message;
        } catch {
          // keep default i18n message
        }
      }
      toast({
        title: t('room.toast.error'),
        description,
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
    onSuccess: (_, availabilityString) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      const slotCount = availabilityString.split('').filter(c => c === '1').length;
      const sm = room?.slotMinutes ?? 60;
      const hrs = ((slotCount * sm) / 60).toFixed(1).replace(/\.0$/, '');
      toast({
        title: t('room.toast.availabilitySaved'),
        description: slotCount > 0
          ? t('room.toast.availabilitySavedDesc', { count: slotCount, hrs })
          : t('room.toast.noSlotsSelected'),
      });
      setHasUnsavedChanges(false);
      if (isMobile) {
        setCurrentView("results");
      }
    },
    onError: (error: Error) => {
      if (error.message.includes("404") || error.message.includes("not found")) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`room_${roomId}_participantId`);
        }
        setCurrentParticipantId(null);
        setShowJoinDialog(true);
        toast({
          title: "Session expired",
          description: "Please re-join the room to save your availability.",
          variant: "destructive",
        });
      } else {
        toast({
          title: t('room.toast.error'),
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const confirmTimeMutation = useMutation({
    mutationFn: async (slotIndex: number) => {
      return withHostAuthRetry(async (token) => {
        const response = await apiRequest("POST", `/api/rooms/${roomId}/confirm`, {
          slotIndex,
          hostId: legacyHostId,
          hostToken: token,
        });
        return response.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({
        title: t('room.toast.meetingConfirmed'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('room.toast.error'),
        description: getHostActionErrorDescription(error),
        variant: "destructive",
      });
    },
  });

  const unconfirmTimeMutation = useMutation({
    mutationFn: async () => {
      return withHostAuthRetry(async (token) => {
        const response = await apiRequest("POST", `/api/rooms/${roomId}/unconfirm`, {
          hostId: legacyHostId,
          hostToken: token,
        });
        return response.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({ title: t('room.toast.meetingUnconfirmed') });
    },
    onError: (error: Error) => {
      toast({ title: t('room.toast.error'), description: getHostActionErrorDescription(error), variant: "destructive" });
    },
  });

  // Auto-collapse share section once the team starts joining
  useEffect(() => {
    if (room && room.participants.length > 1) {
      setShowShareSection(false);
    }
  }, [room?.participants.length]);

  // All useEffect hooks - always called, with proper dependencies
  useEffect(() => {
    if (hostToken || legacyHostId) {
      setIsHost(true);
      setHostAuthStatus("valid");
      if (typeof window !== 'undefined' && roomId > 0) {
        if (hostToken) {
          localStorage.setItem(`room_${roomId}_hostToken`, hostToken);
        }
        if (legacyHostId) {
          localStorage.setItem(`room_${roomId}_hostId`, legacyHostId);
        }
      }
    }
    if (!hostToken && !legacyHostId && !currentParticipantId) {
      setShowJoinDialog(true);
    }
  }, [hostToken, legacyHostId, roomId, currentParticipantId]);

  useEffect(() => {
    if (initialHostToken && initialHostToken !== hostToken) {
      setHostToken(initialHostToken);
    }
  }, [initialHostToken]);

  useEffect(() => {
    if (isHost && room?.participants && room.participants.length > 0 && !currentParticipantId) {
      const hostParticipant = room.participants[0];
      setCurrentParticipantId(hostParticipant.id);
    }
  }, [isHost, room?.participants, currentParticipantId]);

  // Reset loaded flag when participant changes so fresh data loads
  useEffect(() => {
    hasLoadedAvailabilityRef.current = false;
  }, [currentParticipantId]);

  useEffect(() => {
    if (currentParticipantId && room?.participants && !hasLoadedAvailabilityRef.current) {
      const currentParticipant = room.participants.find(p => p.id === currentParticipantId);
      if (currentParticipant?.availability) {
        const availabilityBits = currentParticipant.availability.split("").map(b => parseInt(b) as 0 | 1 | 2);
        setSelectedAvailability(availabilityBits);
        hasLoadedAvailabilityRef.current = true;
      }
    }
  }, [currentParticipantId, room?.participants]);

  // Event handlers
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
    });
  };

  const handleSaveAvailability = () => {
    const availabilityString = selectedAvailability.map(slot => String(slot)).join("");
    updateAvailabilityMutation.mutate(availabilityString);
  };

  const handleCopyUrl = async () => {
    const url = window.location.href.split("?")[0];
    if (typeof navigator.share === "function" && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    navigator.clipboard.writeText(url);
    toast({
      title: t('room.toast.linkCopied'),
      description: t('room.toast.linkCopiedDesc'),
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
    setConfirmSlotIndex(slotIndex);
    setShowConfirmDialog(true);
  };

  const handleUnconfirm = () => {
    if (isHost) unconfirmTimeMutation.mutate();
  };

  const getConfirmedSlotLabel = (slotIndex: number): string => {
    if (!room) return "";
    const sm = room.slotMinutes ?? 60;
    const spd = getSlotsPerDay(sm);
    const dayIndex = Math.floor(slotIndex / spd);
    const slotWithinDay = slotIndex % spd;
    const days = eachDayOfInterval({ start: parseISO(room.startDate), end: parseISO(room.endDate) });
    const day = days[dayIndex];
    if (!day) return "";
    const localTime = convertSlotToLocalTime(dayIndex, slotWithinDay, viewingTimezone, room.startDate, room.timeStart, sm);
    return `${format(day, "EEE, MMM d")} · ${formatTimeForDisplay(localTime, use12h)}`;
  };

  const handleConfirmSlotConfirmed = () => {
    if (confirmSlotIndex !== null) {
      confirmTimeMutation.mutate(confirmSlotIndex);
    }
    setShowConfirmDialog(false);
    setConfirmSlotIndex(null);
  };

  const updateRoomMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      return withHostAuthRetry(async (token) => {
        const response = await apiRequest("PATCH", `/api/rooms/${roomId}`, {
          ...data,
          hostId: legacyHostId,
          hostToken: token,
        });
        return response.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      setShowEditRoomDialog(false);
      toast({ title: t('room.toast.roomUpdated') });
    },
    onError: (error: Error) => {
      toast({ title: t('room.toast.error'), description: getHostActionErrorDescription(error), variant: "destructive" });
    },
  });

  const deleteParticipantMutation = useMutation({
    mutationFn: async (participantId: number) => {
      return withHostAuthRetry(async (token) => {
        const query = new URLSearchParams();
        if (legacyHostId) {
          query.set("hostId", legacyHostId);
        }
        if (token) {
          query.set("hostToken", token);
        }
        const response = await apiRequest("DELETE", `/api/rooms/${roomId}/participants/${participantId}?${query.toString()}`);
        return response.json();
      });
    },
    onSuccess: (_: unknown, participantId: number) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      if (participantId === currentParticipantId) {
        setCurrentParticipantId(null);
        if (typeof window !== 'undefined') localStorage.removeItem(`room_${roomId}_participantId`);
      }
      toast({ title: t('room.toast.participantRemoved') });
    },
    onError: (error: Error) => {
      toast({ title: t('room.toast.error'), description: getHostActionErrorDescription(error), variant: "destructive" });
    },
  });

  // Early returns after all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-28 rounded hidden sm:block" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {/* Share card skeleton */}
          <Skeleton className="h-12 w-full rounded-lg" />
          {/* Progress bar skeleton */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          {/* Tab bar skeleton */}
          <div className="flex gap-1">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          {/* Main grid + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 rounded-xl border border-border p-4 space-y-3">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-56" />
              {/* Day headers */}
              <div className="flex gap-1 mt-2">
                <Skeleton className="h-10 w-14 rounded shrink-0" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 flex-1 rounded" />
                ))}
              </div>
              {/* Time rows */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex gap-1">
                  <Skeleton className="h-6 w-14 rounded shrink-0" style={{ opacity: i % 2 === 1 ? 0.4 : 1 }} />
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 flex-1 rounded" style={{ opacity: Math.max(0.15, 0.7 - i * 0.04) }} />
                  ))}
                </div>
              ))}
            </div>
            <div className="lg:col-span-1 rounded-xl border border-border p-4 space-y-3">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-4 w-8 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
            <Clock className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">
            {error ? t('room.errorLoading') : t('room.notFound')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('room.notFoundDesc')}
          </p>
          <Button asChild>
            <Link href="/">{t('common.backToHome')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentParticipant = currentParticipantId && room.participants
    ? room.participants.find(p => p.id === currentParticipantId)
    : null;

  const respondedCount = room.participants.filter(
    p => p.availability.includes('1') || p.availability.includes('2')
  ).length;

  const shareUrl = typeof window !== 'undefined' ? window.location.href.split("?")[0] : '';
  const shareText = `${room.name} — ${t('room.shareBanner.shareText')} ${shareUrl}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={room.name ? `${room.name} – TimeSync` : seoConfigs.room.title}
        description={seoConfigs.room.description}
        noIndex={seoConfigs.room.noIndex}
      />

      {/* App Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo + breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/" className="flex items-center gap-2 font-semibold text-sm shrink-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <Clock className="h-4 w-4 text-primary-foreground" />
                </span>
                <span className="hidden sm:inline text-foreground">TimeSync</span>
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{room.name}</span>
              {room.participants.length > 0 && (
                <Badge variant="secondary" className="text-xs shrink-0 hidden sm:flex">
                  {respondedCount}/{room.participants.length} {t('room.responded')}
                </Badge>
              )}
              {isHost && (
                <Badge
                  variant={hostAuthStatus === "expired" ? "destructive" : "outline"}
                  className="text-xs shrink-0 hidden lg:flex"
                >
                  {getHostAuthStatusLabel()}
                </Badge>
              )}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <TimezoneSelector
                  value={viewingTimezone}
                  onChange={setViewingTimezone}
                  compact
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={handleCopyUrl}
                title="Copy link"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">{t('common.share')}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowQrDialog(true)}
                title={t('room.qrCode')}
              >
                <QrCode className="h-4 w-4" />
              </Button>
              {isHost && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setEditRoomName(room.name);
                    setEditRoomDescription(room.description ?? "");
                    setShowEditRoomDialog(true);
                  }}
                  title="Edit room"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {!currentParticipantId && !isHost && (
                <Button size="sm" onClick={() => setShowJoinDialog(true)}>
                  {t('room.joinRoom')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-foreground"
                onClick={() => setUse12h(!use12h)}
                title={use12h ? t('room.switch24h') : t('room.switch12h')}
              >
                {use12h ? '12h' : '24h'}
              </Button>
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile timezone row */}
          {isMobile && (
            <div className="sm:hidden flex items-center gap-1.5 pb-2 text-sm flex-wrap">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <TimezoneSelector
                value={viewingTimezone}
                onChange={setViewingTimezone}
                compact
              />
              {isHost && (
                <>
                  <Badge
                    variant={hostAuthStatus === "expired" ? "destructive" : "outline"}
                    className="text-[10px]"
                  >
                    {getHostAuthStatusLabel()}
                  </Badge>
                  {hostAuthStatus === "expired" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={handleManualHostAuthRefresh}
                    >
                      Retry auth
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile view toggle */}
      {isMobile && (
        <div className="px-4 pt-4 pb-2">
          <div className="view-toggle">
            <button
              className={currentView === "select" ? "active" : ""}
              onClick={() => handleViewChange("select")}
            >
              {t('room.selectTimes')}
            </button>
            <button
              className={currentView === "results" ? "active" : ""}
              onClick={() => handleViewChange("results")}
            >
              {t('room.viewResults')}
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Confirmed time banner */}
        {room.isConfirmed && room.confirmedSlot !== null && room.confirmedSlot !== undefined && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 px-4 py-3 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    {t('room.confirmedBanner.title')}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                    {getConfirmedSlotLabel(room.confirmedSlot)}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                onClick={() => currentView !== "results" && handleViewChange("results")}
              >
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                {t('room.confirmedBanner.viewDetails')}
              </Button>
            </div>
          </div>
        )}

        {/* Invite / Share section — always visible for host */}
        {isHost && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 mb-4 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setShowShareSection(v => !v)}
            >
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{t('room.shareInvite.title')}</p>
                  {!showShareSection && (
                    <p className="text-xs text-muted-foreground">{t('room.shareInvite.desc')}</p>
                  )}
                </div>
              </div>
              <span className="text-muted-foreground text-xs shrink-0">{showShareSection ? '▴' : '▾'}</span>
            </button>
            {showShareSection && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-muted-foreground">{t('room.shareInvite.desc')}</p>
                <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border text-xs text-muted-foreground font-mono truncate">
                  {shareUrl}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" onClick={handleCopyUrl} className="shrink-0">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    {t('room.shareInvite.copyLink')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setShowQrDialog(true)}
                  >
                    <QrCode className="h-3.5 w-3.5 mr-1.5" />
                    {t('room.qrCode')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Response progress */}
        {room.participants.length > 1 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {t('room.progressLabel', { responded: respondedCount, total: room.participants.length })}
              </span>
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {Math.round((respondedCount / room.participants.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(respondedCount / room.participants.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Room description and deadline */}
        {(room.description || room.deadline) && (
          <div className="rounded-lg border bg-muted/30 px-4 py-3 mb-6 space-y-1.5">
            {room.description && (
              <p className="text-sm text-foreground whitespace-pre-wrap">{room.description}</p>
            )}
            {room.deadline && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {t('room.deadline', { date: format(new Date(room.deadline), "MMM d, yyyy") })}
              </p>
            )}
          </div>
        )}
        {isMobile ? (
          <div>
            {currentView === "select" ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">{t('room.selectTitle')}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t('room.selectDesc')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <TimeGrid
                      room={room}
                      selectedSlots={selectedAvailability}
                      onSlotsChange={handleSlotsChange}
                      viewingTimezone={viewingTimezone}
                      isEditMode={true}
                      use12h={use12h}
                    />
                    {!currentParticipantId && !isHost && (
                      <div className="absolute inset-0 rounded-lg bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                        <p className="text-sm font-medium text-center px-4">{t('room.joinToInteract')}</p>
                        <Button size="sm" onClick={() => setShowJoinDialog(true)}>
                          {t('room.joinRoom')}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSaveAvailability}
                    className="w-full"
                    disabled={updateAvailabilityMutation.isPending || !currentParticipantId}
                  >
                    {updateAvailabilityMutation.isPending ? t('common.saving') : t('room.saveViewResults')}
                  </Button>
                  <ParticipantPanel
                    participants={room.participants}
                    selectedParticipant={selectedParticipant}
                    onParticipantSelect={setSelectedParticipant}
                    isMobile={true}
                    isHost={isHost}
                    currentParticipantId={currentParticipantId}
                    onDeleteParticipant={(id) => deleteParticipantMutation.mutate(id)}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <HeatmapResults
                  room={room}
                  viewingTimezone={viewingTimezone}
                  myTimezone={participantTimezone}
                  selectedParticipant={selectedParticipant}
                  onParticipantSelect={setSelectedParticipant}
                  onConfirmSlot={handleConfirmSlot}
                  onUnconfirm={handleUnconfirm}
                  onEditTimes={() => setCurrentView("select")}
                  isHost={isHost}
                  use12h={use12h}
                />
                <ParticipantPanel
                  participants={room.participants}
                  selectedParticipant={selectedParticipant}
                  onParticipantSelect={setSelectedParticipant}
                  isMobile={true}
                  isHost={isHost}
                  currentParticipantId={currentParticipantId}
                  onDeleteParticipant={(id) => deleteParticipantMutation.mutate(id)}
                />
              </div>
            )}
          </div>
        ) : (
          /* Desktop Layout */
          <Tabs value={currentView} onValueChange={(v) => handleViewChange(v as "select" | "results")}>
            <TabsList className="mb-6">
              <TabsTrigger value="select">{t('room.selectTimes')}</TabsTrigger>
              <TabsTrigger value="results">{t('room.viewResults')}</TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">{t('room.selectTitle')}</CardTitle>
                      <p className="text-xs text-muted-foreground">{t('room.selectDesc')}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <TimeGrid
                          room={room}
                          selectedSlots={selectedAvailability}
                          onSlotsChange={handleSlotsChange}
                          viewingTimezone={viewingTimezone}
                          isEditMode={true}
                          use12h={use12h}
                        />
                        {!currentParticipantId && !isHost && (
                          <div className="absolute inset-0 rounded-lg bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                            <p className="text-sm font-medium text-center px-4">{t('room.joinToInteract')}</p>
                            <Button size="sm" onClick={() => setShowJoinDialog(true)}>
                              {t('room.joinRoom')}
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end items-center gap-3">
                        {!currentParticipantId && !isHost && (
                          <p className="text-xs text-muted-foreground">{t('room.joinToSaveSm')}</p>
                        )}
                        <Button
                          onClick={handleSaveAvailability}
                          disabled={updateAvailabilityMutation.isPending || !currentParticipantId}
                        >
                          {updateAvailabilityMutation.isPending ? t('common.saving') : t('room.saveAvailability')}
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
                    onViewResults={() => handleViewChange("results")}
                    isHost={isHost}
                    currentParticipantId={currentParticipantId}
                    onDeleteParticipant={(id) => deleteParticipantMutation.mutate(id)}
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
                    myTimezone={participantTimezone}
                    selectedParticipant={selectedParticipant}
                    onParticipantSelect={setSelectedParticipant}
                    onConfirmSlot={handleConfirmSlot}
                    onUnconfirm={handleUnconfirm}
                    onEditTimes={() => setCurrentView("select")}
                    isHost={isHost}
                    use12h={use12h}
                  />
                </div>
                <div className="lg:col-span-1">
                  <ParticipantPanel
                    participants={room.participants}
                    selectedParticipant={selectedParticipant}
                    onParticipantSelect={setSelectedParticipant}
                    isResultsMode={true}
                    isHost={isHost}
                    currentParticipantId={currentParticipantId}
                    onDeleteParticipant={(id) => deleteParticipantMutation.mutate(id)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Sticky save button — mobile, when unsaved changes exist */}
      {isMobile && hasUnsavedChanges && currentView === "select" && currentParticipantId && (() => {
        const selectedCount = selectedAvailability.filter(v => v >= 1).length;
        const sm = room.slotMinutes ?? 60;
        const hrs = ((selectedCount * sm) / 60).toFixed(1).replace(/\.0$/, '');
        return (
          <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 bg-background/95 backdrop-blur border-t border-border supports-[backdrop-filter]:bg-background/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs px-0.5">
              <span className="text-muted-foreground">
                {t('timeGrid.slotsSelected', { count: selectedCount })}
                {selectedCount > 0 && ` · ${hrs}h`}
              </span>
              <span className="text-amber-500 font-medium">{t('room.unsavedChanges')}</span>
            </div>
            <Button
              onClick={handleSaveAvailability}
              className="w-full h-11 font-semibold text-sm"
              disabled={updateAvailabilityMutation.isPending}
            >
              {updateAvailabilityMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full w-4 h-4" />
                  {t('common.saving')}
                </span>
              ) : (
                t('room.saveAvailability')
              )}
            </Button>
          </div>
        );
      })()}

      {/* Join Room Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t('room.joinDialog.title', { roomName: room.name })}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t('room.joinDialog.desc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinRoom} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">{t('room.joinDialog.yourName')}</Label>
              <Input
                id="name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder={t('room.joinDialog.namePlaceholder')}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('room.joinDialog.timezone')}</Label>
              <TimezoneSelector
                value={participantTimezone}
                onChange={setParticipantTimezone}
              />
            </div>
            <Button type="submit" className="w-full" disabled={joinRoomMutation.isPending}>
              {joinRoomMutation.isPending ? t('common.joining') : t('room.joinDialog.joinButton')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <BugReport position="bottom" />

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t('room.unsavedDialog.title')}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t('room.unsavedDialog.desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowUnsavedDialog(false)}>
              {t('room.unsavedDialog.stay')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                setShowUnsavedDialog(false);
                setHasUnsavedChanges(false);
                if (pendingViewChange) {
                  setCurrentView(pendingViewChange);
                  setPendingViewChange(null);
                }
              }}
            >
              {t('room.unsavedDialog.discard')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t('room.qrCode')}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t('room.qrCodeDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="p-3 bg-white rounded-lg">
              <QRCode value={shareUrl} size={200} />
            </div>
          </div>
          <div className="pb-2">
            <p className="text-xs text-muted-foreground text-center mb-3">{t('room.qrCodeDesc')}</p>
            <Button className="w-full" variant="outline" onClick={handleCopyUrl}>
              <Copy className="h-3.5 w-3.5 mr-2" />
              {t('room.shareBanner.copyLink')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={showEditRoomDialog} onOpenChange={setShowEditRoomDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t('room.editRoomDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('room.editRoomDialog.roomName')}</Label>
              <Input
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                placeholder={t('room.editRoomDialog.roomName')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('room.editRoomDialog.description')} <span className="text-muted-foreground font-normal">{t('room.editRoomDialog.descriptionOptional')}</span></Label>
              <Textarea
                value={editRoomDescription}
                onChange={(e) => setEditRoomDescription(e.target.value)}
                placeholder={t('room.editRoomDialog.descPlaceholder')}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowEditRoomDialog(false)}>{t('common.cancel')}</Button>
            <Button
              className="flex-1"
              onClick={() => updateRoomMutation.mutate({ name: editRoomName, description: editRoomDescription })}
              disabled={updateRoomMutation.isPending || !editRoomName.trim()}
            >
              {updateRoomMutation.isPending ? t('common.saving') : t('room.editRoomDialog.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Time Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t('room.confirmDialog.title')}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t('room.confirmDialog.desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleConfirmSlotConfirmed} disabled={confirmTimeMutation.isPending}>
              {confirmTimeMutation.isPending ? t('common.confirming') : t('room.confirmDialog.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
