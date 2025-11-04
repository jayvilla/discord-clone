import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Discord Clone",
  description: "Discord-style chat app built with Next.js & NestJS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-900 text-white h-screen overflow-y-scroll">
        {children}
      </body>
    </html>
  );
}
