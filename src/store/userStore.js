import { create } from "zustand";

const useUserStore = create((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clear: () => set({ profile: null }),
}));

export default useUserStore;
