import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Camera,
  Car,
  CheckCircle,
  Clock,
  Copy,
  MapPin,
  Mic,
  MicOff,
  Square,
  User,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import AppNav from "../components/AppNav";
import ProfileSetupModal from "../components/ProfileSetupModal";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";

type SOSState = "idle" | "active" | "stopping";

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const router = useRouter();
  const { actor } = useActor();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const [sosState, setSosState] = useState<SOSState>("idle");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const eventIdRef = useRef<string | null>(null);
  const shareTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!identity) router.navigate({ to: "/" });
  }, [identity, router]);

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && !profile;
  const trackingUrl = shareToken
    ? `${window.location.origin}/track/${shareToken}`
    : "";

  const stopTimerAndGeo = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStartSOS = async () => {
    if (!actor) return;
    setSosState("active");
    setElapsed(0);
    setLocationError(null);
    setMicError(null);
    audioChunksRef.current = [];
    const emergencyMessage =
      profile?.emergencyMessage || "I need help! This is an emergency.";
    try {
      const result = await actor.createSOSEvent(emergencyMessage);
      setShareToken(result.shareToken);
      eventIdRef.current = result.id;
      shareTokenRef.current = result.shareToken;
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(
        () =>
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)),
        1000,
      );
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            try {
              if (eventIdRef.current && shareTokenRef.current) {
                await actor.updateLocation(
                  eventIdRef.current,
                  shareTokenRef.current,
                  {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: BigInt(Date.now()),
                  },
                );
              }
            } catch (e) {
              console.error("Location update error", e);
            }
          },
          (err) => setLocationError(err.message),
          { enableHighAccuracy: true, maximumAge: 5000 },
        );
      } else {
        setLocationError("Geolocation not supported");
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(1000);
      } catch (err: any) {
        setMicError(err.message || "Microphone access denied");
      }
      toast.success("SOS activated! Contacts are being notified.");
    } catch (err: any) {
      toast.error(`Failed to start SOS: ${err.message}`);
      setSosState("idle");
    }
  };

  const handleStopSOS = async () => {
    if (!actor || !eventIdRef.current || !shareTokenRef.current) return;
    setSosState("stopping");
    stopTimerAndGeo();
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      await new Promise<void>((resolve) => {
        if (!mediaRecorderRef.current) {
          resolve();
          return;
        }
        mediaRecorderRef.current.onstop = async () => {
          if (audioChunksRef.current.length > 0 && eventIdRef.current) {
            try {
              const audioBlob = new Blob(audioChunksRef.current, {
                type: "audio/webm",
              });
              const arrayBuffer = await audioBlob.arrayBuffer();
              const externalBlob = ExternalBlob.fromBytes(
                new Uint8Array(arrayBuffer),
              );
              const blobUrl = externalBlob.getDirectURL();
              await actor.addAudioToEvent(eventIdRef.current, blobUrl);
            } catch (e) {
              console.error("Audio upload error", e);
            }
          }
          resolve();
        };
        mediaRecorderRef.current.stop();
        for (const track of mediaRecorderRef.current.stream.getTracks()) {
          track.stop();
        }
      });
    }
    try {
      await actor.stopEvent(eventIdRef.current, shareTokenRef.current);
      toast.success("SOS stopped. Stay safe!");
    } catch (e) {
      console.error("Stop event error", e);
    }
    setSosState("idle");
    setShareToken(null);
    eventIdRef.current = null;
    shareTokenRef.current = null;
    setElapsed(0);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const copyLink = async () => {
    if (trackingUrl) {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Tracking link copied!");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-light-bg">
      <AppNav />
      <ProfileSetupModal open={showProfileSetup} />
      <AnimatePresence>
        {sosState === "active" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-sos-red overflow-hidden"
            data-ocid="sos.active.panel"
          >
            <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-white sos-active-blink" />
                <span className="text-white font-bold text-sm tracking-widest sos-active-blink">
                  SOS ACTIVE
                </span>
                <span className="text-white/80 text-sm hidden sm:inline">
                  — Emergency mode is ON
                </span>
              </div>
              <span className="text-white font-mono font-bold">
                {formatTime(elapsed)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-navy mb-2">
            {profile ? `Welcome, ${profile.displayName}` : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Press the SOS button in an emergency
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="relative flex items-center justify-center">
            {sosState === "active" && (
              <>
                <div className="sos-ring-1 absolute w-64 h-64 rounded-full border-4 border-sos-red/30" />
                <div className="sos-ring-2 absolute w-64 h-64 rounded-full border-4 border-sos-red/20" />
                <div className="sos-ring-3 absolute w-64 h-64 rounded-full border-4 border-sos-red/10" />
              </>
            )}
            {sosState === "idle" && (
              <button
                type="button"
                onClick={handleStartSOS}
                className="sos-button sos-active relative w-52 h-52 rounded-full bg-sos-red flex flex-col items-center justify-center shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                data-ocid="sos.primary_button"
                aria-label="Activate SOS Emergency"
              >
                <Bell className="w-16 h-16 text-white mb-1" />
                <span className="text-white font-bold text-2xl tracking-widest">
                  SOS
                </span>
                <span className="text-white/80 text-xs mt-1">
                  TAP FOR EMERGENCY
                </span>
              </button>
            )}
            {sosState === "active" && (
              <button
                type="button"
                onClick={handleStopSOS}
                className="relative w-52 h-52 rounded-full bg-navy flex flex-col items-center justify-center shadow-2xl cursor-pointer hover:bg-navy/80 transition-colors"
                data-ocid="sos.stop.button"
                aria-label="Stop SOS"
              >
                <Square className="w-12 h-12 text-white mb-1" />
                <span className="text-white font-bold text-xl">STOP SOS</span>
                <span className="text-white/60 text-xs mt-1 font-mono">
                  {formatTime(elapsed)}
                </span>
              </button>
            )}
            {sosState === "stopping" && (
              <div
                className="relative w-52 h-52 rounded-full bg-navy/50 flex flex-col items-center justify-center shadow-2xl"
                data-ocid="sos.stopping.loading_state"
              >
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                <span className="text-white/70 text-sm">Stopping SOS...</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {sosState === "active" && shareToken && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-6 shadow-card mb-6 space-y-4"
            >
              <h3 className="font-bold text-navy text-sm tracking-widest">
                ACTIVE SOS DETAILS
              </h3>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin
                    className={`w-4 h-4 ${locationError ? "text-sos-red" : "text-teal"}`}
                  />
                  <span
                    className={locationError ? "text-sos-red" : "text-teal"}
                  >
                    {locationError
                      ? `Location: ${locationError}`
                      : "Location: Tracking"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {micError ? (
                    <>
                      <MicOff className="w-4 h-4 text-sos-red" />
                      <span className="text-sos-red">Mic: {micError}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-teal" />
                      <span className="text-teal">Recording active</span>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  SHARE TRACKING LINK
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={trackingUrl}
                    className="flex-1 text-xs bg-light-bg rounded-lg px-3 py-2 text-muted-foreground font-mono border border-border"
                    data-ocid="sos.tracking.input"
                  />
                  <Button
                    onClick={copyLink}
                    size="sm"
                    className="bg-teal text-white hover:bg-teal/90 shrink-0"
                    data-ocid="sos.copy.button"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              to: "/contacts",
              icon: Users,
              label: "Contacts",
              desc: "Manage contacts",
              color: "text-teal",
              bg: "bg-teal/10 group-hover:bg-teal/20",
            },
            {
              to: "/history",
              icon: Clock,
              label: "History",
              desc: "Past SOS events",
              color: "text-teal",
              bg: "bg-teal/10 group-hover:bg-teal/20",
            },
            {
              to: "/profile",
              icon: User,
              label: "Profile",
              desc: "Emergency settings",
              color: "text-teal",
              bg: "bg-teal/10 group-hover:bg-teal/20",
            },
            {
              to: "/cctv-map",
              icon: Camera,
              label: "CCTV Map",
              desc: "View nearby CCTV zones and report new ones",
              color: "text-sos-red",
              bg: "bg-sos-red/10 group-hover:bg-sos-red/20",
            },
            {
              to: "/vehicle-log",
              icon: Car,
              label: "Vehicle Log",
              desc: "Log vehicle details for your safety",
              color: "text-navy",
              bg: "bg-navy/10 group-hover:bg-navy/20",
            },
          ].map((item) => (
            <a
              key={item.to}
              href={item.to}
              className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow text-center group"
              data-ocid={`dashboard.${item.label.toLowerCase().replace(" ", "_")}.card`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${item.bg}`}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="font-semibold text-navy text-sm">
                {item.label}
              </div>
              <div className="text-muted-foreground text-xs mt-0.5 leading-snug">
                {item.desc}
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
