export default function PlaceArrivalModal({ place, onClose }) {
  if (!place) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 14, 11, 0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#1B241D",
          border: "1px solid #C89B5C",
          borderRadius: 12,
          maxWidth: 440,
          width: "100%",
          padding: "28px 24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.65)",
          color: "#EDE6D3",
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#C89B5C",
            marginBottom: 8,
          }}
        >
          Destino Alcançado
        </div>

        <h3
          id="place-modal-title"
          style={{
            margin: "0 0 12px 0",
            fontSize: 24,
            fontWeight: 700,
            color: "#EDE6D3",
            lineHeight: 1.25,
          }}
        >
          {place.name}
        </h3>

        <div
          style={{
            display: "inline-block",
            padding: "5px 10px",
            borderRadius: 6,
            background: "#26332A",
            border: `1px solid ${place.color || "#C89B5C"}`,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: "#EDE6D3",
            marginBottom: 14,
          }}
        >
          Tipo: {place.category || "Ponto de Interesse"}
        </div>

        {place.address && (
          <p
            style={{
              margin: "0 0 14px 0",
              fontSize: 13,
              color: "#9CAEA0",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Endereço: {place.address}
          </p>
        )}

        <div
          style={{
            padding: "12px 14px",
            background: "#131915",
            border: "1px dashed #3A4A3C",
            borderRadius: 8,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: "#8A9A8C",
            marginBottom: 22,
            lineHeight: 1.5,
          }}
        >
          {place.interactionHint ||
            "Placeholder de interação: futuras missões ou ações específicas deste tipo de local serão exibidas aqui."}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px 18px",
            background: "#C89B5C",
            border: "none",
            borderRadius: 6,
            color: "#161D18",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Continuar Explorando
        </button>
      </div>
    </div>
  );
}

