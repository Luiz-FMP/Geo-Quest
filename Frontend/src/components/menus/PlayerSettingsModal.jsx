import { useState } from "react";
import {
  getDebugCoordinatesConfig,
  saveDebugCoordinatesConfig,
} from "../../services/playerApi";
import { FullScreenMenuCloseButton } from "../PlayerBottomMenu";

export default function PlayerSettingsModal({
  playerState,
  onUpdatePlayerHp,
  onApplyDebugCoords,
  onClose,
}) {
  const initialDebugConfig = getDebugCoordinatesConfig();
  const [feedback, setFeedback] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [debugCoordsEnabled, setDebugCoordsEnabled] = useState(
    Boolean(initialDebugConfig.enabled),
  );
  const [debugLat, setDebugLat] = useState(
    initialDebugConfig.latitude !== "" ? String(initialDebugConfig.latitude) : "",
  );
  const [debugLng, setDebugLng] = useState(
    initialDebugConfig.longitude !== "" ? String(initialDebugConfig.longitude) : "",
  );
  const [debugCoordsMessage, setDebugCoordsMessage] = useState(null);
  const [debugCoordsError, setDebugCoordsError] = useState(null);

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

  async function handleSaveDebugCoordinates() {
    if (isUpdating) return;
    setDebugCoordsError(null);
    setDebugCoordsMessage(null);

    try {
      const savedConfig = saveDebugCoordinatesConfig({
        enabled: debugCoordsEnabled,
        latitude: debugLat,
        longitude: debugLng,
      });

      setDebugLat(
        savedConfig.latitude !== "" ? String(savedConfig.latitude) : "",
      );
      setDebugLng(
        savedConfig.longitude !== "" ? String(savedConfig.longitude) : "",
      );

      if (onApplyDebugCoords) {
        setIsUpdating(true);
        await onApplyDebugCoords(savedConfig);
      }

      if (savedConfig.enabled) {
        setDebugCoordsMessage(
          `Coordenadas de debug ativadas e aplicadas (${savedConfig.latitude.toFixed(5)}, ${savedConfig.longitude.toFixed(5)}).`,
        );
      } else {
        setDebugCoordsMessage(
          "Modo de coordenadas de debug desativado. O jogo utilizará a geolocalização real do dispositivo.",
        );
      }
    } catch (err) {
      setDebugCoordsError(
        err?.message || "Não foi possível salvar as coordenadas de debug.",
      );
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

        <div
          data-testid="debug-coords-panel"
          style={{
            width: "100%",
            marginTop: 6,
            padding: "18px",
            background: "#121814",
            border: "1px solid #C89B5C",
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
              Coordenadas de Debug — Ferramenta de Desenvolvimento
            </span>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                background: debugCoordsEnabled
                  ? "rgba(52, 211, 153, 0.16)"
                  : "rgba(148, 163, 184, 0.14)",
                border: debugCoordsEnabled
                  ? "1px solid #34D399"
                  : "1px solid #475569",
                color: debugCoordsEnabled ? "#6EE7B7" : "#94A3B8",
              }}
            >
              {debugCoordsEnabled ? "ATIVO (DEBUG)" : "DESATIVADO (GPS REAL)"}
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#9CAEA0",
              lineHeight: 1.5,
            }}
          >
            Ferramenta exclusiva para testes de desenvolvimento. Quando ativada,
            substitui a geolocalização do navegador e define a Home, a posição do
            personagem e o centro do mapa com as coordenadas informadas abaixo.
          </p>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: "#EDE6D3",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              data-testid="debug-coords-toggle"
              checked={debugCoordsEnabled}
              onChange={(e) => {
                setDebugCoordsEnabled(e.target.checked);
                setDebugCoordsError(null);
                setDebugCoordsMessage(null);
              }}
              style={{
                width: 16,
                height: 16,
                accentColor: "#C89B5C",
                cursor: "pointer",
              }}
            />
            Usar coordenadas manuais de debug em vez da geolocalização real
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                htmlFor="debug-coords-lat"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "#C89B5C",
                }}
              >
                Latitude (-90 a 90)
              </label>
              <input
                id="debug-coords-lat"
                type="text"
                inputMode="decimal"
                data-testid="debug-coords-lat-input"
                placeholder="Ex.: -23.55052"
                value={debugLat}
                onChange={(e) => {
                  setDebugLat(e.target.value);
                  setDebugCoordsError(null);
                }}
                style={{
                  padding: "10px 12px",
                  background: "#18201A",
                  border: "1px solid #354739",
                  borderRadius: 6,
                  color: "#EDE6D3",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                htmlFor="debug-coords-lng"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "#C89B5C",
                }}
              >
                Longitude (-180 a 180)
              </label>
              <input
                id="debug-coords-lng"
                type="text"
                inputMode="decimal"
                data-testid="debug-coords-lng-input"
                placeholder="Ex.: -46.633308"
                value={debugLng}
                onChange={(e) => {
                  setDebugLng(e.target.value);
                  setDebugCoordsError(null);
                }}
                style={{
                  padding: "10px 12px",
                  background: "#18201A",
                  border: "1px solid #354739",
                  borderRadius: 6,
                  color: "#EDE6D3",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            data-testid="debug-coords-save-btn"
            disabled={isUpdating}
            onClick={handleSaveDebugCoordinates}
            style={{
              padding: "12px 14px",
              background: "#263829",
              border: "1px solid #C89B5C",
              borderRadius: 8,
              color: "#EDE6D3",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              fontWeight: 700,
              cursor: isUpdating ? "not-allowed" : "pointer",
              opacity: isUpdating ? 0.6 : 1,
            }}
          >
            Salvar e aplicar coordenadas de debug
          </button>

          {debugCoordsError && (
            <div
              data-testid="debug-coords-error"
              style={{
                padding: "8px 10px",
                background: "rgba(239, 68, 68, 0.14)",
                border: "1px solid #F87171",
                borderRadius: 6,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#FCA5A5",
                textAlign: "center",
              }}
            >
              {debugCoordsError}
            </div>
          )}

          {debugCoordsMessage && (
            <div
              data-testid="debug-coords-feedback"
              style={{
                padding: "8px 10px",
                background: "rgba(52, 211, 153, 0.14)",
                border: "1px solid #34D399",
                borderRadius: 6,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#A7F3D0",
                textAlign: "center",
              }}
            >
              {debugCoordsMessage}
            </div>
          )}
        </div>
      </div>

      <FullScreenMenuCloseButton onClose={onClose} />
    </div>
  );
}
