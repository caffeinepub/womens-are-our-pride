import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, Clock, MapPin, Mic, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { toast } from "sonner";
import type { SOSEvent } from "../backend";
import AppNav from "../components/AppNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetSOSEvents } from "../hooks/useQueries";

function formatDate(ts: bigint) {
  return new Date(Number(ts)).toLocaleString();
}

function formatDuration(start: bigint, end?: bigint) {
  if (!end) return "Ongoing";
  const s = Math.floor(Number(end - start) / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function EventCard({ event, idx }: { event: SOSEvent; idx: number }) {
  const copyLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/track/${event.shareToken}`,
    );
    toast.success("Link copied!");
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="bg-white rounded-2xl p-6 shadow-card"
      data-ocid={`history.item.${idx + 1}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              className={
                event.isActive
                  ? "bg-sos-red text-white border-0"
                  : "bg-teal/10 text-teal border-teal/20"
              }
            >
              {event.isActive ? "ACTIVE" : "ENDED"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(event.startTime)}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={copyLink}
          className="h-8 w-8 text-teal"
          data-ocid={`history.share_button.${idx + 1}`}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
      {event.emergencyMessage && (
        <div className="bg-light-bg rounded-lg px-3 py-2 text-sm text-muted-foreground mb-4 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          {event.emergencyMessage}
        </div>
      )}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          Duration: {formatDuration(event.startTime, event.endTime)}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          {event.locationHistory.length} location points
        </div>
        {event.audioBlobIds.length > 0 && (
          <div className="flex items-center gap-1.5 text-teal">
            <Mic className="w-3.5 h-3.5" />
            {event.audioBlobIds.length} recording
            {event.audioBlobIds.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
      {event.audioBlobIds.length > 0 && (
        <div className="mt-4 space-y-2">
          {event.audioBlobIds.map((blobId) => (
            <div key={blobId} className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-teal shrink-0" />
              {/* biome-ignore lint/a11y/useMediaCaption: emergency recordings do not have captions */}
              <audio controls src={blobId} className="flex-1 h-8" />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function HistoryPage() {
  const { identity } = useInternetIdentity();
  const router = useRouter();
  useEffect(() => {
    if (!identity) router.navigate({ to: "/" });
  }, [identity, router]);
  const { data: events = [], isLoading } = useGetSOSEvents();
  const sorted = [...events].sort((a, b) => Number(b.startTime - a.startTime));
  if (!identity) return null;
  return (
    <div className="min-h-screen bg-light-bg">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy">SOS History</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review past emergency events and recordings
          </p>
        </div>
        {isLoading && (
          <div className="space-y-4" data-ocid="history.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-32 shadow-card animate-pulse"
              />
            ))}
          </div>
        )}
        {!isLoading && sorted.length === 0 && (
          <div
            className="bg-white rounded-2xl p-12 shadow-card text-center"
            data-ocid="history.empty_state"
          >
            <Clock className="w-12 h-12 text-teal/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No SOS events recorded yet. Stay safe!
            </p>
          </div>
        )}
        <div className="space-y-4" data-ocid="history.list">
          {sorted.map((event, i) => (
            <EventCard key={event.id} event={event} idx={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
