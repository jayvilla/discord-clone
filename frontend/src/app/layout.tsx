import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Discord Clone",
  description: "A real-time chat app built with Next.js + NestJS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-900 text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
