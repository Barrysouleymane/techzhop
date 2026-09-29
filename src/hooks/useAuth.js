import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useStaffStore from "@/store/staffStore";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const staff = useStaffStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Ask the server for this user's role (once per user)
  useEffect(() => {
    if (loading) return;
    const id = user?.id || null;
    if (!staff.loaded || staff.userId !== id) staff.load(id);
  }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const staffReady = staff.loaded && staff.userId === (user?.id || null);

  return {
    user,
    session,
    loading: loading || !staffReady,
    isAdmin: staff.admin, // any staff role
    role: staff.role,
    owner: staff.owner,
    can: (permission) => staff.permissions.includes(permission),
  };
}
