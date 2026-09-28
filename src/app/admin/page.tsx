import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { getContent, storageMode } from "@/lib/content";
import { Editor } from "./editor";

export const metadata: Metadata = { title: "Administrar web", robots: { index: false } };

export default async function AdminPage() {
  await connection();
  await requireAdmin();
  const content = await getContent();
  return <Editor initial={content} mode={storageMode()} />;
}
