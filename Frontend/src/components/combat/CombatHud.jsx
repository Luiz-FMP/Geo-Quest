export default function CombatHUD({
  personagem,
  energiaJogador,
  alvoAtual,
  turnoBloqueado,
  permiteFuga,
  custoSkill = 20,
  logs,
  onAtacar,
  onHabilidade,
  onDefender,
  onFugir,
}) {
  const isArea =
    personagem.nome === "Z" ||
    (personagem.vantagem || "").toLowerCase().includes("área");

  const semEnergiaParaSkill = energiaJogador < custoSkill;

  return (
    <div
      style={{
        height: 210,
        background: "#161E18",
        borderTop: "2px solid #C89B5C",
        padding: "16px 28px",
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        gap: 24,
        boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.5)",
        zIndex: 10,
      }}
    >

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 10px",
            background: "#0D130F",
            border: "1px solid #26332A",
            borderRadius: 6,
            fontSize: 11,
          }}
        >
          <span style={{ color: "#9CAEA0" }}>
            ALVO:{" "}
            <strong style={{ color: "#C89B5C" }}>
              {alvoAtual ? alvoAtual.nome : "Nenhum"}
            </strong>
          </span>
          <span style={{ color: turnoBloqueado ? "#FBBF24" : "#34D399" }}>
            {turnoBloqueado ? "⏳ TURNO INIMIGO..." : "⚡ SEU TURNO"}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >

          <button
            type="button"
            onClick={onAtacar}
            disabled={turnoBloqueado}
            style={estiloBotao({
              bg: "#C89B5C",
              color: "#161D18",
              disabled: turnoBloqueado,
            })}
          >
            <span>⚔️ ATACAR</span>
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>
              Alvo único
            </span>
          </button>

          <button
            type="button"
            onClick={onHabilidade}
            disabled={turnoBloqueado || semEnergiaParaSkill}
            title={
              semEnergiaParaSkill
                ? `Requer ${custoSkill} de Energia`
                : personagem.vantagem || "Golpe Especial"
            }
            style={estiloBotao({
              bg: "#13293D",
              color: "#38BDF8",
              borderColor: "#38BDF8",
              disabled: turnoBloqueado || semEnergiaParaSkill,
            })}
          >
            <span>✨ SKILL ({custoSkill} PE)</span>
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>
              {isArea ? "💥 Dano em Área" : "🎯 Dano Crítico"}
            </span>
          </button>

          <button
            type="button"
            onClick={onDefender}
            disabled={turnoBloqueado}
            style={estiloBotao({
              bg: "#26332A",
              color: "#EDE6D3",
              borderColor: "#C89B5C",
              disabled: turnoBloqueado,
            })}
          >
            <span>🛡️ DEFENDER</span>
            <span style={{ fontSize: 10, fontWeight: 400, color: "#34D399" }}>
              -50% Dano • +15 PE
            </span>
          </button>

          <button
            type="button"
            onClick={onFugir}
            disabled={turnoBloqueado || !permiteFuga}
            title={
              !permiteFuga
                ? "Fuga bloqueada em Arenas de Parque e Bosses de Shopping!"
                : "Tentar escapar da emboscada"
            }
            style={estiloBotao({
              bg: "#3B181E",
              color: "#F87171",
              borderColor: "#F87171",
              disabled: turnoBloqueado || !permiteFuga,
            })}
          >
            <span>{permiteFuga ? "🏃 FUGIR" : "🔒 SEM FUGA"}</span>
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>
              {permiteFuga ? "Baseado em Vel." : "Luta Obrigatória"}
            </span>
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#0D130F",
          border: "1px solid #2F3E33",
          borderRadius: 8,
          padding: "14px 18px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#C89B5C",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            borderBottom: "1px dashed #26332A",
            paddingBottom: 4,
            marginBottom: 2,
          }}
        >
          Registo Tático do Combate
        </div>

        {logs.map((log, index) => (
          <div
            key={index}
            style={{
              fontSize: 13,
              lineHeight: 1.4,
              color: index === 0 ? "#EDE6D3" : "#7A8C7D",
              fontWeight: index === 0 ? 700 : 400,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {index === 0 ? `* ${log}` : `  ${log}`}
          </div>
        ))}
      </div>
    </div>
  );
}

function estiloBotao({ bg, color, borderColor = "none", disabled = false }) {
  return {
    background: bg,
    color: color,
    border: borderColor !== "none" ? `1px solid ${borderColor}` : "none",
    borderRadius: 6,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 700,
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.42 : 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: "6px 8px",
    transition: "opacity 0.15s ease, transform 0.1s ease",
  };
}
