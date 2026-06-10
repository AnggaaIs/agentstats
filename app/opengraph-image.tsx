import { ImageResponse } from "next/og";

export const alt = "AgentStats - Read the match. Own the next.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#0b1016",
          color: "#f3f1eb",
          padding: "76px 82px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.14,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)",
            backgroundSize: "54px 54px",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -150,
            top: -170,
            width: 590,
            height: 590,
            border: "105px solid rgba(255,70,85,.12)",
            transform: "rotate(12deg)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 4,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#ff4655",
                borderRadius: 7,
              }}
            >
              A
            </div>
            AGENTSTATS
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                color: "#ff4655",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 5,
                marginBottom: 22,
              }}
            >
              VALORANT INTELLIGENCE
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 92,
                lineHeight: 0.88,
                letterSpacing: -6,
                fontWeight: 900,
              }}
            >
              <span>READ THE MATCH.</span>
              <span style={{ color: "#ff4655" }}>OWN THE NEXT.</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
