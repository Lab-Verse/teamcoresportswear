// Owner-authorized local background extraction. Preserve the source artwork.
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve("../../backend/package.json"));
const sharp = require("sharp");
const source = resolve(
  "../../docs/teamcore/reference/team-core-source-logo.jpeg",
);
const master = resolve(
  "../../docs/teamcore/reference/team-core-transparent-logo.png",
);
const out = resolve("public/teamcore");
await mkdir(out, { recursive: true });
const { data, info } = await sharp(await readFile(source))
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(info.width * info.height * 4);
for (let pixel = 0; pixel < info.width * info.height; pixel++) {
  const offset = pixel * info.channels;
  const channels = [data[offset], data[offset + 1], data[offset + 2]];
  const brightest = Math.max(...channels);
  // The source has a black matte. Keep opaque artwork and anti-aliased edges;
  // discard near-black JPEG compression noise without changing red/white cores.
  const alpha = Math.round(
    Math.max(0, Math.min(1, (brightest - 24) / 76)) * 255,
  );
  for (let c = 0; c < 3; c++)
    rgba[pixel * 4 + c] = alpha
      ? Math.min(255, Math.round((channels[c] * 255) / alpha))
      : 0;
  rgba[pixel * 4 + 3] = alpha;
}
await sharp(rgba, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toFile(master);
const logo = await readFile(master);
await sharp(logo)
  .trim({ threshold: 2 })
  .resize(256, 256, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .webp({ lossless: true })
  .toFile(out + "/logo.webp");
await sharp(logo)
  .trim({ threshold: 2 })
  .resize(512, 512, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(out + "/logo.png");
await sharp(logo)
  .extract({ left: 210, top: 150, width: 865, height: 660 })
  .resize(128, 128, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(out + "/favicon.png");
const image = logo.toString("base64");
const share = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#111114"/><rect x="50" y="70" width="6" height="490" fill="#c6010b"/><image href="data:image/png;base64,${image}" x="75" y="115" width="390" height="390"/><g fill="white" font-family="Arial,sans-serif"><text x="520" y="220" font-size="48" font-weight="bold">Team Core</text><text x="520" y="285" font-size="48" font-weight="bold">Sports Wear</text><text x="520" y="380" font-size="26">Your team. Your colours.</text><text x="520" y="420" font-size="26">Your uniform.</text><text x="520" y="510" font-size="20" fill="#c5c7cd">CUSTOM UNIFORMS · TEAM ORDERS</text></g></svg>`;
await sharp(Buffer.from(share))
  .png()
  .toFile(out + "/social.png");
const stats = await sharp(out + "/logo.png").stats();
if (stats.channels[3].min !== 0 || stats.channels[3].max !== 255)
  throw Error("Expected transparent background and opaque artwork");
console.log(
  "Transparent logo, favicon and social artwork prepared from the original source.",
);
