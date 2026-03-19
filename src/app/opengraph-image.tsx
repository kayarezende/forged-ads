import { ImageResponse } from "next/og";

export const alt = "ForgedAds — AI-Powered Ad Creative Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 16V4h7a3 3 0 0 1 0 6H7v6"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 8l3 3m0-6l-3 3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>
            ForgedAds
          </span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 800,
          }}
        >
          Forge ads that{" "}
          <span style={{ color: "#f97316" }}>sell</span>.
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#a1a1aa",
            marginTop: 20,
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          AI-powered product photos, ad creatives, and video — generated in
          seconds.
        </div>
      </div>
    ),
    { ...size }
  );
}
