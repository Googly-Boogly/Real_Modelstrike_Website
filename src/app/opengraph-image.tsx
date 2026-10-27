import { ImageResponse } from "next/og";

export const alt = "ModelStrike — AI Automation & Custom Software Development";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0b1120 0%, #111c30 60%, #132a52 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800 }}>M</div>
          <div style={{ fontSize: 34, fontWeight: 700, display: "flex" }}>
            Model<span style={{ color: "#60a5fa" }}>Strike</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 960 }}>AI Automation That Takes Busywork Off Your Plate.</div>
          <div style={{ fontSize: 28, color: "#a3b0c4" }}>Customer intake · Workflow automation · Custom AI agents · Integrations</div>
        </div>
        <div style={{ fontSize: 24, color: "#22d3ee" }}>modelstrike.ai</div>
      </div>
    ),
    size,
  );
}
