import { Link, useLocation, useNavigate } from "react-router-dom";
import { Fish, Menu, X, User as UserIcon, LogOut, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  // Logged-in only. Logged-out users see no tabs at all.
  const links = user
    ? [
        { to: "/", label: "Home" },
        { to: "/data-explorer", label: "Data Explorer" },
        { to: "/dashboard", label: "Dashboard" },
        { to: "/feedback", label: "Feedback" },
      ]
    : [];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    toast({ title: "Signed out" });
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 border-x-0 rounded-none">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center teal-glow">
            <Fish className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            <span className="text-gradient-ocean">BioReef</span>
            <span className="text-muted-foreground text-sm ml-1 font-mono">.ai</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === l.to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pr-2 pl-1 py-1 rounded-full hover:bg-muted/40 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Open profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                  {initials}
                </div>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-muted/30 backdrop-blur-md border border-border/50 rounded-md overflow-hidden shadow-lg z-50">
                  <div className="px-3 py-2 border-b border-border/30">
                    <div className="text-xs text-muted-foreground">Signed in as</div>
                    <div className="text-sm text-foreground truncate">{user.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass-card border-t border-border/50 p-4 space-y-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              {l.label}
            </Link>
          ))}
          <div className={links.length > 0 ? "pt-2 border-t border-border/50" : ""}>
            {loading ? (
              <div className="flex justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : user ? (
              <div className="space-y-2">
                <div className="px-4 py-2 text-xs text-muted-foreground">
                  Signed in as <span className="text-foreground">{user.email}</span>
                </div>
                <Link to="/profile" onClick={() => setOpen(false)} className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <UserIcon className="w-4 h-4" /> Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">Log in</Button>
                </Link>
                <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full bg-primary text-primary-foreground">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
