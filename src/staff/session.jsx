import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { supabase } from "../lib/supabase.js";

// Who's logged in, and whether they're on the staff list. Every dashboard
// page reads this through useStaff().

const StaffContext = createContext(null);

export function StaffSessionProvider({ children }) {
  const [state, setState] = useState({ loading: true, session: null, member: null });

  const loadMember = useCallback(async (session) => {
    if (!session) {
      setState({ loading: false, session: null, member: null });
      return;
    }
    const { data, error } = await supabase
      .from("staff_members")
      .select("user_id, full_name, role")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error) console.error("Couldn't check staff membership:", error);
    setState({ loading: false, session, member: data ?? null });
  }, []);

  useEffect(() => {
    if (!supabase) {
      setState({ loading: false, session: null, member: null });
      return;
    }

    supabase.auth.getSession().then(({ data }) => loadMember(data.session));

    // Fires on log in/out, token refresh, and when someone arrives from an
    // invite or password-reset email.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") {
        setState((current) => ({ ...current, session }));
        return;
      }
      // Supabase warns against awaiting other calls inside this callback
      setTimeout(() => loadMember(session), 0);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadMember]);

  const value = {
    ...state,
    isAdmin: state.member?.role === "admin",
    signOut: () => supabase.auth.signOut(),
  };

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff() {
  return useContext(StaffContext);
}
