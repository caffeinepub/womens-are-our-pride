import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import InstallPrompt from "./components/InstallPrompt";
import CctvMapPage from "./pages/CctvMapPage";
import ContactsPage from "./pages/ContactsPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import TrackingPage from "./pages/TrackingPage";
import VehicleLogPage from "./pages/VehicleLogPage";

const queryClient = new QueryClient();

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});
const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts",
  component: ContactsPage,
});
const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});
const trackingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/track/$shareToken",
  component: TrackingPage,
});
const cctvMapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cctv-map",
  component: CctvMapPage,
});
const vehicleLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vehicle-log",
  component: VehicleLogPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  contactsRoute,
  historyRoute,
  profileRoute,
  trackingRoute,
  cctvMapRoute,
  vehicleLogRoute,
]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <InstallPrompt />
      <Toaster />
    </QueryClientProvider>
  );
}
