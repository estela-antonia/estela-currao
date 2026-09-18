import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "site-media";
export const DOCS_BUCKET = "site-docs";

export async function uploadMedia(file: File, bucket = MEDIA_BUCKET) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (upErr) throw upErr;

  let width: number | null = null;
  let height: number | null = null;
  if (file.type.startsWith("image/")) {
    try {
      const dims = await readImageDimensions(file);
      width = dims.width;
      height = dims.height;
    } catch {
      // ignore
    }
  }

  const { data, error } = await supabase
    .from("media")
    .insert({
      storage_bucket: bucket,
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      width,
      height,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMedia(id: string, bucket: string, path: string) {
  await supabase.storage.from(bucket).remove([path]);
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) throw error;
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600,
) {
  // Legacy rows store a ready-to-use CDN/absolute URL instead of a storage key.
  if (path.startsWith("/") || path.startsWith("http")) return path;

  const key = `${bucket}::${path}`;
  const cached = urlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = new Promise<string>((resolve, reject) => {
    const queue = pending.get(bucket) ?? [];
    queue.push({ path, resolve, reject });
    pending.set(bucket, queue);
    scheduleFlush(expiresIn);
  }).finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

type Waiter = {
  path: string;
  resolve: (url: string) => void;
  reject: (err: unknown) => void;
};

const urlCache = new Map<string, { url: string; expiresAt: number }>();
const inflight = new Map<string, Promise<string>>();
const pending = new Map<string, Waiter[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(expiresIn: number) {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush(expiresIn);
  }, 40);
}

// Batch signed-URL creation: rendering a media grid otherwise fires one request
// per thumbnail, and the storage API starts failing them under that burst.
async function flush(expiresIn: number) {
  const batches = [...pending.entries()];
  pending.clear();

  for (const [bucket, waiters] of batches) {
    for (let i = 0; i < waiters.length; i += 50) {
      const chunk = waiters.slice(i, i + 50);
      const paths = [...new Set(chunk.map((w) => w.path))];
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrls(paths, expiresIn);
        if (error) throw error;
        const byPath = new Map<string, string>();
        for (const entry of data ?? []) {
          if (entry.path && entry.signedUrl) byPath.set(entry.path, entry.signedUrl);
        }
        for (const w of chunk) {
          const url = byPath.get(w.path);
          if (!url) {
            w.reject(new Error(`No signed URL for ${w.path}`));
            continue;
          }
          urlCache.set(`${bucket}::${w.path}`, {
            url,
            expiresAt: Date.now() + (expiresIn - 60) * 1000,
          });
          w.resolve(url);
        }
      } catch (err) {
        for (const w of chunk) w.reject(err);
      }
    }
  }
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export type MediaRow = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  created_at: string;
};