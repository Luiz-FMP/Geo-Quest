import React, { useState, useEffect } from "react";

export default function GeoQuestHome() {
  const [coords, setCoords] = useState({ lat: -25.4284, lng: -49.2733 });
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setCoords((c) => ({
        lat: c.lat + (Math.random() - 0.5) * 0.0004,
        lng: c.lng + (Math.random() - 0.5) * 0.0004,
      }));
      setBlink((b) => !b);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const menuItems = [
    { label: "Jogar", note: "iniciar percurso" },
    { label: "Configurações", note: "ajustes e permissões" },
    { label: "Informações", note: "sobre o jogo" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#161D18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
      }}
    >
      {/* Topographic contour background */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}
        preserveAspectRatio="none"
        viewBox="0 0 800 800"
      >
        {[...Array(9)].map((_, i) => (
          <path
            key={i}
            d={`M -50 ${80 + i * 85} C 150 ${20 + i * 85}, 300 ${150 + i * 85}, 500 ${70 + i * 85} S 850 ${110 + i * 85}, 900 ${60 + i * 85}`}
            fill="none"
            stroke="#26332A"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(22,29,24,0) 30%, rgba(22,29,24,0.85) 100%)",
        }}
      />

      {/* Signal indicator */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
          fontSize: 11,
          letterSpacing: "0.05em",
          color: "#8A9A8C",
        }}
      >
        <span style={{ opacity: blink ? 1 : 0.3, transition: "opacity 0.4s" }}>●</span>
        GPS ATIVO
      </div>

      {/* Coordinates decorative */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 24,
          fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
          fontSize: 11,
          color: "#5C6B5E",
          letterSpacing: "0.03em",
        }}
      >
        {coords.lat.toFixed(5)}° S&nbsp;&nbsp;{Math.abs(coords.lng).toFixed(5)}° W
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 420,
          width: "100%",
        }}
      >
        {/* Compass rose */}
        <svg width="86" height="86" viewBox="0 0 86 86" style={{ marginBottom: 8 }}>
          <circle cx="43" cy="43" r="41" fill="none" stroke="#3A4A3C" strokeWidth="1" />
          <circle cx="43" cy="43" r="30" fill="none" stroke="#3A4A3C" strokeWidth="0.75" />
          {[0, 90, 180, 270].map((deg) => (
            <line
              key={deg}
              x1="43"
              y1="43"
              x2={43 + 39 * Math.sin((deg * Math.PI) / 180)}
              y2={43 - 39 * Math.cos((deg * Math.PI) / 180)}
              stroke="#C89B5C"
              strokeWidth="1"
              opacity="0.7"
            />
          ))}
          <polygon points="43,10 48,43 43,76 38,43" fill="#C89B5C" opacity="0.9" />
          <text x="43" y="8" textAnchor="middle" fill="#8A9A8C" fontSize="7" fontFamily="'IBM Plex Mono', monospace">
            N
          </text>
        </svg>

        <h1
          style={{
            margin: 0,
            fontSize: 46,
            fontWeight: 700,
            color: "#EDE6D3",
            letterSpacing: "0.01em",
            textAlign: "center",
            lineHeight: 1.05,
          }}
        >
          Geo-Quest
        </h1>
        <p
          style={{
            marginTop: 10,
            marginBottom: 44,
            fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
            fontSize: 12,
            color: "#7C8C7E",
            letterSpacing: "0.08em",
            textAlign: "center",
          }}
        >
          cada trajeto é uma trilha real
        </p>

        {/* Menu as waypoints */}
        <nav style={{ width: "100%" }}>
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                width: "100%",
                background: "transparent",
                border: "none",
                borderTop: i === 0 ? "1px solid #2E3B30" : "none",
                borderBottom: "1px solid #2E3B30",
                padding: "18px 4px",
                cursor: "pointer",
                color: "#EDE6D3",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderTopColor = "#C89B5C";
                e.currentTarget.style.borderBottomColor = "#C89B5C";
                e.currentTarget.querySelector(".label").style.color = "#C89B5C";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderTopColor = "#2E3B30";
                e.currentTarget.style.borderBottomColor = "#2E3B30";
                e.currentTarget.querySelector(".label").style.color = "#EDE6D3";
              }}
            >
              <span
                className="label"
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  transition: "color 0.2s",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
                  fontSize: 11,
                  color: "#5C6B5E",
                  letterSpacing: "0.04em",
                }}
              >
                {item.note}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}