import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Car,
  ChevronLeft,
  ClipboardCopy,
  Loader2,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import AppNav from "../components/AppNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface VehicleLog {
  id: string;
  vehicleType: string;
  color: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  rideShareApp: string;
  timestamp: number;
}

const STORAGE_KEY = "womens_pride_vehicle_logs";

function loadLogs(): VehicleLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: VehicleLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

const vehicleTypes = ["Car", "Auto-Rickshaw", "Taxi", "Bus", "Bike", "Other"];
const rideShareApps = ["Ola", "Uber", "Rapido", "Other", "None"];

export default function VehicleLogPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const [logs, setLogs] = useState<VehicleLog[]>(loadLogs);
  const [submitting, setSubmitting] = useState(false);

  const [vehicleType, setVehicleType] = useState("");
  const [color, setColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [rideShareApp, setRideShareApp] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) {
      toast.error("Plate number is required.");
      return;
    }
    setSubmitting(true);
    const log: VehicleLog = {
      id: Date.now().toString(),
      vehicleType: vehicleType || "Other",
      color: color.trim(),
      plateNumber: plateNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      rideShareApp: rideShareApp || "None",
      timestamp: Date.now(),
    };
    const updated = [log, ...logs];
    setLogs(updated);
    saveLogs(updated);
    // Reset form
    setVehicleType("");
    setColor("");
    setPlateNumber("");
    setDriverName("");
    setDriverPhone("");
    setRideShareApp("");
    setSubmitting(false);
    toast.success("Vehicle details logged successfully!");
  };

  const handleDelete = (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    saveLogs(updated);
    toast.success("Vehicle log deleted.");
  };

  const handleShare = async (log: VehicleLog) => {
    const text = [
      "🚨 EMERGENCY VEHICLE DETAILS 🚨",
      `Vehicle: ${log.vehicleType} (${log.color || "Unknown color"})`,
      `Plate Number: ${log.plateNumber}`,
      log.driverName ? `Driver: ${log.driverName}` : null,
      log.driverPhone ? `Driver Phone: ${log.driverPhone}` : null,
      log.rideShareApp !== "None" ? `App: ${log.rideShareApp}` : null,
      `Logged at: ${new Date(log.timestamp).toLocaleString()}`,
      "",
      "Sent via WOMENS ARE OUR PRIDE Safety App",
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Emergency details copied to clipboard!");
  };

  const vehicleIcon = (type: string) => {
    const icons: Record<string, string> = {
      Car: "🚗",
      "Auto-Rickshaw": "🛺",
      Taxi: "🚕",
      Bus: "🚌",
      Bike: "🏍️",
      Other: "🚘",
    };
    return icons[type] ?? "🚘";
  };

  if (!identity) {
    return (
      <div className="min-h-screen bg-light-bg">
        <AppNav />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-navy" />
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">Login Required</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Vehicle logging requires you to be signed in for your safety.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="bg-navy text-white hover:bg-navy/90"
            data-ocid="vehicle.login.button"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Sign In
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </a>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">
                Vehicle Journey Log
              </h1>
              <p className="text-muted-foreground text-sm">
                Log vehicle details before boarding for your safety
              </p>
            </div>
          </div>
        </div>

        <Alert className="mb-6 border-teal/40 bg-teal/5">
          <Shield className="h-4 w-4 text-teal" />
          <AlertDescription className="text-teal">
            Always log vehicle details before boarding. In an emergency, use
            "Share for Emergency" to send details to a contact.
          </AlertDescription>
        </Alert>

        {/* Log Form */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-navy flex items-center gap-2">
              <Plus className="w-5 h-5" /> Log New Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger data-ocid="vehicle.type.select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {vehicleIcon(t)} {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="e.g. White, Black, Red"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    data-ocid="vehicle.color.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plate">
                    Plate Number <span className="text-sos-red">*</span>
                  </Label>
                  <Input
                    id="plate"
                    placeholder="e.g. MH 12 AB 3456"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    required
                    data-ocid="vehicle.plate.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="driver-name">Driver Name</Label>
                  <Input
                    id="driver-name"
                    placeholder="Driver's name"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    data-ocid="vehicle.driver_name.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="driver-phone">Driver Phone</Label>
                  <Input
                    id="driver-phone"
                    placeholder="Driver's phone number"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    data-ocid="vehicle.driver_phone.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ride-Share App</Label>
                  <Select value={rideShareApp} onValueChange={setRideShareApp}>
                    <SelectTrigger data-ocid="vehicle.rideshare.select">
                      <SelectValue placeholder="Select app" />
                    </SelectTrigger>
                    <SelectContent>
                      {rideShareApps.map((app) => (
                        <SelectItem key={app} value={app}>
                          {app}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-navy text-white hover:bg-navy/90 mt-2"
                data-ocid="vehicle.log.submit_button"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Car className="w-4 h-4 mr-2" />
                )}
                Log Vehicle Details
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Log List */}
        <div>
          <h2 className="font-semibold text-navy mb-4 flex items-center gap-2">
            <Car className="w-4 h-4" /> My Vehicle Logs
            <Badge>{logs.length}</Badge>
          </h2>
          {logs.length === 0 ? (
            <div
              className="bg-white rounded-2xl p-10 text-center shadow-card text-muted-foreground"
              data-ocid="vehicle.logs.empty_state"
            >
              <Car className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No vehicle logs yet.</p>
              <p className="text-xs mt-1">
                Log vehicle details before your next ride.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5 shadow-card"
                  data-ocid={`vehicle.logs.item.${index + 1}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-2xl leading-none mt-0.5">
                        {vehicleIcon(log.vehicleType)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-navy">
                            {log.plateNumber}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {log.vehicleType}
                          </Badge>
                          {log.color && (
                            <Badge variant="outline" className="text-xs">
                              {log.color}
                            </Badge>
                          )}
                          {log.rideShareApp !== "None" && (
                            <Badge className="text-xs bg-teal/10 text-teal border-teal/20">
                              {log.rideShareApp}
                            </Badge>
                          )}
                        </div>
                        {(log.driverName || log.driverPhone) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.driverName && `👤 ${log.driverName}`}
                            {log.driverName && log.driverPhone && " · "}
                            {log.driverPhone && `📞 ${log.driverPhone}`}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(log)}
                        className="text-teal border-teal/30 hover:bg-teal/5"
                        data-ocid={`vehicle.share.button.${index + 1}`}
                      >
                        <ClipboardCopy className="w-3.5 h-3.5 mr-1" />
                        Share
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(log.id)}
                        className="text-muted-foreground hover:text-sos-red"
                        data-ocid={`vehicle.delete_button.${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <footer className="text-center py-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-navy"
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
