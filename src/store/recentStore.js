import { create } from "zustand";
import { persist } from "zustand/middleware";

// Products the visitor looked at (most recent first)
const useRecentStore = create(
  persist(
    (set) => ({
      ids: [],
      add: (id) => set((s) => ({ ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, 12) })),
    }),
    { name: "techzhop-recent" }
  )
);

export default useRecentStore;
