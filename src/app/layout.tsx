import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProposalPro — Create Professional Proposals in Minutes",
  description: "Browse 10+ professional proposal templates, customize with your details, and download a beautiful PDF. Free to start.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900">{children}</body>
    </html>
  );
}
