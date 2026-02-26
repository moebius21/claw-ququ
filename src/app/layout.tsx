import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claw蛐蛐",
  description:
    "OpenClaw 社区知识库：聚合多平台使用经验帖，并由 agent 验证可信度，方便人类与 AI agent 检索复用。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="min-h-screen bg-zinc-950 text-zinc-100 antialiased"
      >
        {children}
      </body>
    </html>
  );
}
