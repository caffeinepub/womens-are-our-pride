# WOMENS ARE OUR PRIDE

## Current State
A women's safety app with:
- Panic button / SOS event creation
- Trusted contacts management
- Live location tracking (GPS) with share token
- Audio recording attachment to SOS events
- SOS history page
- User profile with emergency message
- Authorization and blob-storage components

## Requested Changes (Diff)

### Add
- **CCTV Zone Map page**: Displays user's current GPS location on an interactive map. Shows nearby known CCTV camera zones (community-sourced, stored in backend). Users can report/pin new CCTV camera locations. When user is within ~200m of a known CCTV zone, display an alert/badge.
- **Vehicle Journey Log**: A form to log vehicle details before/during a journey (vehicle type, color, plate number, driver name, contact number, ride-share app name). Logs are saved per user and can be attached to an active SOS event. Vehicle logs appear in SOS history.
- Backend: `CctvZone` type with id, lat, lng, description, reportedBy, timestamp. Methods: `reportCctvZone`, `getCctvZones` (public), `deleteCctvZone` (own zones).
- Backend: `VehicleLog` type with id, vehicleType, color, plateNumber, driverName, driverPhone, rideShareApp, timestamp, sosEventId (optional). Methods: `addVehicleLog`, `getVehicleLogs`, `deleteVehicleLog`, `attachVehicleLogToSOS`.

### Modify
- Navigation: add links to CCTV Map page and Vehicle Log page
- Dashboard: show quick access button to Vehicle Log and CCTV Map
- History page: show attached vehicle log details per SOS event

### Remove
- Nothing removed

## Implementation Plan
1. Update backend with CctvZone and VehicleLog types and methods
2. Add CctvMapPage with leaflet/openstreetmap map, CCTV pins, proximity alert
3. Add VehicleLogPage with form to add vehicle details and log list
4. Update navigation and dashboard for new pages
5. Update history page to show vehicle log
