// Build Open Graph-friendly 1200x630 image URLs from existing assets.
// All catalog images are hosted on Unsplash, which supports on-the-fly
// resizing via the `w`, `h` and `fit` query params — so we get a real,
// CDN-served OG asset per item with the correct social dimensions.

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export function toOgImage(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname.includes("unsplash.com")) {
      u.searchParams.set("w", String(OG_WIDTH));
      u.searchParams.set("h", String(OG_HEIGHT));
      u.searchParams.set("fit", "crop");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}
