import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Contact, LocationPoint, SOSEvent, UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetContacts() {
  const { actor, isFetching } = useActor();
  return useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getContacts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSOSEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<SOSEvent[]>({
    queryKey: ["sosEvents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSOSEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetEvent(shareToken: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SOSEvent | null>({
    queryKey: ["event", shareToken],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getEvent(shareToken);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!shareToken,
    refetchInterval: 5000,
  });
}

export function useGetActiveLocations(shareToken: string) {
  const { actor, isFetching } = useActor();
  return useQuery<LocationPoint[]>({
    queryKey: ["activeLocations", shareToken],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveLocations(shareToken);
    },
    enabled: !!actor && !isFetching && !!shareToken,
    refetchInterval: 5000,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useAddContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Contact) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addContact(contact);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Contact) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateContact(contact);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useDeleteContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteContact(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}
