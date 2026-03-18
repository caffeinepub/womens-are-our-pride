import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  MapPin,
  Menu,
  Mic,
  Phone,
  Shield,
  Star,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: Phone,
    title: "TRUSTED CONTACTS",
    desc: "Add family and friends. Everyone on your list gets instant SOS notifications with your tracking link.",
  },
  {
    icon: MapPin,
    title: "LIVE LOCATION SHARING",
    desc: "Real-time GPS tracking shared to a secure link. Contacts can follow your location as it updates live.",
  },
  {
    icon: Mic,
    title: "AUDIO RECORDING",
    desc: "Automatically records your surroundings during an SOS. Evidence is securely stored and shareable.",
  },
];

const steps = [
  {
    step: "1",
    title: "Press SOS Button",
    desc: "One large tap activates emergency mode immediately.",
    icon: Bell,
  },
  {
    step: "2",
    title: "Alerts Sent Instantly",
    desc: "All trusted contacts receive an emergency notification with your tracking link.",
    icon: Phone,
  },
  {
    step: "3",
    title: "Stay Tracked & Safe",
    desc: "Your live GPS location updates every few seconds. Contacts watch in real-time.",
    icon: MapPin,
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Teacher, Mumbai",
    quote:
      "WOMENS ARE OUR PRIDE gave me confidence to travel alone. My family gets instant alerts and my location the moment I press the button.",
    avatar: "PS",
  },
  {
    name: "Aisha Khan",
    role: "College Student, Delhi",
    quote:
      "I was followed home one night. One tap and my mom got my location immediately. This app is a lifesaver.",
    avatar: "AK",
  },
  {
    name: "Meera Patel",
    role: "Software Engineer, Bangalore",
    quote:
      "The audio recording feature is brilliant. It captured everything during an incident. So glad I had it installed.",
    avatar: "MP",
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { identity, login, loginStatus, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleAuth = async () => {
    if (identity) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
        router.navigate({ to: "/dashboard" });
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-light-bg font-sans">
      <header className="bg-navy sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-sos-red" />
            <span className="font-bold text-lg">
              <span className="text-white">WOMENS ARE OUR </span>
              <span className="text-sos-red">PRIDE</span>
            </span>
          </div>
          <nav
            className="hidden md:flex items-center gap-6"
            data-ocid="landing.nav.panel"
          >
            {["HOME", "FEATURES", "SUPPORT"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-white/70 hover:text-white text-sm font-medium tracking-wide transition-colors"
                data-ocid={`landing.${item.toLowerCase()}.link`}
              >
                {item}
              </a>
            ))}
            {identity ? (
              <Link
                to="/dashboard"
                className="text-white/70 hover:text-white text-sm font-medium tracking-wide"
                data-ocid="landing.dashboard.link"
              >
                DASHBOARD
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAuth}
                disabled={loginStatus === "logging-in"}
                className="text-white/70 hover:text-white text-sm font-medium tracking-wide disabled:opacity-50"
                data-ocid="landing.login.link"
              >
                {loginStatus === "logging-in" ? "LOGGING IN..." : "LOG IN"}
              </button>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {identity ? (
              <Link to="/dashboard">
                <span
                  className="hidden md:block bg-teal text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal/90 transition-colors cursor-pointer"
                  data-ocid="landing.getapp.button"
                >
                  GO TO APP
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAuth}
                disabled={loginStatus === "logging-in"}
                className="hidden md:block bg-teal text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal/90 disabled:opacity-50"
                data-ocid="landing.getapp.button"
              >
                GET APP
              </button>
            )}
            <button
              type="button"
              className="md:hidden text-white p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-navy border-t border-white/10 px-4 py-3 flex flex-col gap-2">
            {identity ? (
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-white/80 text-sm font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAuth}
                className="text-left px-3 py-2 text-white/80 text-sm font-medium"
              >
                Log In
              </button>
            )}
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="bg-navy rounded-b-[3rem] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
          <motion.div
            className="flex-1 text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-widest">
              <Shield className="w-3.5 h-3.5 text-teal" /> WOMEN&apos;S SAFETY
              APP
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Your Safety,
              <br />
              <span className="text-teal">Our Priority</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-md leading-relaxed">
              One tap sends SOS alerts to all your trusted contacts with your
              live location and audio recording. Stay safe, stay connected.
            </p>
            <div className="relative inline-flex items-center justify-center mb-10">
              <div className="sos-ring-1 absolute w-28 h-28 rounded-full border-2 border-sos-red/30" />
              <div className="sos-ring-2 absolute w-28 h-28 rounded-full border-2 border-sos-red/20" />
              <div className="sos-ring-3 absolute w-28 h-28 rounded-full border-2 border-sos-red/10" />
              <div className="sos-button relative w-24 h-24 rounded-full bg-sos-red flex flex-col items-center justify-center shadow-2xl">
                <Bell className="w-8 h-8 text-white mb-0.5" />
                <span className="text-white font-bold text-sm tracking-widest">
                  SOS
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {identity ? (
                <Link to="/dashboard">
                  <button
                    type="button"
                    className="flex items-center gap-2 bg-sos-red text-white px-7 py-3.5 rounded-full font-semibold hover:bg-sos-red/90 shadow-lg"
                    data-ocid="landing.gethelp.button"
                  >
                    <Bell className="w-4 h-4" /> GET HELP NOW{" "}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleAuth}
                  disabled={loginStatus === "logging-in"}
                  className="flex items-center gap-2 bg-sos-red text-white px-7 py-3.5 rounded-full font-semibold hover:bg-sos-red/90 shadow-lg disabled:opacity-50"
                  data-ocid="landing.gethelp.button"
                >
                  <Bell className="w-4 h-4" />{" "}
                  {loginStatus === "logging-in"
                    ? "LOGGING IN..."
                    : "GET HELP NOW"}{" "}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
          <motion.div
            className="flex-1 flex justify-center md:justify-end relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute inset-0 w-[90%] h-[90%] top-[5%] left-[5%] rounded-full bg-teal/20" />
              <img
                src="/assets/generated/hero-woman.dim_600x700.png"
                alt="Safe woman"
                className="relative z-10 w-72 md:w-96 object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center mb-5">
                <f.icon className="w-7 h-7 text-teal" />
              </div>
              <h3 className="font-bold text-navy text-sm tracking-widest mb-3">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-navy rounded-3xl mx-4 sm:mx-6 py-16 mb-12">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white tracking-widest">
              HOW IT WORKS
            </h2>
            <p className="text-white/60 mt-3">
              Three simple steps to activate emergency protection
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="w-16 h-16 rounded-full bg-teal/20 border-2 border-teal flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-7 h-7 text-teal" />
                </div>
                <div className="text-teal font-bold text-xs tracking-widest mb-2">
                  STEP {s.step}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="support"
        className="max-w-5xl mx-auto px-4 sm:px-6 py-12 mb-12"
      >
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-navy tracking-widest">
            REAL STORIES
          </h2>
          <p className="text-muted-foreground mt-2">
            Women who stayed safe with WOMENS ARE OUR PRIDE
          </p>
        </motion.div>
        <div className="relative">
          <motion.div
            key={activeTestimonial}
            className="bg-white rounded-3xl p-10 shadow-card max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-14 h-14 rounded-full bg-teal flex items-center justify-center mx-auto mb-5 text-white font-bold text-lg">
              {testimonials[activeTestimonial].avatar}
            </div>
            <div className="flex justify-center gap-0.5 mb-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="text-foreground text-base leading-relaxed mb-6 italic">
              &ldquo;{testimonials[activeTestimonial].quote}&rdquo;
            </p>
            <div className="font-bold text-navy">
              {testimonials[activeTestimonial].name}
            </div>
            <div className="text-muted-foreground text-sm">
              {testimonials[activeTestimonial].role}
            </div>
          </motion.div>
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((t, i) => (
              <button
                type="button"
                key={t.name}
                onClick={() => setActiveTestimonial(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === activeTestimonial ? "bg-teal" : "bg-navy/20"}`}
                data-ocid={`testimonial.item.${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-navy py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sos-red" />
            <span className="font-bold text-white">
              WOMENS ARE OUR <span className="text-sos-red">PRIDE</span>
            </span>
          </div>
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:text-teal/80"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
