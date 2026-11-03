import { FullScreenMenuCloseButton } from "../PlayerBottomMenu";

export default function PlayerSettingsModal({ onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu de Configurações"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "#121814",
        color: "#EDE6D3",
        zIndex: 1150,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 24px 100px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#18201A",
          border: "1px solid #C89B5C",
          borderRadius: 12,
          padding: "36px 28px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            background: "#121814",
            border: "1px dashed #C89B5C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 22,
            color: "#C89B5C",
          }}
        >
          ⚙
        </div>

        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: "#C89B5C",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Configurações do Sistema
        </span>

        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          WIP — Em desenvolvimento
        </h2>

        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#8A9A8C",
            lineHeight: 1.6,
          }}
        >
          A estrutura deste menu já está preparada para receber preferências de áudio, mapa, unidades de medida e acessibilidade nas próximas etapas do projeto.
        </p>
      </div>

      <FullScreenMenuCloseButton onClose={onClose} />
    </div>
  );
}

