import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Contact {
    id: string;
    name: string;
    note: string;
    phone: string;
}
export interface LocationPoint {
    latitude: number;
    longitude: number;
    timestamp: bigint;
    accuracy: number;
}
export interface SOSEvent {
    id: string;
    startTime: bigint;
    endTime?: bigint;
    shareToken: string;
    audioBlobIds: Array<string>;
    isActive: boolean;
    locationHistory: Array<LocationPoint>;
    emergencyMessage: string;
}
export interface UserProfile {
    displayName: string;
    emergencyMessage: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAudioToEvent(eventId: string, audioBlobId: string): Promise<void>;
    addContact(contact: Contact): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSOSEvent(emergencyMessage: string): Promise<{
        id: string;
        shareToken: string;
    }>;
    deleteContact(contactId: string): Promise<void>;
    getActiveLocations(shareToken: string): Promise<Array<LocationPoint>>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getContacts(): Promise<Array<Contact>>;
    getEvent(shareToken: string): Promise<SOSEvent>;
    getLocations(eventId: string): Promise<Array<LocationPoint>>;
    getSOSEvents(): Promise<Array<SOSEvent>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    stopEvent(eventId: string, shareToken: string): Promise<string>;
    updateContact(contact: Contact): Promise<void>;
    updateLocation(eventId: string, shareToken: string, location: LocationPoint): Promise<string>;
}
