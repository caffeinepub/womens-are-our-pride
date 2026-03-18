import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AppNav from "../components/AppNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface CctvZone {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  reportedBy: string;
  timestamp: number;
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STORAGE_KEY = "womens_pride_cctv_zones";

function loadZones(): CctvZone[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveZones(zones: CctvZone[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
}

declare global {
  interface Window {
    L: any;
  }
}

export default function CctvMapPage() {
  const { identity } = useInternetIdentity();
  const [zones, setZones] = useState<CctvZone[]>(loadZones);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [nearbyAlert, setNearbyAlert] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const zoneMarkersRef = useRef<any[]>([]);
  const principal = identity?.getPrincipal().toString() ?? "anonymous";

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) {
      setMapReady(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);

    return () => {
      // cleanup not needed — reused across navigation
    };
  }, []);

  // Init map once Leaflet is ready
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapRef.current) return;
    const L = window.L;
    const defaultPos: [number, number] = [20.5937, 78.9629];
    const map = L.map(mapContainerRef.current).setView(defaultPos, 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
  }, [mapReady]);

  // Update user position marker
  useEffect(() => {
    if (!mapRef.current || !userPos) return;
    const L = window.L;
    const map = mapRef.current;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    const pulsingIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:18px;height:18px;border-radius:50%;
        background:oklch(56% 0.18 230);border:3px solid white;
        box-shadow:0 0 0 4px oklch(56% 0.18 230 / 0.3);
        animation:pulse 1.5s ease-in-out infinite;
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const marker = L.marker([userPos.lat, userPos.lng], {
      icon: pulsingIcon,
    }).addTo(map);
    marker.bindPopup("<b>Your Location</b>");
    userMarkerRef.current = marker;
    map.setView([userPos.lat, userPos.lng], 15);
  }, [userPos]);

  // Update CCTV zone markers
  useEffect(() => {
    if (!mapRef.current) return;
    const L = window.L;
    const map = mapRef.current;
    for (const m of zoneMarkersRef.current) m.remove();
    zoneMarkersRef.current = [];
    for (const zone of zones) {
      const cameraIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:oklch(58% 0.22 22);border:2px solid white;
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:14px;
        ">📷</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const m = L.marker([zone.latitude, zone.longitude], {
        icon: cameraIcon,
      }).addTo(map);
      m.bindPopup(
        `<b>CCTV Zone</b><br/>${zone.description || "Community reported"}<br/><small>${new Date(zone.timestamp).toLocaleDateString()}</small>`,
      );
      zoneMarkersRef.current.push(m);
    }
  }, [zones]);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError(null);
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true },
    );
  }, []);

  // Check proximity to CCTV zones
  useEffect(() => {
    if (!userPos || zones.length === 0) {
      setNearbyAlert(false);
      return;
    }
    const nearby = zones.some(
      (z) =>
        haversineDistance(userPos.lat, userPos.lng, z.latitude, z.longitude) <=
        200,
    );
    setNearbyAlert(nearby);
  }, [userPos, zones]);

  const handleReport = async () => {
    if (!userPos) {
      toast.error("Location not available. Please enable GPS.");
      return;
    }
    setSubmitting(true);
    const newZone: CctvZone = {
      id: Date.now().toString(),
      latitude: userPos.lat,
      longitude: userPos.lng,
      description: description.trim() || "Community reported CCTV",
      reportedBy: principal,
      timestamp: Date.now(),
    };
    const updated = [newZone, ...zones];
    setZones(updated);
    saveZones(updated);
    setDescription("");
    setShowForm(false);
    setSubmitting(false);
    toast.success("CCTV zone reported successfully!");
  };

  const handleDelete = (zoneId: string) => {
    const updated = zones.filter((z) => z.id !== zoneId);
    setZones(updated);
    saveZones(updated);
    toast.success("CCTV zone removed.");
  };

  return (
    <div className="min-h-screen bg-light-bg">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </a>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sos-red/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-sos-red" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">CCTV Zone Map</h1>
              <p className="text-muted-foreground text-sm">
                View and report surveillance camera locations in your area
              </p>
            </div>
          </div>
        </div>

        {/* Nearby Alert */}
        <AnimatePresence>
          {nearbyAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
              data-ocid="cctv.proximity.panel"
            >
              <Alert className="border-orange-400 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 font-semibold">
                  ⚠️ You are near a CCTV camera zone — you may be on camera
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Geo Error */}
        {geoError && (
          <Alert
            className="mb-4 border-sos-red/30 bg-sos-red/5"
            data-ocid="cctv.geo.error_state"
          >
            <MapPin className="h-4 w-4 text-sos-red" />
            <AlertDescription className="text-sos-red">
              Location unavailable: {geoError}. Map centered at default India
              location.
            </AlertDescription>
          </Alert>
        )}

        {/* Map Container */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal" />
              <span className="font-semibold text-navy text-sm">Live Map</span>
              {userPos && (
                <Badge variant="secondary" className="text-xs">
                  {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              You
              <span className="w-3 h-3 rounded-full bg-sos-red inline-block ml-2" />
              CCTV Zone
            </div>
          </div>
          {!mapReady ? (
            <div
              className="flex items-center justify-center h-96 bg-slate-50"
              data-ocid="cctv.map.loading_state"
            >
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          ) : (
            <div
              ref={mapContainerRef}
              style={{ height: "420px", width: "100%" }}
            />
          )}
        </div>

        {/* Report Button */}
        {identity ? (
          <div className="mb-6">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-navy text-white hover:bg-navy/90"
              data-ocid="cctv.report.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Report CCTV Camera Here
            </Button>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mt-4 bg-white rounded-2xl p-5 shadow-card space-y-4"
                    data-ocid="cctv.report.panel"
                  >
                    <h3 className="font-semibold text-navy">
                      Report CCTV Camera at Your Location
                    </h3>
                    {userPos ? (
                      <p className="text-sm text-muted-foreground">
                        📍 Will be pinned at: {userPos.lat.toFixed(5)},{" "}
                        {userPos.lng.toFixed(5)}
                      </p>
                    ) : (
                      <p className="text-sm text-sos-red">
                        ⚠️ GPS location required to report a zone
                      </p>
                    )}
                    <div className="space-y-1">
                      <Label htmlFor="cctv-desc">Description (optional)</Label>
                      <Input
                        id="cctv-desc"
                        placeholder="e.g. Traffic camera at main junction"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        data-ocid="cctv.report.input"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleReport}
                        disabled={submitting || !userPos}
                        className="bg-sos-red text-white hover:bg-sos-red/90"
                        data-ocid="cctv.report.submit_button"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Submit Report
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowForm(false)}
                        data-ocid="cctv.report.cancel_button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Alert className="mb-6 border-teal/30 bg-teal/5">
            <AlertDescription className="text-teal">
              🔐 Log in to report CCTV camera locations in your area
            </AlertDescription>
          </Alert>
        )}

        {/* CCTV Zone List */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-navy flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Reported CCTV Zones
              <Badge className="ml-1">{zones.length}</Badge>
            </h2>
          </div>
          {zones.length === 0 ? (
            <div
              className="p-10 text-center text-muted-foreground"
              data-ocid="cctv.zones.empty_state"
            >
              <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No CCTV zones reported yet.</p>
              <p className="text-xs mt-1">
                Be the first to report a surveillance camera in your area.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {zones.map((zone, index) => (
                <div
                  key={zone.id}
                  className="p-4 flex items-start justify-between gap-3"
                  data-ocid={`cctv.zones.item.${index + 1}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-sos-red/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Camera className="w-4 h-4 text-sos-red" />
                    </div>
                    <div>
                      <p className="font-medium text-navy text-sm">
                        {zone.description || "Community reported CCTV"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        📍 {zone.latitude.toFixed(5)},{" "}
                        {zone.longitude.toFixed(5)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(zone.timestamp).toLocaleString()}
                      </p>
                      {userPos && (
                        <p className="text-xs text-teal mt-0.5">
                          {haversineDistance(
                            userPos.lat,
                            userPos.lng,
                            zone.latitude,
                            zone.longitude,
                          ) < 1000
                            ? `${Math.round(haversineDistance(userPos.lat, userPos.lng, zone.latitude, zone.longitude))}m away`
                            : `${(haversineDistance(userPos.lat, userPos.lng, zone.latitude, zone.longitude) / 1000).toFixed(1)}km away`}
                        </p>
                      )}
                    </div>
                  </div>
                  {(zone.reportedBy === principal || identity) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(zone.id)}
                      className="text-muted-foreground hover:text-sos-red shrink-0"
                      data-ocid={`cctv.zones.delete_button.${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
