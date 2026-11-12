import { useEffect, useState } from "react";
import { getBuffPlaceholder, getCharacterPlaceholder } from "../../config/placeholderAssets";
import { getCharacterConfig } from "../../config/characterAssets";
import {
  calcularSegundosRestantesBuff,
  filtrarBuffsAtivosUnicosPorAtributo,
  formatarContadorBuff,
  identificarAtributoBuff,
  recalculateState,
} from "../../services/playerApi";
import CharacterSelectScreen from "../CharacterSelectScreen";
import { FullScreenMenuCloseButton } from "../PlayerBottomMenu";

export default function PlayerStatusModal({
  playerState,
  coords,
  onUpdateName,
  onChangeCharacter,
  onClose,
}) {
  const [nameInput, setNameInput] = useState(playerState?.nome || "Explorador");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isChangingCharacter, setIsChangingCharacter] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const livePlayerState = playerState ? recalculateState(playerState, nowMs) : null;

  const atributos = livePlayerState?.atributos || {
    vidaBase: 50,
    vidaModificador: 0,
    vidaFinal: 50,
    vidaAtual: 50,
    energiaBase: 100,
    energiaModificador: 0,
    energiaMaximaFinal: 100,
    energiaAtual: 100,
    danoBase: 10,
    danoModificador: 0,
    danoFinal: 10,
    defesaBase: 0,
    defesaModificador: 0,
    defesaFinal: 0,
    velocidadeBase: 0,
    velocidadeModificador: 0,
    velocidadeFinal: 0,
    nivelDePoder: 10,
    consumoEnergiaPorKm: 10,
  };

  const personagemAtual = playerState?.personagemAtual || {
    id: playerState?.personagemId || 1,
    nome: "Explorador #1",
    descricao: "Especialista em trilhas urbanas",
    vantagem: "Equilibrado",
    placeholderKey: "char_1",
  };

  const charVisual = getCharacterPlaceholder(
    personagemAtual.placeholderKey || personagemAtual.id,
  );

  async function handleSaveName(event) {
    event.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setErrorMsg("Informe um nome válido para o jogador.");
      return;
    }

    setIsSavingName(true);
    setErrorMsg(null);
    setFeedback(null);

    try {
      await onUpdateName(trimmed);
      setIsEditingName(false);
      setFeedback("Nome atualizado e salvo no SQLite com sucesso.");
    } catch (err) {
      setErrorMsg(err?.message || "Não foi possível salvar o nome.");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleConfirmCharacter(selectedSlot) {
    setErrorMsg(null);
    setFeedback(null);
    try {
      await onChangeCharacter(selectedSlot.id);
      setIsChangingCharacter(false);
      setFeedback(`Personagem alterado para ${selectedSlot.name} e persistido no SQLite.`);
    } catch (err) {
      setErrorMsg(err?.message || "Não foi possível alterar o personagem.");
    }
  }

  const attributeRows = [
    {
      key: "vida",
      label: "Vida",
      description: "Quantidade de vida do personagem",
      currentDisplay: `${atributos.vidaAtual} / ${atributos.vidaFinal}`,
      base: atributos.vidaBase,
      modifier: atributos.vidaModificador,
      final: atributos.vidaFinal,
      accent: "#EF4444",
    },
    {
      key: "energia",
      label: "Energia",
      description: `Disponível para movimentação (${atributos.consumoEnergiaPorKm} de energia/km)`,
      currentDisplay: `${atributos.energiaAtual} / ${atributos.energiaMaximaFinal}`,
      base: atributos.energiaBase,
      modifier: atributos.energiaModificador,
      final: atributos.energiaMaximaFinal,
      accent: "#38BDF8",
    },
    {
      key: "dano",
      label: "Dano",
      description: "Dano causado pelo personagem",
      currentDisplay: `${atributos.danoFinal}`,
      base: atributos.danoBase,
      modifier: atributos.danoModificador,
      final: atributos.danoFinal,
      accent: "#F59E0B",
    },
    {
      key: "defesa",
      label: "Defesa",
      description: "Reduz o dano sofrido pelo personagem",
      currentDisplay: `${atributos.defesaFinal}`,
      base: atributos.defesaBase,
      modifier: atributos.defesaModificador,
      final: atributos.defesaFinal,
      accent: "#10B981",
    },
    {
      key: "velocidade",
      label: "Velocidade",
      description: "Define iniciativa de turno e eficiência de energia na rota",
      currentDisplay: `${atributos.velocidadeFinal}`,
      base: atributos.velocidadeBase,
      modifier: atributos.velocidadeModificador,
      final: atributos.velocidadeFinal,
      accent: "#A855F7",
    },
  ];

  const buffsAtivos = filtrarBuffsAtivosUnicosPorAtributo(
    livePlayerState?.buffs || [],
    nowMs,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu de Status do Jogador"
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
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >

        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            borderBottom: "1px solid #2E3B30",
            paddingBottom: 14,
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#C89B5C",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Sistema do Jogador • Persistência SQLite
            </span>
            <h2 style={{ margin: "4px 0 0 0", fontSize: 28, fontWeight: 700 }}>
              Status do Jogador
            </h2>
          </div>

          <div
            style={{
              background: "#1B241D",
              border: "2px solid #C89B5C",
              borderRadius: 10,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "#C89B5C",
                  textTransform: "uppercase",
                }}
              >
                Nível de Poder
              </div>
              <div style={{ fontSize: 11, color: "#8A9A8C" }}>
                (Vida × (Dano + Defesa)) / 50
              </div>
            </div>
            <div
              data-testid="player-power-level"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#EDE6D3",
              }}
            >
              {atributos.nivelDePoder}
            </div>
          </div>
        </header>

        {feedback && (
          <div
            style={{
              padding: "10px 14px",
              background: "#162A1E",
              border: "1px solid #10B981",
              borderRadius: 6,
              color: "#A7F3D0",
              fontSize: 13,
            }}
          >
            {feedback}
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              background: "#3B1818",
              border: "1px solid #EF4444",
              borderRadius: 6,
              color: "#FCA5A5",
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}

        {isChangingCharacter ? (
          <div
            style={{
              background: "#161D18",
              border: "1px solid #2E3B30",
              borderRadius: 12,
              padding: "16px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CharacterSelectScreen
              coords={coords}
              currentCharacterId={personagemAtual.id}
              headerBadge="Menu Status • Troca de Personagem"
              confirmLabel="Confirmar Personagem"
              onBack={() => setIsChangingCharacter(false)}
              onSelectCharacter={handleConfirmCharacter}
            />
          </div>
        ) : (
          <>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 16,
              }}
            >

              <section
                style={{
                  background: "#18201A",
                  border: "1px solid #2E3B30",
                  borderRadius: 10,
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      color: "#C89B5C",
                      textTransform: "uppercase",
                    }}
                  >
                    Identificação do Jogador
                  </span>
                  <h3 style={{ margin: "6px 0 4px 0", fontSize: 18 }}>
                    Nome do Usuário
                  </h3>
                </div>

                {isEditingName ? (
                  <form
                    onSubmit={handleSaveName}
                    style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                  >
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={40}
                      aria-label="Nome do Usuário"
                      style={{
                        flex: 1,
                        minWidth: 180,
                        padding: "10px 12px",
                        background: "#101612",
                        border: "1px solid #C89B5C",
                        borderRadius: 6,
                        color: "#EDE6D3",
                        fontSize: 15,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSavingName}
                      style={{
                        padding: "10px 16px",
                        background: "#C89B5C",
                        border: "none",
                        borderRadius: 6,
                        color: "#161D18",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isSavingName ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(playerState?.nome || "Explorador");
                        setIsEditingName(false);
                      }}
                      style={{
                        padding: "10px 12px",
                        background: "transparent",
                        border: "1px solid #2E3B30",
                        borderRadius: 6,
                        color: "#8A9A8C",
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      background: "#121814",
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: "1px solid #26332A",
                    }}
                  >
                    <span
                      data-testid="player-name-display"
                      style={{ fontSize: 20, fontWeight: 700, color: "#EDE6D3" }}
                    >
                      {playerState?.nome || "Explorador"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(playerState?.nome || "Explorador");
                        setIsEditingName(true);
                      }}
                      style={{
                        padding: "8px 14px",
                        background: "#26332A",
                        border: "1px solid #C89B5C",
                        borderRadius: 6,
                        color: "#EDE6D3",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Editar Nome
                    </button>
                  </div>
                )}
              </section>

              <section
                style={{
                  background: "#18201A",
                  border: "1px solid #2E3B30",
                  borderRadius: 10,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    title={charVisual.shapeLabel}
                    style={{
                      width: 58,
                      height: 58,
                      background: "#101612",
                      border: `2px solid ${charVisual.borderColor || "#C89B5C"}`,
                      boxShadow: `0 0 14px ${charVisual.glow}`,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={getCharacterConfig(personagemAtual.nome || personagemAtual.id).icon}
                      alt={personagemAtual.nome}
                      style={{
                        width: 50,
                        height: 50,
                        objectFit: "contain",
                        imageRendering: "pixelated",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.parentNode) {
                          e.currentTarget.parentNode.style.background = charVisual.color;
                        }
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11,
                        color: "#C89B5C",
                        textTransform: "uppercase",
                      }}
                    >
                      Personagem Atual
                    </span>
                    <div
                      data-testid="current-character-name"
                      style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}
                    >
                      {personagemAtual.nome}
                    </div>
                    <div style={{ fontSize: 12, color: "#8A9A8C", marginTop: 2 }}>
                      {personagemAtual.descricao || "Explorador ativo"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangingCharacter(true)}
                  style={{
                    padding: "10px 14px",
                    background: "#C89B5C",
                    border: "none",
                    borderRadius: 6,
                    color: "#161D18",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Trocar Personagem
                </button>
              </section>
            </div>

            <section
              style={{
                background: "#18201A",
                border: "1px solid #2E3B30",
                borderRadius: 10,
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      color: "#C89B5C",
                      textTransform: "uppercase",
                    }}
                  >
                    Atributo Base → Modificadores → Atributo Final
                  </span>
                  <h3 style={{ margin: "4px 0 0 0", fontSize: 20 }}>
                    Atributos do Personagem
                  </h3>
                </div>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: "#8A9A8C",
                  }}
                >
                  Fórmula Energia: distância_km × (10 / (2 ^ (velocidade / 100)))
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 12,
                }}
              >
                {attributeRows.map((attr) => (
                  <div
                    key={attr.key}
                    style={{
                      background: "#121814",
                      border: "1px solid #26332A",
                      borderLeft: `4px solid ${attr.accent}`,
                      borderRadius: 8,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 700 }}>
                        {attr.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#EDE6D3",
                        }}
                      >
                        {attr.currentDisplay}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#8A9A8C" }}>
                      {attr.description}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        paddingTop: 6,
                        borderTop: "1px dashed #26332A",
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11,
                        color: "#7C8C7E",
                      }}
                    >
                      <span>Base: {attr.base}</span>
                      <span
                        data-testid={`attr-mod-${attr.key}`}
                        style={{
                          color: attr.modifier > 0 ? "#34D399" : "#7C8C7E",
                          fontWeight: attr.modifier !== 0 ? 700 : 400,
                        }}
                      >
                        Mod: {attr.modifier >= 0 ? `+${attr.modifier}` : attr.modifier}
                      </span>
                      <span style={{ color: "#C89B5C" }}>Final: {attr.final}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                background: "#18201A",
                border: "1px solid #2E3B30",
                borderRadius: 10,
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#C89B5C",
                    textTransform: "uppercase",
                  }}
                >
                  Buffs Ativos ({buffsAtivos.length})
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: "#7C8C7E",
                  }}
                >
                  Estrutura preparada para modificadores temporários
                </span>
              </div>

              {buffsAtivos.length === 0 ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "#8A9A8C",
                    padding: "8px 0",
                  }}
                >
                  Nenhum buff ativo no momento. A estrutura de modificadores de buffs está integrada ao cálculo de atributos.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {buffsAtivos.map((buff) => {
                    const attr = identificarAtributoBuff(buff);
                    const visual = getBuffPlaceholder(buff.placeholderKey || attr);
                    const segRestantes = calcularSegundosRestantesBuff(buff, nowMs);
                    const isLastMinute = segRestantes <= 60;
                    return (
                      <div
                        key={buff.id}
                        style={{
                          padding: "8px 12px",
                          background: "#121814",
                          border: `1px solid ${visual.border || "#C89B5C"}`,
                          borderRadius: 6,
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ color: visual.accent, fontWeight: 700 }}>
                          {visual.symbol}
                        </span>
                        <div>
                          <strong>{buff.nome}</strong>{" "}
                          <span style={{ color: "#9CAEA0" }}>
                            ({buff.descricao})
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontWeight: 700,
                            color: isLastMinute ? "#EF4444" : "#34D399",
                          }}
                        >
                          {formatarContadorBuff(segRestantes)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <FullScreenMenuCloseButton onClose={onClose} />
    </div>
  );
}
