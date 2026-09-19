import type { ReactNode } from "react";

export type CommerceFixture =
  | "default"
  | "loading"
  | "empty"
  | "failure"
  | "approval-pending"
  | "payment-failed";

export function ProductCard({
  title,
  priceLabel,
  state = "default",
}: {
  title: string;
  priceLabel: string;
  state?: CommerceFixture;
}) {
  if (state === "loading") {
    return <div className="agency-card">Loading…</div>;
  }

  return (
    <article className="agency-card" data-state={state}>
      <div className="agency-body">{title}</div>
      <div className="agency-title">{priceLabel}</div>
    </article>
  );
}

export function Surface({ children }: { children: ReactNode }) {
  return <section className="agency-surface">{children}</section>;
}
