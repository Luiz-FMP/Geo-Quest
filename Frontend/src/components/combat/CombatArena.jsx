import ActiveBuffsBar from "../ActiveBuffsBar";
import CharacterAnimatedSprite from "./CharacterAnimatedSprite";

function getBattleMapImage(tipoCombate) {
  const tipo = String(tipoCombate || "").toLowerCase();
  if (tipo.includes("arena")) {
    return "/battle_maps/park_battle_map.png";
  }
  if (tipo.includes("boss")) {
    return "/battle_maps/mall_battle_map.png";
  }
  return "/battle_maps/random_battle_map.png";
}

export default function CombatArena({
  personagem,
  tipoCombate = "Emboscada",
  buffs = [],
  onBuffExpired = null,
  hpJogador,
  energiaJogador,
  defendendo,
  animacaoJogador,
  danoRecebidoAnim,
  inimigos,
  alvoIndex,
  onSelectAlvo,
}) {
  const hpMaxJogador = personagem.vida || 50;
  const peMaxJogador = personagem.energia || 100;
  const battleMapUrl = getBattleMapImage(tipoCombate);

  const playerAction = danoRecebidoAnim
    ? "damage"
    : animacaoJogador
      ? "attack"
      : "battleIdle";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        padding: "0 6% 36px 6%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0D130F",
      }}
    >
      {/* Imagem de Fundo Dinâmica por Tipo de Combate */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${battleMapUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          filter: "brightness(0.9)",
          zIndex: 0,
        }}
      />

      {/* Vinheta atmosférica para contraste com sprites e HUD */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(13, 19, 15, 0.12) 0%, rgba(13, 19, 15, 0.58) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Linha tática de profundidade do piso */}
      <div
        style={{
          position: "absolute",
          bottom: "16%",
          left: "4%",
          right: "4%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(200, 155, 92, 0.25) 50%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
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
              ? "translateX(-14px)"
              : "translateX(0)",
          transition: "transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
          textAlign: "center",
          minWidth: 170,
        }}
      >
        {/* Seção 3: Durante um combate os ícones de aprimoramento aparecem acima do personagem do jogador com ícones levemente menores */}
        {Array.isArray(buffs) && buffs.length > 0 && (
          <div
            data-testid="combat-player-buffs"
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <ActiveBuffsBar
              buffs={buffs}
              compact={true}
              onBuffExpired={onBuffExpired}
            />
          </div>
        )}

        {/* Indicador de Postura Defensiva */}
        {defendendo && (
          <div
            style={{
              marginBottom: 8,
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 4,
              background: "#13293D",
              border: "1px solid #38BDF8",
              color: "#38BDF8",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              boxShadow: "0 0 10px rgba(56, 189, 248, 0.4)",
            }}
          >
            🛡️ ESCUDO ATIVO (-50% DANO)
          </div>
        )}

        {/* Sprite Animado do Personagem */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            margin: "0 auto -4px auto",
            position: "relative",
          }}
        >
          <CharacterAnimatedSprite
            characterName={personagem.nome}
            action={playerAction}
            scale={1.35}
            isDamaged={Boolean(danoRecebidoAnim)}
            useProcedural={true}
          />
        </div>

        {/* Sombra suave nos pés */}
        <div
          style={{
            width: 100,
            height: 14,
            background: "rgba(0, 0, 0, 0.65)",
            borderRadius: "50%",
            margin: "-6px auto 10px auto",
            filter: "blur(3px)",
          }}
        />

        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#EDE6D3",
            textShadow: "0 2px 4px rgba(0,0,0,0.8)",
          }}
        >
          {personagem.nome}
        </div>

        {/* Barras Compactas sob o Jogador */}
        <div
          style={{
            width: 145,
            margin: "8px auto 0 auto",
            background: "rgba(13, 19, 15, 0.75)",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(4px)",
          }}
        >
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
          gap: 20,
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
          const pctVida = Math.max(
            0,
            Math.min(100, (ini.vidaAtual / ini.vidaMaxima) * 100)
          );

          return (
            <div
              key={ini.instanciaId || idx}
              onClick={() => onSelectAlvo(idx)}
              style={{
                cursor: "pointer",
                textAlign: "center",
                padding: "12px 14px",
                borderRadius: 12,
                border: selecionado
                  ? "2px solid #C89B5C"
                  : "2px solid rgba(255, 255, 255, 0.12)",
                background: selecionado
                  ? "rgba(200, 155, 92, 0.22)"
                  : "rgba(13, 19, 15, 0.72)",
                backdropFilter: "blur(5px)",
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
                  background: "rgba(0, 0, 0, 0.65)",
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
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
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
