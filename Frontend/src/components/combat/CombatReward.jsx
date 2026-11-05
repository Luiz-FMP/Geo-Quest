export default function CombatRewardModal({ recompensa, onClaim }) {
  if (!recompensa) return null;

  const { vitoria, moedasGanhas = 0, ganhouItem = false, itemNome = null } = recompensa;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 14, 11, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
        padding: 20,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div
        style={{
          background: "#1B241D",
          border: "2px solid #C89B5C",
          borderRadius: 12,
          maxWidth: 420,
          width: "100%",
          padding: "32px 24px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          color: "#EDE6D3",
          textAlign: "center",
          animation: "fadeInScale 0.25s ease-out",
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: vitoria ? "#34D399" : "#F87171",
            marginBottom: 8,
          }}
        >
          {vitoria ? "🏆 Combate Concluído com Sucesso" : "💀 Derrota em Combate"}
        </div>

        <h2 style={{ margin: "0 0 24px 0", fontSize: 26, color: "#EDE6D3" }}>
          {vitoria ? "Vitória Triunfante!" : "Você foi Derrotado"}
        </h2>

        {vitoria ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              marginBottom: 28,
            }}
          >
            {/* Recompensa de Moedas */}
            <div
              style={{
                background: "#131915",
                border: "1px solid #2F3E33",
                borderRadius: 8,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, color: "#9CAEA0" }}>Moedas Coletadas:</span>
              <strong style={{ fontSize: 16, color: "#FBBF24" }}>
                +{moedasGanhas} 🪙
              </strong>
            </div>

            {/* Recompensa de Item Aleatório */}
            <div
              style={{
                background: "#131915",
                border: "1px solid #2F3E33",
                borderRadius: 8,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, color: "#9CAEA0" }}>Item Encontrado:</span>
              <strong style={{ fontSize: 14, color: ganhouItem ? "#38BDF8" : "#6B7280" }}>
                {ganhouItem ? `🎁 ${itemNome}` : "Nenhum item desta vez"}
              </strong>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#9CAEA0", marginBottom: 28 }}>
            Você perdeu a batalha e não recolheu espólios. Retorne mais forte.
          </p>
        )}

        <button
          type="button"
          onClick={onClaim}
          style={{
            width: "100%",
            padding: "14px 20px",
            background: "#C89B5C",
            border: "none",
            borderRadius: 6,
            color: "#161D18",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(200, 155, 92, 0.3)",
          }}
        >
          {vitoria ? "Resgatar Recompensas e Voltar ao Mapa" : "Retornar ao Mapa"}
        </button>
      </div>
    </div>
  );
}