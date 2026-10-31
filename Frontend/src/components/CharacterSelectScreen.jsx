import { useState } from "react";

const CHARACTER_SLOTS = [
  {
    id: 1,
    name: "Explorador #1",
    subtitle: "Disponível nesta versão",
    unlocked: true,
  },
  {
    id: 2,
    name: "Personagem #2",
    subtitle: "Bloqueado (Placeholder)",
    unlocked: false,
  },
  {
    id: 3,
    name: "Personagem #3",
    subtitle: "Bloqueado (Placeholder)",
    unlocked: false,
  },
];

export default function CharacterSelectScreen({ coords, onSelectCharacter, onBack }) {
  const [selectedId, setSelectedId] = useState(1);

  const selectedCharacter = CHARACTER_SLOTS.find((c) => c.id === selectedId);

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
        Etapa Inicial • Preparação
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
        Localização inicial definida ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
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
        {CHARACTER_SLOTS.map((slot) => {
          const isSelected = slot.id === selectedId;

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
                title="Representação inicial do personagem (quadrado azul)"
                style={{
                  width: 52,
                  height: 52,
                  background: "#2563EB",
                  border: "3px solid #93C5FD",
                  boxShadow: "0 0 16px rgba(37, 99, 235, 0.55)",
                  marginBottom: 16,
                }}
              />

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
          Confirmar e Abrir Mapa
        </button>
      </div>
    </div>
  );
}

