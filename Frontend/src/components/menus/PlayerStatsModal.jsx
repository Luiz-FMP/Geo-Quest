import { FullScreenMenuCloseButton } from "../PlayerBottomMenu";

export default function PlayerStatsModal({ playerState, onClose }) {
  const estatisticas = playerState?.estatisticas || {
    distanciaPercorridaKm: 0,
    placesVisitados: 0,
    missoesConcluidas: 0,
    itensObtidos: 1,
    itensDescartados: 0,
    personagemUtilizado: playerState?.personagemAtual?.nome || "Explorador #1",
  };

  const statCards = [
    {
      key: "distancia",
      label: "Distância Percorrida",
      value: `${Number(estatisticas.distanciaPercorridaKm || 0).toFixed(2)} km`,
      note: "Acumulado nas rotas percorridas no mapa",
      accent: "#38BDF8",
    },
    {
      key: "places",
      label: "Places Visitados",
      value: `${estatisticas.placesVisitados ?? 0}`,
      note: "Pontos de interesse reais alcançados",
      accent: "#C89B5C",
    },
    {
      key: "missoes",
      label: "Missões Concluídas",
      value: `${estatisticas.missoesConcluidas ?? 0}`,
      note: "Registros concluídos no histórico do jogador",
      accent: "#10B981",
    },
    {
      key: "itensObtidos",
      label: "Quantidade de Itens Obtidos",
      value: `${estatisticas.itensObtidos ?? 0}`,
      note: "Total histórico de itens recebidos pelo jogador",
      accent: "#F59E0B",
    },
    {
      key: "itensDescartados",
      label: "Quantidade de Itens Descartados",
      value: `${estatisticas.itensDescartados ?? 0}`,
      note: "Itens removidos através do slot de lixeira",
      accent: "#EF4444",
    },
    {
      key: "personagem",
      label: "Personagem Utilizado",
      value: estatisticas.personagemUtilizado || playerState?.personagemAtual?.nome || "Explorador #1",
      note: "Personagem atualmente ativo no perfil",
      accent: "#A855F7",
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu de Estatísticas do Jogador"
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
        overflowY: "auto",
        padding: "28px 24px 100px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 920,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <header
          style={{
            borderBottom: "1px solid #2E3B30",
            paddingBottom: 14,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "#C89B5C",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Histórico Persistente • SQLite
          </span>
          <h2 style={{ margin: "4px 0 0 0", fontSize: 28, fontWeight: 700 }}>
            Estatísticas do Jogador
          </h2>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {statCards.map((item) => (
            <div
              key={item.key}
              data-testid={`stat-card-${item.key}`}
              style={{
                background: "#18201A",
                border: "1px solid #2E3B30",
                borderTop: `3px solid ${item.accent}`,
                borderRadius: 10,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "#8A9A8C",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </span>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#EDE6D3",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {item.value}
              </div>
              <span style={{ fontSize: 12, color: "#7C8C7E" }}>{item.note}</span>
            </div>
          ))}
        </div>
      </div>

      <FullScreenMenuCloseButton onClose={onClose} />
    </div>
  );
}

