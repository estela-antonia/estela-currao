// Shared content types used across routes, components, and server functions.
// The DB is the single source of truth; these types describe the shape that
// server functions return and that components consume.

export type ThemeSlug =
  | "identity"
  | "rhythmic-matrices"
  | "intersections"
  | "photography";

export type WorkPiece = {
  slug: string;
  title: string;
  principal: string;
  principalFileName: string;
  grid?: string;
  gridFileName?: string;
  additional: string[];
  additionalFileNames: string[];
  medium?: string;
  format?: string;
  year?: number;
  cita?: string;
  type?: "sculpture" | "painting" | "photography";
};

export type ThemeWork = {
  title: string;
  slug: string;
  cover: string;
  coverFileName: string;
  detail?: string;
  detailFileName?: string;
  type?: "sculpture" | "painting" | "photography";
  images?: string[];
  pieces?: WorkPiece[];
};

export type Theme = {
  slug: ThemeSlug;
  label: string;
  title: string;
  path: string;
  works: ThemeWork[];
};

// ---------- News / publications ----------

export type Exhibition = { date: string; location: string; event: string; image?: string };

export type Publication = {
  year: string;
  magazine: string;
  image?: string;
  text: { en: string; fr: string; es: string };
};

// ---------- Contact ----------

export type Locale = "en" | "fr" | "es";
export type LocalizedText = Record<Locale, string>;
export type ContactLink = { title: string; url: string };
export type ContactData = {
  photo: string;
  email: string;
  instagramColor: string;
  instagramBlackWhite: string;
  intro: LocalizedText;
  links: ContactLink[];
};

// ---------- Media SEO (discipline pages) ----------

export type MediaSeo = {
  type: "sculpture" | "painting" | "photography";
  h1Fr: string;
  h1Es: string;
  keyword: string;
  seoTitle: string;
  seoDescription: string;
  introFr: string;
  introEs: string;
  status: "draft" | "published";
};