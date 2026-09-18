import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  id?: string;
  title?: string;
  loading?: "lazy" | "eager";
}

export function LazyImage({
  src,
  alt,
  className,
  id,
  title,
  loading = "lazy",
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  return (
    <div id={id} className={cn("relative overflow-hidden bg-neutral-100", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        title={title}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

interface FadeImageProps {
  src: string;
  alt: string;
  className?: string;
  id?: string;
  title?: string;
  loading?: "lazy" | "eager";
  itemProp?: string;
}

export function FadeImage({
  src,
  alt,
  className,
  id,
  title,
  loading = "lazy",
  itemProp,
}: FadeImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  return (
    <img
      ref={imgRef}
      id={id}
      src={src}
      alt={alt}
      title={title}
      loading={loading}
      decoding="async"
      itemProp={itemProp}
      onLoad={() => setLoaded(true)}
      className={cn(
        "opacity-0 transition-opacity duration-700",
        className,
        loaded ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

