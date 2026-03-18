import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl bg-pink-700 px-4 py-3 shadow-xl">
      <Download className="h-5 w-5 shrink-0 text-white" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">Add to Home Screen</p>
        <p className="text-xs text-pink-200">
          Install this app for quick access in emergencies
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleInstall}
        className="shrink-0"
      >
        Install
      </Button>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-pink-200 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
