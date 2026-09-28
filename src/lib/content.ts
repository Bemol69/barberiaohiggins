import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import { defaultContent } from "@/content/defaults";
import { contentSchema, type SiteContent } from "@/content/schema";

export const CONTENT_TAG = "site-content";
const BLOB_PATH = "content/site.json";
const LOCAL_FILE = path.join(process.cwd(), ".data", "content.json");

/**
 * Dónde se guardan los cambios del admin:
 * - "blob":     Vercel Blob (producción; se activa al conectar un Blob store al proyecto)
 * - "file":     archivo local .data/content.json (desarrollo)
 * - "readonly": desplegado sin Blob → la web muestra el contenido por defecto y no se puede guardar
 */
export type StorageMode = "blob" | "file" | "readonly";

export function storageMode(): StorageMode {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return "blob";
  if (process.env.VERCEL) return "readonly";
  return "file";
}

async function readRaw(): Promise<unknown | null> {
  const mode = storageMode();
  if (mode === "blob") {
    const res = await get(BLOB_PATH, { access: "public", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text());
  }
  if (mode === "file") {
    try {
      return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8"));
    } catch {
      return null;
    }
  }
  return null;
}

async function loadContent(): Promise<SiteContent> {
  try {
    const raw = await readRaw();
    if (!raw) return defaultContent;
    const parsed = contentSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    console.error("Contenido guardado inválido, se usa el contenido por defecto:", parsed.error.issues[0]);
  } catch (err) {
    console.error("No se pudo leer el contenido guardado:", err);
  }
  return defaultContent;
}

export const getContent = unstable_cache(loadContent, ["site-content-v1"], {
  tags: [CONTENT_TAG],
  revalidate: 3600,
});

export async function writeContent(content: SiteContent): Promise<void> {
  const body = JSON.stringify(content, null, 2);
  const mode = storageMode();
  if (mode === "blob") {
    await put(BLOB_PATH, body, {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return;
  }
  if (mode === "file") {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await fs.writeFile(LOCAL_FILE, body, "utf8");
    return;
  }
  throw new Error(
    "Para guardar cambios, conecta Vercel Blob al proyecto (Vercel → Storage → Create → Blob) y vuelve a desplegar.",
  );
}
