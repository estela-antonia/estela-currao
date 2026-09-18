import { useEffect, useState } from "react";
import { getSignedUrl } from "@/lib/admin/media";

export function MediaThumb({
  bucket,
  path,
  mime,
  alt,
  className,
}: {
  bucket: string;
  path: string;
  mime?: string | null;
  alt?: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSignedUrl(bucket, path, 3600)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, path]);

  const isImage = !mime || mime.startsWith("image/");
  if (!url) {
    return (
      <div
        className={
          "flex items-center justify-center bg-neutral-100 text-[10px] uppercase tracking-widest text-neutral-400 " +
          (className ?? "aspect-square w-full")
        }
      >
        …
      </div>
    );
  }
  if (!isImage) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={
          "flex items-center justify-center bg-neutral-100 text-xs uppercase tracking-widest text-neutral-600 hover:bg-neutral-200 " +
          (className ?? "aspect-square w-full")
        }
      >
        PDF
      </a>
    );
  }
  return (
    <img
      src={url}
      alt={alt ?? ""}
      className={
        "object-cover " + (className ?? "aspect-square w-full")
      }
      loading="lazy"
    />
  );
}