import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../hooks/useQueries";

interface Props {
  open: boolean;
}

export default function ProfileSetupModal({ open }: Props) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState(
    "I need help! This is an emergency. Please contact me or call for help.",
  );
  const saveProfile = useSaveProfile();

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

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" data-ocid="profile_setup.dialog">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl">
              Welcome to WOMENS ARE OUR PRIDE
            </DialogTitle>
          </div>
          <DialogDescription>
            Set up your profile to get started. Your name helps emergency
            contacts recognize you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="setup-name">Your Name</Label>
            <Input
              id="setup-name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-ocid="profile_setup.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setup-msg">Default Emergency Message</Label>
            <Textarea
              id="setup-msg"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-ocid="profile_setup.textarea"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-teal text-white hover:bg-teal/90"
            disabled={saveProfile.isPending || !name.trim()}
            data-ocid="profile_setup.submit_button"
          >
            {saveProfile.isPending ? "Saving..." : "Get Started"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
