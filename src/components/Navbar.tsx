import { Link, useLocation } from "react-router-dom";
import { Fish, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/upload", label: "Upload" },
  ];

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
          <div className="pt-2 border-t border-border/50 flex gap-2">
            <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full">Log in</Button>
            </Link>
            <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full bg-primary text-primary-foreground">Sign up</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
