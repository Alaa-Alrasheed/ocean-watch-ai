import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
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
    <div className="min-h-screen px-4 pt-16">
      <div className="stagger mx-auto max-w-2xl space-y-8 py-10">
        <PageHeader title="Profile" />

        <div className="panel space-y-6 p-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="eyebrow mb-1">{f.label}</dt>
                <dd className="text-sm text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-border pt-4">
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
