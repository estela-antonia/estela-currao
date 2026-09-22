import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
// Imágenes de portada servidas desde public/ (funcionan en cualquier hosting).
const HOME_DESKTOP_URL = "/estela_home.webp";
const HOME_MOBILE_URL = "/estela_home_mobile.webp";
const homeAsset = { url: HOME_DESKTOP_URL };
const homeMobileAsset = { url: HOME_MOBILE_URL };
import { getHomeImages } from "@/lib/site-chrome.functions";
import { BASE_URL } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Estela Currao — Visual Artist and Architect" },
      { name: "description", content: "Official site of Estela Currao — visual artist and architect. Contemporary sculpture, painting and photography: Identity, Rhythmic Matrices and more." },
      { name: "keywords", content: "Estela Currao, Estela, Currao, Estela Currao sculpture, Currao sculpture, visual artist, architect, artista visual, arquitecta" },
      { property: "og:title", content: "Estela Currao — Visual Artist and Architect" },
      { property: "og:description", content: "Work of Estela Currao — visual artist and architect. Contemporary sculpture, painting and photography." },
      { property: "og:url", content: "https://estelacurrao.com/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${BASE_URL}${homeAsset.url}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${BASE_URL}${homeAsset.url}` },
    ],
    links: [
      {
        rel: "preload",
        as: "image",
        href: homeAsset.url,
        media: "(min-width: 768px)",
        fetchPriority: "high" as const,
      },
      {
        rel: "preload",
        as: "image",
        href: homeMobileAsset.url,
        media: "(max-width: 767px)",
        fetchPriority: "high" as const,
      },
      { rel: "canonical", href: "https://estelacurrao.com/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${BASE_URL}/#webpage`,
          url: `${BASE_URL}/`,
          name: "Estela Currao — Visual Artist and Architect",
          description:
            "Official site of Estela Currao — visual artist and architect. Contemporary sculpture, painting and photography.",
          inLanguage: "en",
          isPartOf: { "@id": `${BASE_URL}/#website` },
          about: { "@id": `${BASE_URL}/#person` },
          mainEntity: { "@id": `${BASE_URL}/#person` },
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: `${BASE_URL}${homeAsset.url}`,
          },
        }),
      },
    ],
  }),
  component: Index,
});

type Box = { left: number; top: number; width: number; height: number };

function getContentBox(img: HTMLImageElement, fit: "contain" | "cover"): Box | null {
  if (!img.naturalWidth || !img.naturalHeight) return null;
  const rect = img.getBoundingClientRect();
  if (fit === "cover") {
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }
  const intrinsicRatio = img.naturalWidth / img.naturalHeight;
  const elementRatio = rect.width / rect.height;
  let width: number;
  let height: number;
  let left: number;
  let top: number;
  if (elementRatio > intrinsicRatio) {
    height = rect.height;
    width = height * intrinsicRatio;
    left = rect.left + (rect.width - width) / 2;
    top = rect.top;
  } else {
    width = rect.width;
    height = width / intrinsicRatio;
    left = rect.left;
    top = rect.top + (rect.height - height) / 2;
  }
  return { left, top, width, height };
}

