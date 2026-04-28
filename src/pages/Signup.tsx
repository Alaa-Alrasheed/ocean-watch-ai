import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Fish, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const Signup = () => {
  const [gender, setGender] = useState("");
  const [genderOpen, setGenderOpen] = useState(false);
  const genderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (genderRef.current && !genderRef.current.contains(e.target as Node)) {
        setGenderOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedLabel =
    GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? "Select";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4 teal-glow">
            <Fish className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join BioReef.ai</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="bg-muted/30 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" className="bg-muted/30 border-border/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+971..." className="bg-muted/30 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <div className="relative" ref={genderRef}>
                <button
                  id="gender"
                  type="button"
                  onClick={() => setGenderOpen((o) => !o)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                >
                  <span className={gender ? "text-foreground" : "text-muted-foreground"}>
                    {selectedLabel}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                      genderOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {genderOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-muted/30 backdrop-blur-md border border-border/50 rounded-md overflow-hidden shadow-lg">
                    {GENDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setGender(opt.value);
                          setGenderOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          opt.value === gender
                            ? "bg-primary/20 text-primary"
                            : "text-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org">Organization</Label>
            <Input id="org" placeholder="University / Institution" className="bg-muted/30 border-border/50" />
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" className="accent-primary mt-0.5" />
            <span>
              I accept the{" "}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-primary hover:underline focus:outline-none"
                  >
                    Terms &amp; Conditions
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Terms &amp; Conditions</DialogTitle>
                    <DialogDescription>
                      Last updated: April 2026
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                    <section>
                      <h3 className="font-semibold mb-1">1. Acceptance of Terms</h3>
                      <p>
                        By creating an account on the BioReef.ai dashboard, you agree to be
                        bound by these Terms &amp; Conditions. If you do not agree to any part
                        of these terms, you must not register for or use the platform.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">2. Nature of the Service</h3>
                      <p>
                        BioReef.ai is an academic research platform that uses computer vision
                        and machine learning to detect, classify, and track fish species in
                        underwater video footage for the purpose of biodiversity assessment.
                        Predictions are generated by AI models and are provided for research
                        and informational purposes only. They are not guaranteed to be accurate
                        and must not be used as the sole basis for regulatory, commercial,
                        ecological, or fisheries-management decisions.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">3. Account Registration</h3>
                      <p>
                        You agree to provide accurate, current, and complete information during
                        registration, including a valid email address, phone number, and your
                        affiliated organization. You are responsible for maintaining the
                        confidentiality of your password and for all activities that occur
                        under your account.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">4. Personal Data &amp; Privacy</h3>
                      <p>
                        We collect the personal information you provide (email, phone, gender,
                        organization) solely for the purposes of authentication, account
                        management, and aggregate research analytics. Your data will not be
                        sold to third parties. You may request deletion of your account and
                        associated personal data at any time by contacting the project team.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">5. Acceptable Use</h3>
                      <p>
                        You agree not to (a) upload content you do not have the right to share,
                        (b) attempt to reverse-engineer, scrape, or disrupt the service, (c)
                        use the platform for unlawful purposes, or (d) misrepresent the
                        outputs of the system as expert taxonomic identification. Violation of
                        these terms may result in suspension or termination of your account.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">6. Intellectual Property</h3>
                      <p>
                        All software, models, model weights, dashboards, datasets owned by the
                        project, and visual designs comprising BioReef.ai remain the property
                        of the BioReef.ai project team and the host institution. Footage that
                        you upload remains your property; by uploading you grant the project a
                        non-exclusive, royalty-free license to process the footage for the
                        purpose of providing the service to you.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">7. Disclaimer of Warranties</h3>
                      <p>
                        The service is provided on an "as is" and "as available" basis without
                        warranties of any kind, express or implied. The project team does not
                        warrant that the service will be uninterrupted, error-free, or that
                        species classifications will be correct. Use of the platform is at
                        your own risk.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">8. Limitation of Liability</h3>
                      <p>
                        To the fullest extent permitted by law, the BioReef.ai project team,
                        contributors, and affiliated institutions shall not be liable for any
                        indirect, incidental, special, consequential, or punitive damages
                        arising out of your use of the platform, including but not limited to
                        loss of data, ecological misclassification, or research outcomes
                        derived from platform outputs.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">9. Modifications to the Service</h3>
                      <p>
                        We reserve the right to modify, suspend, or discontinue any part of the
                        service at any time, including the underlying machine-learning models.
                        Material changes to these Terms will be communicated to registered
                        users via email.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">10. Governing Law</h3>
                      <p>
                        These Terms are governed by the laws of the United Arab Emirates. Any
                        disputes arising out of or in connection with these Terms shall be
                        subject to the exclusive jurisdiction of the competent courts of the
                        UAE.
                      </p>
                    </section>

                    <section>
                      <h3 className="font-semibold mb-1">11. Contact</h3>
                      <p>
                        For questions about these Terms or to request data removal, contact the
                        project team at the email address provided on the platform's About
                        page.
                      </p>
                    </section>
                  </div>
                </DialogContent>
              </Dialog>
            </span>
          </label>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Sign up
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
