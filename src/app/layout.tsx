import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contas — O teu dinheiro, com clareza",
  description: "Controlo simples e privado das tuas despesas, receitas e poupanças.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