function Index() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [desktopBox, setDesktopBox] = useState<Box | null>(null);
  const [mobileBox, setMobileBox] = useState<Box | null>(null);
  const [desktopSrc, setDesktopSrc] = useState<string>(homeAsset.url);
  const [tabletSrc, setTabletSrc] = useState<string>(homeAsset.url);
  const [mobileSrc, setMobileSrc] = useState<string>(homeMobileAsset.url);
  const heroRef = useRef<HTMLImageElement>(null);
  const updateRef = useRef<() => void>(() => {});

  updateRef.current = () => {
    if (heroRef.current) {
      const box = getContentBox(heroRef.current, "cover");
      if (box) {
        setDesktopBox(box);
        setMobileBox(box);
      }
    }
  };

  useEffect(() => {
    const update = () => updateRef.current();
    update();
    const observer = new ResizeObserver(update);
    if (heroRef.current) observer.observe(heroRef.current);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { desktop: d, tablet: t, mobile: m } = await getHomeImages();
        if (cancelled) return;
        if (d) setDesktopSrc(d);
        if (t) setTabletSrc(t);
        else if (d) setTabletSrc(d);
        if (m) setMobileSrc(m);
      } catch {
        // keep the bundled hero images
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnter = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      navigate({ to: "/$category", params: { category: "identity" } });
    }, 650);
  };

  const handleImageLoad = () => updateRef.current();

  // Home ocupa exactamente la pantalla: se bloquea cualquier scroll (incluido el
  // "rubber band" de iOS) mientras esta ruta está montada, y se restaura al salir.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyHeight: body.style.height,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.height = "100%";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.height = prev.bodyHeight;
    };
  }, []);

  const boxStyle = (box: Box | null) => ({
    position: "absolute" as const,
    ...(box
      ? { left: box.left, top: box.top, width: box.width, height: box.height }
      : { inset: 0 }),
  });

  return (
    <main
      className="relative w-full max-w-full overflow-hidden"
      style={{
        height: "100svh",
        maxHeight: "100svh",
        backgroundColor: "#F3F1EC",
      }}
    >
      <h1 className="sr-only">
        Estela Currao — Visual Artist and Architect. Sculpture, painting and
        photography by Estela Currao.
      </h1>
      <p className="sr-only">
        Official site of Estela Currao, a visual artist and architect whose work
        spans contemporary sculpture, painting and photography. Explore the
        series: Identity, Rhythmic Matrices, Intersections and Spaces of
        Perception.
      </p>
      <button
        type="button"
        onClick={handleEnter}
        tabIndex={-1}
        aria-hidden="true"
        className="block h-full w-full cursor-pointer focus:outline-none"
        style={{
          opacity: leaving ? 0 : 1,
          transition: "opacity 700ms ease-in-out",
        }}
      >
        {/* Una sola descarga por dispositivo: el navegador elige la fuente que
            corresponde al breakpoint en vez de bajar las tres. */}
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileSrc} />
          <source media="(max-width: 1023px)" srcSet={tabletSrc} />
          <img
            ref={heroRef}
            src={desktopSrc}
            alt="Estela Currao — Visual Artist"
            draggable={false}
            fetchPriority="high"
            decoding="async"
            onLoad={handleImageLoad}
            className="block h-full w-full object-cover"
            style={{ transition: "opacity 700ms ease-in-out" }}
          />
        </picture>
      </button>

      {/* Ultra-discreet entry cue */}
      <div
        className="absolute bottom-4 right-5 md:bottom-6 md:right-8"
        style={{
          opacity: leaving ? 0 : 1,
          transition: "opacity 700ms ease-in-out",
        }}
      >
        <button
          type="button"
          onClick={handleEnter}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
              event.preventDefault();
              handleEnter();
            }
          }}
          aria-label="Enter the gallery of works by Estela Currao"
          className="group cursor-pointer lowercase text-white opacity-80 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontWeight: 300,
            fontSize: "clamp(13px, 1.3vw, 17px)",
            letterSpacing: "0.36em",
            paddingBottom: "3px",
            borderBottom: "1px solid currentColor",
            mixBlendMode: "difference",
          }}
        >
          enter
        </button>
      </div>

      {/* Overlay: name + disciplines positioned relative to the actual image
          content box so it never falls into the letterbox/white bars outside
          the home image. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          opacity: leaving ? 0 : 1,
          transition: "opacity 700ms ease-in-out",
        }}
      >
        <div className="absolute" style={boxStyle(desktopBox)}>
          <div
            className="absolute inline-flex flex-col justify-between overflow-hidden"
            style={{
              left: "6.3%",
              top: "74%",
              bottom: "8%",
              maxWidth: "87vw",
            }}
          >
            <span
              className="block"
              style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontWeight: 200,
                fontSize: "min(clamp(18px, 3.75vw, 48px), calc(87vw / 5.5))",
                letterSpacing: "0.025em",
                lineHeight: 1,
                whiteSpace: "nowrap",
                maxWidth: "87vw",
                overflow: "hidden",
              }}
            >
              Estela Currao
            </span>
            <span
              className="flex w-full items-center lowercase"
              style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontWeight: 200,
                fontSize: "clamp(10px, 1.15vw, 15px)",
                letterSpacing: "0.075em",
              }}
            >
              <span className="shrink-0">sculpture</span>
              <span className="flex-1 text-center">&nbsp;-&nbsp;</span>
              <span className="shrink-0">painting</span>
              <span className="flex-1 text-center">&nbsp;-&nbsp;</span>
              <span className="shrink-0">photography</span>
            </span>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block md:hidden"
        style={{
          opacity: leaving ? 0 : 1,
          transition: "opacity 700ms ease-in-out",
        }}
      >
        <div className="absolute" style={boxStyle(mobileBox)}>
          <div
            className="absolute inline-flex flex-col overflow-hidden"
            style={{
              left: "5.8%",
              top: "10%",
              maxWidth: "88vw",
            }}
          >
            <span
              className="block"
              style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontWeight: 200,
                fontSize: "min(clamp(15px, 4.8vw, 22px), calc(88vw / 5.5))",
                letterSpacing: "0.025em",
                lineHeight: 1,
                whiteSpace: "nowrap",
                maxWidth: "88vw",
                overflow: "hidden",
              }}
            >
              Estela Currao
            </span>
          </div>
          <div
            className="absolute left-0 right-0 bottom-0 bg-white/50 py-2.5 backdrop-blur-sm"
            style={{ paddingLeft: "5.8%", paddingRight: "5.8%" }}
          >
            <span
              className="flex w-full items-center lowercase"
              style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontWeight: 200,
                fontSize: "clamp(13px, 3.64vw, 17px)",
                letterSpacing: "0.075em",
              }}
            >
              <span className="shrink-0">sculpture</span>
              <span className="flex-1 text-center">&nbsp;-&nbsp;</span>
              <span className="shrink-0">painting</span>
              <span className="flex-1 text-center">&nbsp;-&nbsp;</span>
              <span className="shrink-0">photography</span>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
