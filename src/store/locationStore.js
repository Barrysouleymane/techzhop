import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAddresses } from "@/api/account";

// Where the customer wants delivery ("Deliver to …" in the top bar)
// choice: { type: "address", id } | { type: "zip", country, zip } | null (= default address / device region)
const useLocationStore = create(
  persist(
    (set) => ({
      choice: null,
      addresses: [],
      open: false,
      setChoice: (choice) => set({ choice }),
      setOpen: (open) => set({ open }),
      loadAddresses: async (userId) => {
        if (!userId) return set({ addresses: [] });
        try {
          set({ addresses: await getAddresses(userId) });
        } catch {
          // keep what we had
        }
      },
    }),
    { name: "techzhop-location", partialize: (s) => ({ choice: s.choice }) }
  )
);

export default useLocationStore;
