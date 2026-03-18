import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  type Contact = {
    id : Text;
    name : Text;
    phone : Text;
    note : Text;
  };

  type LocationPoint = {
    latitude : Float;
    longitude : Float;
    accuracy : Float;
    timestamp : Int;
  };

  // SOSEvent is unchanged from original to preserve stable variable compatibility
  type SOSEvent = {
    id : Text;
    shareToken : Text;
    startTime : Int;
    endTime : ?Int;
    locationHistory : [LocationPoint];
    audioBlobIds : [Text];
    isActive : Bool;
    emergencyMessage : Text;
  };

  type UserProfile = {
    displayName : Text;
    emergencyMessage : Text;
  };

  type CctvZone = {
    id : Text;
    latitude : Float;
    longitude : Float;
    description : Text;
    reportedBy : Principal;
    timestamp : Int;
  };

  type VehicleLog = {
    id : Text;
    vehicleType : Text;
    color : Text;
    plateNumber : Text;
    driverName : Text;
    driverPhone : Text;
    rideShareApp : Text;
    timestamp : Int;
    sosEventId : ?Text;
  };

  module LocationPoint {
    public func compareByTimestamp(a : LocationPoint, b : LocationPoint) : Order.Order {
      Nat.compare(a.timestamp.toNat(), b.timestamp.toNat());
    };
  };

  // Shared In-Memory State
  let users = Map.empty<Principal, UserProfile>();
  let contacts = Map.empty<Principal, Map.Map<Text, Contact>>();
  let sosEvents = Map.empty<Principal, Map.Map<Text, SOSEvent>>();
  let activeEvents = Map.empty<Text, Principal>();
  let cctvZones = Map.empty<Text, CctvZone>();
  let vehicleLogs = Map.empty<Principal, Map.Map<Text, VehicleLog>>();

  let accessControlState = AccessControl.initState();
  include MixinStorage();
  include MixinAuthorization(accessControlState);

  // User Profile
  public query ({ caller }) func getCallerUserProfile() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (profile.displayName.isEmpty()) { Runtime.trap("Display name cannot be empty") };
    users.add(caller, profile);
  };

  // Trusted Contacts
  public shared ({ caller }) func addContact(contact : Contact) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add contacts");
    };
    if (contact.name.isEmpty() or contact.phone.isEmpty()) {
      Runtime.trap("Name and phone are required");
    };

    let userContacts = switch (contacts.get(caller)) {
      case (?existing) { existing };
      case (null) { Map.empty<Text, Contact>() };
    };

    if (userContacts.containsKey(contact.id)) { Runtime.trap("Contact already exists") };

    userContacts.add(contact.id, contact);
    contacts.add(caller, userContacts);
    contact.id;
  };

  public shared ({ caller }) func updateContact(contact : Contact) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update contacts");
    };
    let userContacts = switch (contacts.get(caller)) {
      case (?existing) { existing };
      case (null) { Runtime.trap("Contact not found") };
    };

    if (not (userContacts.containsKey(contact.id))) {
      Runtime.trap("Contact not found");
    };

    userContacts.add(contact.id, contact);
    contacts.add(caller, userContacts);
  };

  public shared ({ caller }) func deleteContact(contactId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete contacts");
    };
    let userContacts = switch (contacts.get(caller)) {
      case (?existing) { existing };
      case (null) { Runtime.trap("Contact not found") };
    };

    if (not (userContacts.containsKey(contactId))) {
      Runtime.trap("Contact not found");
    };

    userContacts.remove(contactId);
    contacts.add(caller, userContacts);
  };

  public query ({ caller }) func getContacts() : async [Contact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contacts");
    };
    switch (contacts.get(caller)) {
      case (?userContacts) {
        userContacts.values().toArray();
      };
      case (null) { [] };
    };
  };

  // SOS Events
  public shared ({ caller }) func createSOSEvent(emergencyMessage : Text) : async {
    id : Text;
    shareToken : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create SOS events");
    };
    if (emergencyMessage.isEmpty()) { Runtime.trap("Emergency message cannot be empty") };

    let id = Time.now().toText();
    let shareToken = (Time.now() + 1).toText();

    let newEvent : SOSEvent = {
      id;
      shareToken;
      startTime = Time.now();
      endTime = null;
      locationHistory = [];
      audioBlobIds = [];
      isActive = true;
      emergencyMessage;
    };

    let userEvents = switch (sosEvents.get(caller)) {
      case (?existing) { existing };
      case (null) { Map.empty<Text, SOSEvent>() };
    };

    userEvents.add(id, newEvent);
    sosEvents.add(caller, userEvents);
    activeEvents.add(shareToken, caller);

    { id; shareToken };
  };

  public shared ({ caller }) func updateLocation(eventId : Text, shareToken : Text, location : LocationPoint) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update location");
    };
    let owner = switch (activeEvents.get(shareToken)) {
      case (null) { Runtime.trap("Active event not found") };
      case (?p) { p };
    };

    if (caller != owner) {
      Runtime.trap("Unauthorized: Can only update your own events");
    };

    let userEvents = switch (sosEvents.get(owner)) {
      case (?existing) { existing };
      case (null) { Runtime.trap("Event not found") };
    };

    let event = switch (userEvents.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?e) { e };
    };

    if (not event.isActive) { Runtime.trap("Event is not active") };

    let updatedEvent : SOSEvent = {
      event with locationHistory = event.locationHistory.concat([location]);
    };

    userEvents.add(eventId, updatedEvent);
    sosEvents.add(owner, userEvents);
    shareToken;
  };

  public shared ({ caller }) func addAudioToEvent(eventId : Text, audioBlobId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add audio");
    };
    switch (sosEvents.get(caller)) {
      case (?userEvents) {
        switch (userEvents.get(eventId)) {
          case (?event) {
            if (not event.isActive) {
              Runtime.trap("Event is not active");
            };
            let updatedEvent : SOSEvent = {
              event with audioBlobIds = event.audioBlobIds.concat([audioBlobId]);
            };
            userEvents.add(eventId, updatedEvent);
          };
          case (null) { Runtime.trap("Event not found") };
        };
      };
      case (null) { Runtime.trap("Event not found") };
    };
  };

  public shared ({ caller }) func stopEvent(eventId : Text, shareToken : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can stop events");
    };
    let owner = switch (activeEvents.get(shareToken)) {
      case (null) { Runtime.trap("Active event not found") };
      case (?p) { p };
    };

    if (caller != owner) {
      Runtime.trap("Unauthorized: Can only stop your own events");
    };

    switch (sosEvents.get(owner)) {
      case (?userEvents) {
        switch (userEvents.get(eventId)) {
          case (?event) {
            if (not event.isActive) { Runtime.trap("Event is not active") };
            let updatedEvent : SOSEvent = {
              event with isActive = false;
              endTime = ?Time.now();
            };
            userEvents.add(eventId, updatedEvent);
            activeEvents.remove(shareToken);
            shareToken;
          };
          case (null) { Runtime.trap("Event not found") };
        };
      };
      case (null) { Runtime.trap("Event not found") };
    };
  };

  public query ({ caller }) func getSOSEvents() : async [SOSEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their SOS history");
    };
    switch (sosEvents.get(caller)) {
      case (null) { [] };
      case (?userEvents) { userEvents.values().toArray() };
    };
  };

  // Public tracking - no auth required (guests allowed)
  public query func getActiveLocations(shareToken : Text) : async [LocationPoint] {
    let owner = switch (activeEvents.get(shareToken)) {
      case (null) { Runtime.trap("Active event not found") };
      case (?p) { p };
    };

    switch (sosEvents.get(owner)) {
      case (null) { [] };
      case (?userEvents) {
        switch (userEvents.get(shareToken)) {
          case (null) { [] };
          case (?event) { event.locationHistory };
        };
      };
    };
  };

  // Public tracking - no auth required (guests allowed)
  public query func getEvent(shareToken : Text) : async SOSEvent {
    let owner = switch (activeEvents.get(shareToken)) {
      case (null) { Runtime.trap("Event not found") };
      case (?p) { p };
    };

    switch (sosEvents.get(owner)) {
      case (null) { Runtime.trap("Event not found") };
      case (?userEvents) {
        switch (userEvents.get(shareToken)) {
          case (null) { Runtime.trap("Event not found") };
          case (?event) { event };
        };
      };
    };
  };

  public query ({ caller }) func getLocations(eventId : Text) : async [LocationPoint] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their event locations");
    };
    switch (sosEvents.get(caller)) {
      case (null) { [] };
      case (?userEvents) {
        switch (userEvents.get(eventId)) {
          case (null) { [] };
          case (?event) { event.locationHistory.sort(LocationPoint.compareByTimestamp) };
        };
      };
    };
  };

  // CCTV Zones - public read, authenticated write
  public shared ({ caller }) func reportCctvZone(latitude : Float, longitude : Float, description : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can report CCTV zones");
    };
    let id = Time.now().toText();
    let zone : CctvZone = {
      id;
      latitude;
      longitude;
      description;
      reportedBy = caller;
      timestamp = Time.now();
    };
    cctvZones.add(id, zone);
    id;
  };

  public query func getCctvZones() : async [CctvZone] {
    cctvZones.values().toArray();
  };

  public shared ({ caller }) func deleteCctvZone(zoneId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (cctvZones.get(zoneId)) {
      case (null) { Runtime.trap("Zone not found") };
      case (?zone) {
        if (zone.reportedBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own reported zones");
        };
        cctvZones.remove(zoneId);
      };
    };
  };

  // Vehicle Logs
  public shared ({ caller }) func addVehicleLog(log : VehicleLog) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add vehicle logs");
    };
    let userLogs = switch (vehicleLogs.get(caller)) {
      case (?existing) { existing };
      case (null) { Map.empty<Text, VehicleLog>() };
    };
    userLogs.add(log.id, log);
    vehicleLogs.add(caller, userLogs);
    log.id;
  };

  public query ({ caller }) func getVehicleLogs() : async [VehicleLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vehicle logs");
    };
    switch (vehicleLogs.get(caller)) {
      case (null) { [] };
      case (?userLogs) { userLogs.values().toArray() };
    };
  };

  public shared ({ caller }) func deleteVehicleLog(logId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (vehicleLogs.get(caller)) {
      case (null) { Runtime.trap("Log not found") };
      case (?userLogs) {
        if (not userLogs.containsKey(logId)) { Runtime.trap("Log not found") };
        userLogs.remove(logId);
      };
    };
  };

  public shared ({ caller }) func attachVehicleLogToSOS(logId : Text, eventId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let userLogs = switch (vehicleLogs.get(caller)) {
      case (null) { Runtime.trap("Log not found") };
      case (?l) { l };
    };
    let log = switch (userLogs.get(logId)) {
      case (null) { Runtime.trap("Log not found") };
      case (?l) { l };
    };
    // Store the SOS event reference on the vehicle log side only
    let updatedLog : VehicleLog = { log with sosEventId = ?eventId };
    userLogs.add(logId, updatedLog);
  };
};
