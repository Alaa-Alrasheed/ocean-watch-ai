import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState<"feedback" | "ticket">("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please log in to submit feedback", variant: "destructive" });
      navigate("/login");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      type,
      subject,
      message,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: type === "feedback" ? "Feedback sent" : "Ticket created",
      description: type === "feedback" ? "Thanks. We read every message." : "We'll reply by email.",
    });
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="stagger mx-auto max-w-2xl space-y-8 px-4 py-10">
        <PageHeader title="Feedback">
          Tell us what worked, what didn't, or open a ticket if something is broken.
        </PageHeader>

        <div className="panel p-6">
          <div className="mb-6 inline-flex rounded-md border border-border p-1" role="tablist">
            {(["feedback", "ticket"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={type === t}
                onClick={() => setType(t)}
                className={`rounded px-4 py-1.5 text-sm transition-colors ${
                  type === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "ticket" ? "Support ticket" : "Feedback"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="border-border/50 bg-muted/30"
                placeholder={type === "feedback" ? "What's it about?" : "What went wrong?"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="resize-none border-border/50 bg-muted/30"
                placeholder={type === "feedback" ? "Details help." : "Steps to reproduce, the video name, what you expected."}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {type === "feedback" ? "Send feedback" : "Create ticket"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
