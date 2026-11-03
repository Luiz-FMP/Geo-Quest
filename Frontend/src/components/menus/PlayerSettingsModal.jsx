import { useState } from "react";
import { FullScreenMenuCloseButton } from "../PlayerBottomMenu";

export default function PlayerSettingsModal({
  playerState,
  onUpdatePlayerHp,
  onClose,
}) {
  const [feedback, setFeedback] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const vidaAtual = playerState?.atributos?.vidaAtual ?? 50;
  const vidaFinal = Math.max(1, playerState?.atributos?.vidaFinal ?? 50);
  const energiaAtual = playerState?.atributos?.energiaAtual ?? 100;
  const energiaMaxima = Math.max(
    1,
    playerState?.atributos?.energiaMaximaFinal ?? 100,
  );
  const moedasAtuais = playerState?.moedas ?? playerState?.atributos?.moedas ?? 0;

  async function handleRecoverHealth() {
    if (!onUpdatePlayerHp || isUpdating) return;
    setIsUpdating(true);
    setFeedback(null);
    try {
      await onUpdatePlayerHp(vidaFinal, null);
      setFeedback(`Vida recuperada para ${vidaFinal}/${vidaFinal}.`);
    } catch {
      setFeedback("Não foi possível recuperar a vida.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRecoverEnergy() {
    if (!onUpdatePlayerHp || isUpdating) return;
    setIsUpdating(true);
    setFeedback(null);
    try {
      await onUpdatePlayerHp(vidaAtual, energiaMaxima);
      setFeedback(`Energia recuperada para ${energiaMaxima}/${energiaMaxima}.`);
    } catch {
      setFeedback("Não foi possível recuperar a energia.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleAddDebugCoins() {
    if (!onUpdatePlayerHp || isUpdating) return;
    setIsUpdating(true);
    setFeedback(null);
    try {
      const novoSaldo = moedasAtuais + 100;
      await onUpdatePlayerHp(vidaAtual, energiaAtual, novoSaldo);
      setFeedback(`+100 Moedas adicionadas (Saldo: ${novoSaldo}).`);
    } catch {
      setFeedback("Não foi possível adicionar moedas de debug.");
    } finally {
      setIsUpdating(false);
    }
  }

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
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#18201A",
          border: "1px solid #C89B5C",
          borderRadius: 12,
          padding: "32px 28px",
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

        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
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
          A estrutura deste menu já está preparada para receber preferências de
          áudio, mapa, unidades de medida e acessibilidade nas próximas etapas do
          projeto.
        </p>

        {/* Seção de Opções de Debug */}
        <div
          style={{
            width: "100%",
            marginTop: 12,
            padding: "18px",
            background: "#121814",
            border: "1px solid #2E3B30",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                color: "#C89B5C",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Opções de Debug
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#9CAEA0",
              }}
            >
              Vida: <strong>{vidaAtual}/{vidaFinal}</strong> • Energia:{" "}
              <strong>{Number(energiaAtual).toFixed(1)}/{energiaMaxima}</strong>{" "}
              • Moedas: <strong>{moedasAtuais}</strong>
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            <button
              type="button"
              data-testid="debug-recover-health-btn"
              disabled={isUpdating}
              onClick={handleRecoverHealth}
              style={{
                padding: "12px 14px",
                background: "#991B1B",
                border: "1px solid #F87171",
                borderRadius: 8,
                color: "#FFFFFF",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                cursor: isUpdating ? "not-allowed" : "pointer",
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              Recuperar vida
            </button>

            <button
              type="button"
              data-testid="debug-recover-energy-btn"
              disabled={isUpdating}
              onClick={handleRecoverEnergy}
              style={{
                padding: "12px 14px",
                background: "#0369A1",
                border: "1px solid #38BDF8",
                borderRadius: 8,
                color: "#FFFFFF",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                cursor: isUpdating ? "not-allowed" : "pointer",
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              Recuperar energia
            </button>

            <button
              type="button"
              data-testid="debug-add-coins-btn"
              disabled={isUpdating}
              onClick={handleAddDebugCoins}
              style={{
                padding: "12px 14px",
                background: "#92400E",
                border: "1px solid #FBBF24",
                borderRadius: 8,
                color: "#FFFFFF",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                cursor: isUpdating ? "not-allowed" : "pointer",
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              Adicionar +100 moedas
            </button>
          </div>

          {feedback && (
            <div
              data-testid="debug-settings-feedback"
              style={{
                padding: "8px 10px",
                background: "rgba(200, 155, 92, 0.12)",
                border: "1px solid rgba(200, 155, 92, 0.4)",
                borderRadius: 6,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#EDE6D3",
                textAlign: "center",
              }}
            >
              {feedback}
            </div>
          )}
        </div>
      </div>

      <FullScreenMenuCloseButton onClose={onClose} />
    </div>
  );
}
