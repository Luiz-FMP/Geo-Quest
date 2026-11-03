import { useEffect, useState } from "react";
import { getCharacterPlaceholder } from "../config/placeholderAssets";
import { fetchPersonagensDisponiveis } from "../services/playerApi";

const DEFAULT_CHARACTER_SLOTS = [
  {
    id: 1,
    name: "Explorador #1",
    subtitle: "Especialista em trilhas urbanas",
    unlocked: true,
    placeholderKey: "char_1",
  },
  {
    id: 2,
    name: "Cartógrafo #2",
    subtitle: "Mapeamento tático de pontos históricos",
    unlocked: true,
    placeholderKey: "char_2",
  },
  {
    id: 3,
    name: "Guardião #3",
    subtitle: "Expedições longas e defesa",
    unlocked: true,
    placeholderKey: "char_3",
  },
];

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
        const mapped = list.map((p) => ({
          id: p.id,
          name: p.nome,
          subtitle: p.descricao || p.vantagem || "Disponível",
          unlocked: p.disponivel !== false,
          placeholderKey: p.placeholderKey || `char_${p.id}`,
        }));
        setSlots(mapped);
      })
      .catch(() => {
        // Mantém fallback local caso o backend esteja indisponível
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
        maxWidth: 680,
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px",
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
          fontSize: 34,
          fontWeight: 700,
          color: "#EDE6D3",
          textAlign: "center",
        }}
      >
        Escolha seu Personagem
      </h2>

      <p
        style={{
          marginTop: 8,
          marginBottom: 28,
          fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
          fontSize: 12,
          color: "#8A9A8C",
          textAlign: "center",
        }}
      >
        {coords
          ? `Localização definida (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
          : "Selecione o personagem ativo do seu perfil"}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          width: "100%",
          marginBottom: 28,
        }}
      >
        {slots.map((slot) => {
          const isSelected = slot.id === selectedId;
          const visual = getCharacterPlaceholder(slot.placeholderKey || slot.id);

          if (!slot.unlocked) {
            return (
              <div
                key={slot.id}
                aria-disabled="true"
                style={{
                  background: "#0B0E0C",
                  border: "1px solid #1E2620",
                  borderRadius: 10,
                  padding: "24px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.65,
                  cursor: "not-allowed",
                  minHeight: 210,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: "#050706",
                    border: "1px solid #1B221C",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                    color: "#3A4A3C",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 20,
                  }}
                >
                  🔒
                </div>

                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
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
                borderRadius: 10,
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                minHeight: 210,
                color: "#EDE6D3",
                transition: "all 0.2s ease",
              }}
            >
              <div
                title={visual.shapeLabel}
                style={{
                  width: 52,
                  height: 52,
                  background: visual.color,
                  border: `3px solid ${visual.borderColor}`,
                  boxShadow: `0 0 16px ${visual.glow}`,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {visual.badgeText}
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
                  color: "#C89B5C",
                  textAlign: "center",
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
