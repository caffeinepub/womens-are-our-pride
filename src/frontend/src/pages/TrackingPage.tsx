import { Badge } from "@/components/ui/badge";
import { useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Mic,
  RefreshCw,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useGetActiveLocations, useGetEvent } from "../hooks/useQueries";

function formatDate(ts: bigint) {
  return new Date(Number(ts)).toLocaleString();
}

export default function TrackingPage() {
  const { shareToken } = useParams({ from: "/track/$shareToken" });
  const {
    data: event,
    isLoading: eventLoading,
    dataUpdatedAt,
  } = useGetEvent(shareToken);
  const { data: locations = [] } = useGetActiveLocations(shareToken);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const lastLocation = locations[locations.length - 1];

  useEffect(() => {
    if (!dataUpdatedAt) return;
    const update = () =>
      setSecondsAgo(Math.floor((Date.now() - dataUpdatedAt) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);

  const mapUrl = lastLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lastLocation.longitude - 0.005},${lastLocation.latitude - 0.005},${lastLocation.longitude + 0.005},${lastLocation.latitude + 0.005}&layer=mapnik&marker=${lastLocation.latitude},${lastLocation.longitude}`
    : null;

  return (
    <div className="min-h-screen bg-light-bg">
      <header className="bg-navy py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Shield className="w-6 h-6 text-sos-red" />
          <span className="font-bold text-white">
            WOMENS ARE OUR <span className="text-sos-red">PRIDE</span>
          </span>
          <span className="text-white/50 text-sm ml-2">
            — Emergency Tracking
          </span>
        </div>
      </header>
      <main
        className="max-w-3xl mx-auto px-4 sm:px-6 py-10"
        data-ocid="tracking.page"
      >
        {eventLoading && (
          <div className="space-y-4" data-ocid="tracking.loading_state">
            <div className="bg-white rounded-2xl h-32 shadow-card animate-pulse" />
            <div className="bg-white rounded-2xl h-64 shadow-card animate-pulse" />
          </div>
        )}
        {!eventLoading && !event && (
          <div
            className="bg-white rounded-2xl p-12 shadow-card text-center"
            data-ocid="tracking.error_state"
          >
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-navy mb-2">
              Tracking Link Not Found
            </h2>
            <p className="text-muted-foreground">
              This tracking link may be invalid or expired.
            </p>
          </div>
        )}
        {event && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div
              className={`rounded-2xl p-6 shadow-card ${event.isActive ? "bg-sos-red/5 border border-sos-red/20" : "bg-white"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <Badge
                  className={
                    event.isActive
                      ? "bg-sos-red text-white border-0"
                      : "bg-teal/10 text-teal border-teal/20"
                  }
                >
                  {event.isActive ? (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      SOS ACTIVE
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      ENDED
                    </>
                  )}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="w-3 h-3" />
                  Updated {secondsAgo}s ago
                </div>
              </div>
              {event.emergencyMessage && (
                <div className="bg-white rounded-xl p-4 mb-4 border border-border">
                  <p className="text-sm font-medium text-foreground">
                    {event.emergencyMessage}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Started: {formatDate(event.startTime)}
                </div>
                {event.endTime && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Ended: {formatDate(event.endTime)}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {locations.length} location updates
                </div>
              </div>
            </div>
            {lastLocation ? (
              <div
                className="bg-white rounded-2xl shadow-card overflow-hidden"
                data-ocid="tracking.map.panel"
              >
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal" />
                    <span className="font-semibold text-navy text-sm">
                      Last Known Location
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {lastLocation.latitude.toFixed(5)},{" "}
                    {lastLocation.longitude.toFixed(5)}
                  </span>
                </div>
                <iframe
                  title="Live Location"
                  src={mapUrl!}
                  width="100%"
                  height="350"
                  className="block"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="bg-white rounded-2xl p-8 shadow-card text-center"
                data-ocid="tracking.no_location.panel"
              >
                <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Waiting for location data...
                </p>
              </div>
            )}
            {event.audioBlobIds.length > 0 && (
              <div
                className="bg-white rounded-2xl p-6 shadow-card"
                data-ocid="tracking.audio.panel"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Mic className="w-4 h-4 text-teal" />
                  <span className="font-semibold text-navy text-sm">
                    Audio Recordings
                  </span>
                </div>
                <div className="space-y-3">
                  {event.audioBlobIds.map((blobId, i) => (
                    <div key={blobId} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5">
                        {i + 1}.
                      </span>
                      {/* biome-ignore lint/a11y/useMediaCaption: emergency recordings do not have captions */}
                      <audio controls src={blobId} className="flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        WOMENS ARE OUR PRIDE — Emergency Tracking •{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
