import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface Profile {
  email: string;
  phone: string | null;
  gender: string | null;
  organization: string | null;
  created_at: string;
}

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("email, phone, gender, organization, created_at")
        .eq("id", user.id)
        .single();

      if (error) {
        toast({ title: "Failed to load profile", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      setProfile(data);
      setLoading(false);
    };
    load();
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
    navigate("/");
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const fields: { label: string; value: string }[] = [
    { label: "Email", value: profile.email },
    {
      label: "Member since",
      value: new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric",
      }),
    },
    { label: "Phone", value: profile.phone || "—" },
    { label: "Gender", value: profile.gender ? GENDER_LABELS[profile.gender] ?? profile.gender : "—" },
    { label: "Organization", value: profile.organization || "—" },
  ];

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">Your BioReef.ai account</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {fields.map((f) => (
              <div key={f.label}>
                <div className="text-xs text-muted-foreground mb-1">{f.label}</div>
                <div className="text-sm text-foreground">{f.value}</div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border/30">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSignOut}
              className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
