import { useEffect, useState } from "react";
import { getCharacterPlaceholder } from "../config/placeholderAssets";
import {
  ORDERED_CHARACTERS,
  getCharacterConfig,
} from "../config/characterAssets";
import { fetchPersonagensDisponiveis } from "../services/playerApi";

const DEFAULT_CHARACTER_SLOTS = ORDERED_CHARACTERS.map((char) => ({
  id: char.id,
  name: char.name,
  subtitle: char.description,
  unlocked: true,
  placeholderKey: char.placeholderKey,
  icon: char.icon,
}));

export default function CharacterSelectScreen({
  coords,
  currentCharacterId = 1,
  confirmLabel = "Confirmar e Abrir Mapa",
  headerBadge = "Etapa Inicial • Preparação",
  onSelectCharacter,
  onBack,
}) {
  const [slots, setSlots] = useState(DEFAULT_CHARACTER_SLOTS);
  const [selectedId, setSelectedId] = useState(() => currentCharacterId || 1);

  useEffect(() => {
    let active = true;
    fetchPersonagensDisponiveis()
      .then((list) => {
        if (!active || !Array.isArray(list) || list.length === 0) return;
        const mapped = list.map((p) => {
          const cfg = getCharacterConfig(p.nome || p.id);
          return {
            id: p.id,
            name: p.nome || cfg.name,
            subtitle: p.descricao || cfg.description,
            unlocked: p.disponivel !== false,
            placeholderKey: p.placeholderKey || cfg.placeholderKey,
            icon: cfg.icon,
          };
        });
        // Garante que existam os 4 personagens se a API retornar menos
        if (mapped.length < 4) {
          const ids = new Set(mapped.map((m) => m.id));
          ORDERED_CHARACTERS.forEach((c) => {
            if (!ids.has(c.id)) {
              mapped.push({
                id: c.id,
                name: c.name,
                subtitle: c.description,
                unlocked: true,
                placeholderKey: c.placeholderKey,
                icon: c.icon,
              });
            }
          });
        }
        mapped.sort((a, b) => a.id - b.id);
        setSlots(mapped);
      })
      .catch(() => {
        // Mantém fallback local com os 4 personagens
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedCharacter =
    slots.find((c) => c.id === selectedId) || slots[0];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1060,
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px",
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
          fontSize: 11,
          letterSpacing: "0.1em",
          color: "#C89B5C",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {headerBadge}
      </span>

      <h2
        style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 700,
          color: "#EDE6D3",
          textAlign: "center",
        }}
      >
        Escolha seu Personagem
      </h2>

      <p
        style={{
          marginTop: 6,
          marginBottom: 24,
          fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
          fontSize: 12,
          color: "#8A9A8C",
          textAlign: "center",
        }}
      >
        {coords
          ? `Localização definida (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
          : "Selecione o personagem ativo para a sua jornada"}
      </p>

      {/* 4 personagens alinhados na mesma linha */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          width: "100%",
          marginBottom: 28,
        }}
      >
        {slots.map((slot) => {
          const isSelected = slot.id === selectedId;
          const visual = getCharacterPlaceholder(slot.placeholderKey || slot.id);
          const charCfg = getCharacterConfig(slot.name || slot.id);

          if (!slot.unlocked) {
            return (
              <div
                key={slot.id}
                aria-disabled="true"
                style={{
                  background: "#0B0E0C",
                  border: "1px solid #1E2620",
                  borderRadius: 10,
                  padding: "20px 14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.6,
                  cursor: "not-allowed",
                  minHeight: 230,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: "#050706",
                    border: "1px solid #1B221C",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                    color: "#3A4A3C",
                    fontSize: 22,
                  }}
                >
                  🔒
                </div>

                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#4B584D",
                    marginBottom: 6,
                    textAlign: "center",
                  }}
                >
                  {slot.name}
                </div>

                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: "#3A463C",
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  {slot.subtitle}
                </div>
              </div>
            );
          }

          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => setSelectedId(slot.id)}
              style={{
                background: isSelected ? "#1F2A22" : "#18201A",
                border: isSelected ? "2px solid #C89B5C" : "1px solid #2E3B30",
                boxShadow: isSelected
                  ? "0 0 18px rgba(200, 155, 92, 0.35)"
                  : "none",
                borderRadius: 10,
                padding: "20px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                cursor: "pointer",
                minHeight: 230,
                color: "#EDE6D3",
                transition: "all 0.18s ease",
                position: "relative",
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#161D18",
                    background: "#C89B5C",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  ATIVO
                </div>
              )}

              {/* Ícone do Personagem */}
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 8,
                  background: "#101612",
                  border: `2px solid ${isSelected ? "#C89B5C" : visual.borderColor || "#2E3B30"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                  overflow: "hidden",
                  boxShadow: `0 0 14px ${charCfg.glow || visual.glow}`,
                }}
              >
                <img
                  src={charCfg.icon || slot.icon}
                  alt={slot.name}
                  style={{
                    width: 58,
                    height: 58,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                  onError={(e) => {
                    // Fallback para quadrado se a imagem falhar
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.parentNode) {
                      e.currentTarget.parentNode.style.background = visual.color;
                    }
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#EDE6D3",
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                {slot.name}
              </div>

              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: isSelected ? "#C89B5C" : "#9CAEA0",
                  textAlign: "center",
                  lineHeight: 1.35,
                }}
              >
                {slot.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          width: "100%",
          maxWidth: 420,
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "12px 20px",
            background: "transparent",
            border: "1px solid #2E3B30",
            borderRadius: 6,
            color: "#8A9A8C",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Voltar
        </button>

        <button
          type="button"
          disabled={!selectedCharacter?.unlocked}
          onClick={() => {
            if (selectedCharacter?.unlocked) {
              onSelectCharacter(selectedCharacter);
            }
          }}
          style={{
            flex: 1,
            padding: "14px 24px",
            background: "#C89B5C",
            border: "none",
            borderRadius: 6,
            color: "#161D18",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
