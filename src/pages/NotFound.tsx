import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center px-6 pt-16 md:px-10">
      <div className="stagger mx-auto w-full max-w-6xl">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-3 font-display text-5xl md:text-7xl">Nothing down here.</h1>
        <p className="mt-4 text-muted-foreground">
          There is no page at <span className="font-mono text-foreground">{location.pathname}</span>.
        </p>
        <Link to="/" className="mt-8 inline-block">
          <Button>Back to the home page</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
