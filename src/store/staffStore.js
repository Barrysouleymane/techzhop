import { create } from "zustand";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/config/constants";

const NONE = { admin: false, driver: false, role: "customer", country: null, owner: false, permissions: [] };

// What the logged-in user may do in the admin area (asked to the server)
const useStaffStore = create((set) => ({
  ...NONE,
  loaded: false,
  userId: null,

  load: async (userId) => {
    if (!userId) return set({ ...NONE, loaded: true, userId: null });
    try {
      const { data } = await supabase.auth.getSession();
      const res = await axios.get(`${API_URL}/admin/me`, {
        headers: { Authorization: `Bearer ${data.session?.access_token}` },
      });
      set({ ...NONE, ...res.data, loaded: true, userId });
    } catch {
      set({ ...NONE, loaded: true, userId });
    }
  },
}));

export default useStaffStore;
