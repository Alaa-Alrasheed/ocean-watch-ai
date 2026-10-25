import type { ReactNode } from "react";

/** Title block shared by the app pages, in the landing page's type. */
export function PageHeader({ eyebrow, title, children, actions }: {
  eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-tight md:text-5xl">{title}</h1>
        {children && <p className="mt-3 max-w-2xl text-muted-foreground">{children}</p>}
      </div>
      {actions}
    </header>
  );
}
