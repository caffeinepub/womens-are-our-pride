import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@tanstack/react-router";
import { Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppNav from "../components/AppNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useSaveProfile } from "../hooks/useQueries";

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const router = useRouter();
  useEffect(() => {
    if (!identity) router.navigate({ to: "/" });
  }, [identity, router]);
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveProfile();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.displayName);
      setMessage(profile.emergencyMessage);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveProfile.mutateAsync({
        displayName: name.trim(),
        emergencyMessage: message.trim(),
      });
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  if (!identity) return null;
  return (
    <div className="min-h-screen bg-light-bg">
      <AppNav />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy">Profile & Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Customize your emergency message and display name
          </p>
        </div>
        {isLoading ? (
          <div
            className="bg-white rounded-2xl p-8 shadow-card animate-pulse h-64"
            data-ocid="profile.loading_state"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-card"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-teal flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="font-bold text-navy text-lg">
                  {profile?.displayName || "Set your name"}
                </div>
                <div className="text-muted-foreground text-sm">
                  WOMENS ARE OUR PRIDE Member
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Display Name</Label>
                <Input
                  id="p-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  data-ocid="profile.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-msg">Emergency Message</Label>
                <p className="text-xs text-muted-foreground">
                  Shown to contacts when SOS is triggered
                </p>
                <Textarea
                  id="p-msg"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="I need help! This is an emergency."
                  data-ocid="profile.message.textarea"
                />
              </div>
              <div className="bg-light-bg rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Your emergency message is sent to all trusted contacts when
                  you press the SOS button.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-teal text-white hover:bg-teal/90"
                disabled={saveProfile.isPending || !name.trim()}
                data-ocid="profile.save.button"
              >
                {saveProfile.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </motion.div>
        )}
      </main>
    </div>
  );
}
