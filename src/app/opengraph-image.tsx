import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "LIPAN RI — Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/logo.png"), "base64");
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #0e1830 0%, #14223e 60%, #1a2d52 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <img src={logoSrc} width={128} height={128} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>
              LIPAN RI
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 8,
                color: "#e0ad2a",
                marginTop: 8,
              }}
            >
              INDEPENDEN
            </span>
          </div>
        </div>

        {/* Bottom: tagline + accent */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              width: 120,
              height: 8,
              borderRadius: 4,
              background: "#e0ad2a",
              marginBottom: 28,
            }}
          />
          <span style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.25 }}>
            Lembaga Investigasi dan Pengawasan
          </span>
          <span style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.25 }}>
            Aset Negara Republik Indonesia
          </span>
          <span style={{ fontSize: 26, color: "#8298c9", marginTop: 20 }}>
            Lembaga independen milik masyarakat yang mengawal aset negara
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
