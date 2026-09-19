import type { ReactNode } from "react";
import "@pincommerce/agency-web-ui/styles.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
