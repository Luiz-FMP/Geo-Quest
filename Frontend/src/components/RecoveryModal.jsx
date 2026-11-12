import { useState } from "react";

export default function RecoveryModal({
  mode,
  playerState,
  onSelectReturnDestination,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!mode) return null;

  const isExhaustion = mode === "esgotamento";
  const checkpoint = isExhaustion
    ? playerState?.checkpointEnergia
    : playerState?.checkpointVida;

  const vidaFinal = Math.max(1, playerState?.atributos?.vidaFinal ?? 50);
  const energiaMaxima = Math.max(
    1,
    playerState?.atributos?.energiaMaximaFinal ?? 100,
  );

  const recoveredLifeAmount = Math.max(1, Math.round(vidaFinal * 0.5));
  const isGeneralHospitalCheckpoint =
    !isExhaustion &&
    String(checkpoint?.subcategoria || "").toLowerCase() ===
      "general_hospital";
  const hospitalHealPct = isGeneralHospitalCheckpoint ? 50 : 25;
  const hospitalRecoveredLifeAmount = Math.max(
    1,
    Math.round(vidaFinal * (hospitalHealPct / 100)),
  );

  async function handleChoose(destino) {
    if (isSubmitting || !onSelectReturnDestination) return;
    setIsSubmitting(true);
    try {
      await onSelectReturnDestination(mode, destino);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-modal-title"
      data-testid={isExhaustion ? "exhaustion-modal" : "death-modal"}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 12, 10, 0.92)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2200,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#18201A",
          border: `2px solid ${isExhaustion ? "#EAB308" : "#EF4444"}`,
          borderRadius: 12,
          maxWidth: 460,
          width: "100%",
          padding: "28px 24px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
          color: "#EDE6D3",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: isExhaustion ? "#422006" : "#450A0A",
              border: `1px solid ${isExhaustion ? "#EAB308" : "#EF4444"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 20,
              fontWeight: 700,
              color: isExhaustion ? "#FDE047" : "#FCA5A5",
              flexShrink: 0,
            }}
          >
            {isExhaustion ? "⚡" : "✖"}
          </div>
          <div>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                color: isExhaustion ? "#FACC15" : "#F87171",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {isExhaustion ? "Esgotamento de Energia" : "Derrota em Combate"}
            </span>
            <h3
              id="recovery-modal-title"
              style={{
                margin: "2px 0 0 0",
                fontSize: 22,
                fontWeight: 700,
                color: "#EDE6D3",
              }}
            >
              {isExhaustion
                ? "Sua Energia chegou a zero!"
                : "Sua Vida chegou a zero!"}
            </h3>
          </div>
        </div>

        <div
          style={{
            padding: "12px 14px",
            background: "#121814",
            border: "1px dashed #3A4A3C",
            borderRadius: 8,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: "#9CAEA0",
            lineHeight: 1.55,
          }}
        >
          {isExhaustion ? (
            <>
              O deslocamento foi interrompido por falta de Energia. Escolha para
              qual checkpoint deseja retornar:
              <div style={{ marginTop: 8, color: "#EDE6D3" }}>
                • Recupera <strong>50% da Vida máxima</strong> (+
                {recoveredLifeAmount} Vida)
                <br />• Mantém a <strong>Energia em 0</strong>
              </div>
            </>
          ) : (
            <>
              Você caiu sem Vida. Escolha para qual checkpoint deseja retornar:
              <div style={{ marginTop: 8, color: "#EDE6D3" }}>
                {checkpoint && (
                  <>
                    • <strong>Último hospital:</strong> recupera{" "}
                    <strong>{hospitalHealPct}% da Vida</strong> (+
                    {hospitalRecoveredLifeAmount} Vida) e mantém a{" "}
                    <strong>Energia igual</strong>
                    <br />
                  </>
                )}
                • <strong>Home:</strong> recupera{" "}
                <strong>50% da Vida total</strong> (+{recoveredLifeAmount} Vida)
                {" "}e <strong>100% da Energia</strong> ({energiaMaxima} Energia)
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {checkpoint && (
            <button
              type="button"
              data-testid="recovery-option-checkpoint"
              disabled={isSubmitting}
              onClick={() => handleChoose("checkpoint")}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: isExhaustion ? "#854D0E" : "#065F46",
                border: `1px solid ${isExhaustion ? "#FACC15" : "#34D399"}`,
                borderRadius: 8,
                color: "#FFFFFF",
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 700,
                fontSize: 13,
                textAlign: "left",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span>
                {isExhaustion
                  ? `1. Última hospedagem: ${checkpoint.nome}`
                  : `1. Último hospital: ${checkpoint.nome}`}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: isExhaustion ? "#FEF08A" : "#A7F3D0",
                }}
              >
                {isExhaustion
                  ? `Categoria: ${checkpoint.categoria}`
                  : `Categoria: ${checkpoint.categoria} • Recupera ${hospitalHealPct}% de Vida (+${hospitalRecoveredLifeAmount}) e mantém a Energia`}
              </span>
            </button>
          )}

          <button
            type="button"
            data-testid="recovery-option-home"
            disabled={isSubmitting}
            onClick={() => handleChoose("home")}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "#1E293B",
              border: "1px solid #38BDF8",
              borderRadius: 8,
              color: "#FFFFFF",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: 13,
              textAlign: "left",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span>
              {checkpoint ? "2. Retornar para Home" : "Retornar para Home"}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                color: "#BAE6FD",
              }}
            >
              {isExhaustion
                ? "Ponto inicial de aventura (Home)"
                : `Recupera 50% da Vida total (+${recoveredLifeAmount}) e 100% de Energia`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
