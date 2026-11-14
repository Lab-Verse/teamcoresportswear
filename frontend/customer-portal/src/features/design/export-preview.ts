import {
  renderDesign,
  type DesignDocument,
  type TemplateSpec,
  type Side,
} from "./contract";
async function dataUrl(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw Error("A preview image could not be loaded.");
  const blob = await r.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(Error("Preview image could not be read"));
    reader.readAsDataURL(blob);
  });
}
export async function downloadPreview(
  document: DesignDocument,
  spec: TemplateSpec,
  side: Side,
  assets: Record<string, string>,
  player: number,
) {
  const embedded = { ...spec, images: { ...spec.images } };
  if (spec.images[side])
    embedded.images[side] = await dataUrl(spec.images[side]!);
  const artwork = Object.fromEntries(
    await Promise.all(
      Object.entries(assets).map(async ([id, url]) => [id, await dataUrl(url)]),
    ),
  );
  const svg = renderDesign(
    document,
    embedded,
    side,
    artwork,
    player,
    false,
  ).replace("<svg xmlns=", '<svg width="600" height="650" xmlns=');
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(Error("Could not render preview"));
      img.src = url;
    });
    const canvas = window.document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1300;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("PNG export unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1200, 1300);
    ctx.drawImage(img, 0, 0, 1200, 1300);
    ctx.fillStyle = "#746865";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Team Core Sports Wear · Design preview — subject to production proof",
      600,
      1275,
    );
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(Error("PNG export failed"))),
        "image/png",
      ),
    );
    const href = URL.createObjectURL(png);
    return href;
  } finally {
    URL.revokeObjectURL(url);
  }
}
