import { useCallback, useEffect, useState } from "react";
import {
  alterarPersonagemJogador,
  atualizarNomeJogador,
  desequiparItemJogador,
  equiparItemJogador,
  fetchJogadorAtual,
  gerarItemDebugInventario,
  moverItemInventario,
  registrarPercursoJogador,
  removerItemInventario,
} from "../services/playerApi";
import CharacterSelectScreen from "./CharacterSelectScreen";
import GoogleMapDemo from "./GoogleMapDemo";
import PlayerSystemsOverlay from "./PlayerSystemsOverlay";

export default function GeoQuestHome() {
  const [screen, setScreen] = useState("menu"); // "menu" | "character-select" | "map"
  const [coords, setCoords] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    let active = true;
    fetchJogadorAtual()
      .then((data) => {
        if (active && data) {
          setPlayerState(data);
        }
      })
      .catch(() => {
        // Caso o backend ainda não esteja rodando, mantém estado local de fallback até conectar
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setBlink((currentBlink) => !currentBlink);
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  const handleUpdateName = useCallback(async (novoNome) => {
    const updated = await atualizarNomeJogador(novoNome);
    setPlayerState(updated);
    return updated;
  }, []);

  const handleChangeCharacter = useCallback(async (personagemId) => {
    const updated = await alterarPersonagemJogador(personagemId);
    setPlayerState(updated);
    return updated;
  }, []);

  const handleMoveItem = useCallback(async (inventarioId, novoSlotIndice, abaDestino) => {
    const updated = await moverItemInventario(inventarioId, novoSlotIndice, abaDestino);
    setPlayerState(updated);
    return updated;
  }, []);

  const handleDeleteItem = useCallback(async (inventarioId) => {
    const updated = await removerItemInventario(inventarioId);
    setPlayerState(updated);
    return updated;
  }, []);

  const handleEquipItem = useCallback(async (inventarioId, slotEquipamento) => {
    const updated = await equiparItemJogador(inventarioId, slotEquipamento);
    setPlayerState(updated);
    return updated;
  }, []);

  const handleUnequipItem = useCallback(async (slotEquipamento, slotMochilaDestino) => {
    const updated = await desequiparItemJogador(slotEquipamento, slotMochilaDestino);
    setPlayerState(updated);
    return updated;
  }, []);

  const handleSpawnDebugItem = useCallback(async () => {
    const updated = await gerarItemDebugInventario();
    setPlayerState(updated);
    return updated;
  }, []);

  const handleRegisterRouteTraversal = useCallback(async (distanciaKm, place) => {
    try {
      const response = await registrarPercursoJogador(
        distanciaKm,
        place?.id || null,
        place?.name || null,
      );
      if (response?.jogador) {
        setPlayerState(response.jogador);
      }
      return response;
    } catch {
      return null;
    }
  }, []);

  function handleStartGame() {
    if (!navigator.geolocation) {
      setLocationError("Seu navegador não suporta geolocalização.");
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position?.coords?.latitude;
        const longitude = position?.coords?.longitude;

        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number" ||
          Number.isNaN(latitude) ||
          Number.isNaN(longitude)
        ) {
          setLocationError("Dados de localização incompletos retornados pelo navegador.");
          setIsLoadingLocation(false);
          return;
        }

        setCoords({
          lat: latitude,
          lng: longitude,
        });
        setIsLoadingLocation(false);
        setScreen("character-select");
      },
      (error) => {
        let message = "Não foi possível obter sua localização.";
        if (error?.code === 1) {
          message =
            "Acesso à localização negado. Permita o uso da localização no navegador para iniciar o jogo.";
        } else if (error?.code === 2) {
          message = "Localização indisponível no momento. Verifique o GPS/rede do dispositivo.";
        } else if (error?.code === 3) {
          message = "Tempo limite esgotado ao obter sua localização. Tente novamente.";
        }

        setLocationError(message);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  }

  const currentCharacterObj = playerState?.personagemAtual
    ? {
        id: playerState.personagemAtual.id,
        name: playerState.personagemAtual.nome,
        placeholderKey: playerState.personagemAtual.placeholderKey,
      }
    : { id: 1, name: "Explorador #1", placeholderKey: "char_1" };

  if (screen === "map" && coords) {
    return (
      <>
        <GoogleMapDemo
          initialCoords={coords}
          character={currentCharacterObj}
          playerState={playerState}
          onRegisterRouteTraversal={handleRegisterRouteTraversal}
          onExitToMenu={() => setScreen("menu")}
        />
        <PlayerSystemsOverlay
          playerState={playerState}
          coords={coords}
          onUpdateName={handleUpdateName}
          onChangeCharacter={handleChangeCharacter}
          onMoveItem={handleMoveItem}
          onDeleteItem={handleDeleteItem}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
          onSpawnDebugItem={handleSpawnDebugItem}
        />
      </>
    );
  }

  const menuItems = [
    { label: "Jogar", note: "iniciar percurso", enabled: true },
    { label: "Configurações", note: "em breve", enabled: false },
    { label: "Informações", note: "em breve", enabled: false },
  ];

  const gpsStatus = isLoadingLocation
    ? "BUSCANDO GPS"
    : coords
      ? "GPS ATIVO"
      : "GPS INATIVO";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#161D18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
        position: "relative",
        overflow: "hidden",
        padding: "24px 24px 96px 24px",
      }}
    >
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.5,
        }}
        preserveAspectRatio="none"
        viewBox="0 0 800 800"
      >
        {[...Array(9)].map((_, index) => (
          <path
            key={index}
            d={`M -50 ${80 + index * 85} C 150 ${20 + index * 85}, 300 ${
              150 + index * 85
            }, 500 ${70 + index * 85} S 850 ${
              110 + index * 85
            }, 900 ${60 + index * 85}`}
            fill="none"
            stroke="#26332A"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(22,29,24,0) 30%, rgba(22,29,24,0.85) 100%)",
        }}
      />

      {playerState && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 24,
            fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
            fontSize: 11,
            color: "#C89B5C",
            zIndex: 3,
          }}
        >
          JOGADOR: <strong>{playerState.nome}</strong> • {playerState.personagemAtual?.nome || "Explorador #1"} • PODER:{" "}
          <strong>{playerState.atributos?.nivelDePoder ?? 10}</strong>
        </div>
      )}

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
        <span
          style={{
            opacity: blink ? 1 : 0.3,
            transition: "opacity 0.4s",
          }}
        >
          ●
        </span>
        {gpsStatus}
      </div>

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
        {isLoadingLocation ? (
          "BUSCANDO LOCALIZAÇÃO..."
        ) : locationError ? (
          "ERRO DE LOCALIZAÇÃO"
        ) : coords ? (
          <>
            {Math.abs(coords.lat).toFixed(5)}° {coords.lat >= 0 ? "N" : "S"}
            &nbsp;&nbsp;
            {Math.abs(coords.lng).toFixed(5)}° {coords.lng >= 0 ? "E" : "W"}
          </>
        ) : (
          "AGUARDANDO INÍCIO"
        )}
      </div>

      {screen === "character-select" && coords ? (
        <CharacterSelectScreen
          coords={coords}
          currentCharacterId={playerState?.personagemId || 1}
          onBack={() => setScreen("menu")}
          onSelectCharacter={async (character) => {
            try {
              await handleChangeCharacter(character.id);
            } catch {
              // Continua mesmo se offline
            }
            setScreen("map");
          }}
        />
      ) : (
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
          <svg width="86" height="86" viewBox="0 0 86 86" style={{ marginBottom: 8 }}>
            <circle cx="43" cy="43" r="41" fill="none" stroke="#3A4A3C" strokeWidth="1" />
            <circle cx="43" cy="43" r="30" fill="none" stroke="#3A4A3C" strokeWidth="0.75" />
            {[0, 90, 180, 270].map((degree) => (
              <line
                key={degree}
                x1="43"
                y1="43"
                x2={43 + 39 * Math.sin((degree * Math.PI) / 180)}
                y2={43 - 39 * Math.cos((degree * Math.PI) / 180)}
                stroke="#C89B5C"
                strokeWidth="1"
                opacity="0.7"
              />
            ))}
            <polygon points="43,10 48,43 43,76 38,43" fill="#C89B5C" opacity="0.9" />
            <text
              x="43"
              y="8"
              textAnchor="middle"
              fill="#8A9A8C"
              fontSize="7"
              fontFamily="'IBM Plex Mono', monospace"
            >
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
              marginBottom: 32,
              fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
              fontSize: 12,
              color: "#7C8C7E",
              letterSpacing: "0.08em",
              textAlign: "center",
            }}
          >
            cada trajeto é uma trilha real
          </p>

          {isLoadingLocation && (
            <div
              style={{
                width: "100%",
                padding: "12px 14px",
                marginBottom: 20,
                background: "#1B241D",
                border: "1px solid #C89B5C",
                borderRadius: 6,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: "#EDE6D3",
                textAlign: "center",
              }}
            >
              Solicitando acesso à sua localização...
            </div>
          )}

          {locationError && (
            <div
              role="alert"
              style={{
                width: "100%",
                padding: "12px 14px",
                marginBottom: 20,
                background: "#3B1818",
                border: "1px solid #EF4444",
                borderRadius: 6,
                fontFamily: "system-ui, sans-serif",
                fontSize: 13,
                color: "#FCA5A5",
                textAlign: "left",
              }}
            >
              {locationError}
            </div>
          )}

          {/* Menu as waypoints */}
          <nav style={{ width: "100%" }}>
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                type="button"
                disabled={!item.enabled || isLoadingLocation}
                onClick={() => {
                  if (item.label === "Jogar") {
                    handleStartGame();
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderTop: index === 0 ? "1px solid #2E3B30" : "none",
                  borderBottom: "1px solid #2E3B30",
                  padding: "18px 4px",
                  cursor: item.enabled && !isLoadingLocation ? "pointer" : "default",
                  color: item.enabled ? "#EDE6D3" : "#5C6B5E",
                  opacity: item.enabled ? 1 : 0.6,
                  textAlign: "left",
                }}
                onMouseEnter={(event) => {
                  if (!item.enabled) return;
                  event.currentTarget.style.borderTopColor = "#C89B5C";
                  event.currentTarget.style.borderBottomColor = "#C89B5C";
                  event.currentTarget.querySelector(".label").style.color = "#C89B5C";
                }}
                onMouseLeave={(event) => {
                  if (!item.enabled) return;
                  event.currentTarget.style.borderTopColor = "#2E3B30";
                  event.currentTarget.style.borderBottomColor = "#2E3B30";
                  event.currentTarget.querySelector(".label").style.color = "#EDE6D3";
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
      )}

      {/* Botão MENU inferior central e Menus de Tela Cheia (Status, Inventário, Estatísticas, Configurações) */}
      <PlayerSystemsOverlay
        playerState={playerState}
        coords={coords}
        onUpdateName={handleUpdateName}
        onChangeCharacter={handleChangeCharacter}
        onMoveItem={handleMoveItem}
        onDeleteItem={handleDeleteItem}
        onEquipItem={handleEquipItem}
        onUnequipItem={handleUnequipItem}
        onSpawnDebugItem={handleSpawnDebugItem}
      />
    </div>
  );
}
