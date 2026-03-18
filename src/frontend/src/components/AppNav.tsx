import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import {
  Bell,
  Camera,
  Car,
  Clock,
  LogOut,
  Menu,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AppNav() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    router.navigate({ to: "/" });
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Bell },
    { to: "/contacts", label: "Contacts", icon: Users },
    { to: "/history", label: "History", icon: Clock },
    { to: "/cctv-map", label: "CCTV Map", icon: Camera },
    { to: "/vehicle-log", label: "Vehicle Log", icon: Car },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <header className="bg-navy sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-sos-red" />
          <span className="font-bold text-lg">
            <span className="text-white">WOMENS ARE OUR </span>
            <span className="text-sos-red">PRIDE</span>
          </span>
        </Link>
        <nav
          className="hidden md:flex items-center gap-1"
          data-ocid="app.nav.panel"
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              activeProps={{ className: "text-white bg-white/15" }}
              data-ocid={`nav.${link.label.toLowerCase().replace(" ", "_")}.link`}
            >
              <link.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{link.label}</span>
            </Link>
          ))}
          {identity && (
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="ml-2 text-white/70 hover:text-white hover:bg-white/10"
              data-ocid="nav.logout.button"
            >
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          )}
        </nav>
        <button
          type="button"
          className="md:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-navy border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
          {identity && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}
