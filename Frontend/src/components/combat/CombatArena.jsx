import React from "react";

const CORES_PERSONAGEM = {
  Miguel: { cor: "#38BDF8", bg: "#112233", codigo: "EXP-01" },
  Amélia: { cor: "#34D399", bg: "#112A22", codigo: "CRT-02" },
  Benjamin: { cor: "#FBBF24", bg: "#2B2111", codigo: "GBD-03" },
  Z: { cor: "#60A5FA", bg: "#151F38", codigo: "EXP-01" },
};

export default function CombatArena({
  personagem,
  hpJogador,
  energiaJogador,
  defendendo,
  animacaoJogador,
  danoRecebidoAnim,
  inimigos,
  alvoIndex,
  onSelectAlvo,
}) {
  const temaChar = CORES_PERSONAGEM[personagem.nome] || {
    cor: "#38BDF8",
    bg: "#112233",
    codigo: personagem.placeholderKey || "EXP-01",
  };

  const hpMaxJogador = personagem.vida || 50;
  const peMaxJogador = personagem.energia || 100;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 8%",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 40%, #1B2820 0%, #0D130F 75%)",
      }}
    >
      {/* Grelha Tática de Fundo (Estilo Deltarune adaptado ao tema Geo-Quest) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(200, 155, 92, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(200, 155, 92, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* Linha de Solo da Arena */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "5%",
          right: "5%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(200, 155, 92, 0.35) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* LADO ESQUERDO: PERSONAGEM DO JOGADOR */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          transform: animacaoJogador
            ? "translateX(55px) scale(1.05)"
            : danoRecebidoAnim
            ? "translateX(-12px)"
            : "translateX(0)",
          transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
          textAlign: "center",
          minWidth: 160,
        }}
      >
        {/* Indicador de Postura Defensiva */}
        {defendendo && (
          <div
            style={{
              marginBottom: 8,
              display: "inline-block",
              padding: "3px 8px",
              borderRadius: 4,
              background: "#13293D",
              border: "1px solid #38BDF8",
              color: "#38BDF8",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            🛡️ ESCUDO ATIVO (-50% DANO)
          </div>
        )}

        {/* Token / Sprite do Personagem */}
        <div
          style={{
            width: 115,
            height: 115,
            borderRadius: 12,
            background: danoRecebidoAnim ? "#451A1C" : temaChar.bg,
            border: `2px solid ${danoRecebidoAnim ? "#F87171" : temaChar.cor}`,
            boxShadow: `0 0 28px ${
              danoRecebidoAnim ? "rgba(248, 113, 113, 0.45)" : `${temaChar.cor}44`
            }`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px auto",
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: danoRecebidoAnim ? "#F87171" : temaChar.cor,
            }}
          >
            {temaChar.codigo}
          </span>
          <span style={{ fontSize: 10, color: "#9CAEA0", marginTop: 4 }}>
            VEL {personagem.velocidade || 10}
          </span>
        </div>

        {/* Sombra no chão */}
        <div
          style={{
            width: 90,
            height: 12,
            background: "rgba(0, 0, 0, 0.55)",
            borderRadius: "50%",
            margin: "-4px auto 10px auto",
            filter: "blur(2px)",
          }}
        />

        <div style={{ fontWeight: 700, fontSize: 16, color: "#EDE6D3" }}>
          {personagem.nome}
        </div>

        {/* Barras Compactas sob o Jogador */}
        <div style={{ width: 140, margin: "8px auto 0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#34D399",
              marginBottom: 3,
            }}
          >
            <span>HP</span>
            <span>
              {hpJogador}/{hpMaxJogador}
            </span>
          </div>
          <div
            style={{
              height: 7,
              background: "#161E18",
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #26332A",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, (hpJogador / hpMaxJogador) * 100))}%`,
                height: "100%",
                background: "#34D399",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#38BDF8",
              marginBottom: 3,
            }}
          >
            <span>PE</span>
            <span>
              {energiaJogador}/{peMaxJogador}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "#161E18",
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #1E3246",
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, (energiaJogador / peMaxJogador) * 100))}%`,
                height: "100%",
                background: "#38BDF8",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* LADO DIREITO: GRUPO DE INIMIGOS */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          gap: 22,
          alignItems: "flex-end",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          maxWidth: "58%",
        }}
      >
        {inimigos.map((ini, idx) => {
          const selecionado = idx === alvoIndex;
          const isBoss = ini.tier === "Boss";
          const isMiniBoss = ini.tier === "MiniBoss";

          const corTema = isBoss
            ? "#F87171"
            : isMiniBoss
            ? "#FBBF24"
            : "#A855F7";

          const bgTema = isBoss
            ? "#2D1215"
            : isMiniBoss
            ? "#2B2111"
            : "#20142B";

          const tamanhoCaixa = isBoss ? 132 : isMiniBoss ? 108 : 90;
          const pctVida = Math.max(0, Math.min(100, (ini.vidaAtual / ini.vidaMaxima) * 100));

          return (
            <div
              key={ini.instanciaId}
              onClick={() => onSelectAlvo(idx)}
              style={{
                cursor: "pointer",
                textAlign: "center",
                padding: "12px 14px",
                borderRadius: 12,
                border: selecionado
                  ? "2px solid #C89B5C"
                  : "2px solid rgba(255, 255, 255, 0.05)",
                background: selecionado
                  ? "rgba(200, 155, 92, 0.14)"
                  : "rgba(13, 19, 15, 0.45)",
                transform: selecionado ? "translateY(-6px)" : "translateY(0)",
                transition: "all 0.18s ease",
                position: "relative",
              }}
            >
              {/* Indicador de Alvo Selecionado */}
              {selecionado && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#C89B5C",
                    fontWeight: 700,
                    marginBottom: 6,
                    letterSpacing: "0.08em",
                  }}
                >
                  ▼ ALVO ATUAL
                </div>
              )}

              {/* Token do Inimigo */}
              <div
                style={{
                  width: tamanhoCaixa,
                  height: tamanhoCaixa,
                  borderRadius: 10,
                  background: bgTema,
                  border: `2px solid ${corTema}`,
                  boxShadow: `0 0 22px ${corTema}38`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 8px auto",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: isBoss ? 14 : 12,
                    color: corTema,
                    letterSpacing: "0.05em",
                  }}
                >
                  {isBoss ? "💀 BOSS" : isMiniBoss ? "⚡ ELITE" : "👾 INM"}
                </span>
                <span style={{ fontSize: 10, color: "#9CAEA0", marginTop: 4 }}>
                  ATK {ini.ataque} • DEF {ini.defesa}
                </span>
              </div>

              {/* Sombra no chão */}
              <div
                style={{
                  width: tamanhoCaixa * 0.75,
                  height: 10,
                  background: "rgba(0, 0, 0, 0.55)",
                  borderRadius: "50%",
                  margin: "-2px auto 8px auto",
                  filter: "blur(2px)",
                }}
              />

              {/* Nome do Inimigo */}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#EDE6D3",
                  maxWidth: 130,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  margin: "0 auto",
                }}
              >
                {ini.nome}
              </div>

              {/* Barra de Vida do Inimigo */}
              <div
                style={{
                  width: 110,
                  height: 7,
                  background: "#161E18",
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid #26332A",
                  margin: "6px auto 4px auto",
                }}
              >
                <div
                  style={{
                    width: `${pctVida}%`,
                    height: "100%",
                    background: corTema,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <div style={{ fontSize: 11, color: "#9CAEA0" }}>
                HP: {ini.vidaAtual}/{ini.vidaMaxima}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}