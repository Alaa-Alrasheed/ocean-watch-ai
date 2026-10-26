import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

/** Starts a guest session (no sign-up) and opens the upload page. */
export function useGuestEntry() {
  const { signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const enter = async () => {
    setBusy(true);
    try {
      await signInAsGuest();
      navigate("/data-explorer");
    } catch (e) {
      toast({ title: "Couldn't start a guest session", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return { enter, busy };
}
