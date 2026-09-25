import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./globals.css";
import AppShell from "@/components/AppShell";
export const metadata = {
  title: { template: "%s · TDC Match Intelligence", default: "TDC Match Intelligence" },
  description: "A thoughtful workspace for better introductions. Synthetic assessment demo.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
