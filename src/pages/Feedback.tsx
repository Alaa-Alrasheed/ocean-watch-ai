import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      title: type === "feedback" ? "Feedback Submitted" : "Support Ticket Created",
      description: type === "feedback"
        ? "Thank you for your feedback! It helps improve our marine monitoring system."
        : "Your support ticket has been created. Our team will respond shortly.",
    });
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen gradient-ocean pt-20">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Submit Feedback</h1>
            <p className="text-sm text-muted-foreground">Help us improve BioReef.ai</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          {/* Type Toggle */}
          <div className="flex gap-2 mb-6">
            {(["feedback", "ticket"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                  type === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "ticket" ? "Support Ticket" : t}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={type === "feedback" ? "What's on your mind?" : "Brief description of the issue"}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Describe in detail..."
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {type === "feedback" ? "Submit Feedback" : "Create Ticket"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
