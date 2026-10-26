import { Loader2 } from "lucide-react";
import { useGuestEntry } from "@/hooks/use-guest-entry";

/** "Just trying it out?" escape hatch under the login and sign-up forms. */
const GuestLink = () => {
  const { enter, busy } = useGuestEntry();
  return (
    <p className="text-sm text-muted-foreground">
      Just trying it out?{" "}
      <button type="button" onClick={enter} disabled={busy} className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-60">
        Continue as a guest {busy && <Loader2 className="h-3 w-3 animate-spin" />}
      </button>
    </p>
  );
};

export default GuestLink;
