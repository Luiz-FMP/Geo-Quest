import { useState } from "react";
import {
  EQUIPMENT_SLOT_PLACEHOLDERS,
  getItemPlaceholder,
  getRarityVisual,
} from "../../config/placeholderAssets";
import CharacterAnimatedSprite from "../combat/CharacterAnimatedSprite";
import { FullScreenMenuCloseButton } from "../PlayerBottomMenu";

const TOTAL_BACKPACK_SLOTS = 50; // 5 x 10

const SIDE_EQUIPMENT_SLOTS = [
  { key: "Cabeca", label: "Cabeça" },
  { key: "Superior", label: "Superior" },
  { key: "Inferior", label: "Inferior" },
  { key: "Maos", label: "Mãos" },
  { key: "Botas", label: "Botas" },
  { key: "Acessorio", label: "Acessório" },
];

const WEAPON_SLOT = { key: "Arma", label: "Arma" };

export default function PlayerInventoryModal({
  playerState,
  onMoveItem,
  onDeleteItem,
  onEquipItem,
  onUnequipItem,
  onSpawnDebugItem,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("Equipavel"); // "Equipavel" | "Consumivel"
  const [draggedItem, setDraggedItem] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [hoveredEquipSlot, setHoveredEquipSlot] = useState(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  const [selectedItemForMove, setSelectedItemForMove] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const personagemAtual = playerState?.personagemAtual || {
    id: playerState?.personagemId || 1,
    nome: "Miguel",
    placeholderKey: "char_1",
  };

  const mochilaItems = Array.isArray(playerState?.mochila)
    ? playerState.mochila
    : [];

  const equipamentosList = Array.isArray(playerState?.equipamentos)
    ? playerState.equipamentos
    : [];

  const itemsInActiveTab = mochilaItems.filter(
    (item) =>
      (item.categoriaAba || item.categoria || "Equipavel").toLowerCase() ===
      activeTab.toLowerCase(),
  );

  const countEquipaveis = mochilaItems.filter(
    (i) => (i.categoriaAba || i.categoria || "Equipavel") === "Equipavel",
  ).length;

  const countConsumiveis = mochilaItems.filter(
    (i) => (i.categoriaAba || i.categoria) === "Consumivel",
  ).length;

  function findItemAtSlot(slotIndex) {
    return itemsInActiveTab.find((item) => item.slotIndice === slotIndex) || null;
  }

  function findEquippedItem(slotKey) {
    const found = equipamentosList.find(
      (eq) => eq.slotKey?.toLowerCase() === slotKey.toLowerCase(),
    );
    return found?.itemEquipado || null;
  }

  async function handleDropOnBackpackSlot(targetSlotIndex) {
    setHoveredSlot(null);
    const itemToMove = draggedItem || selectedItemForMove;
    if (!itemToMove) return;

    setDraggedItem(null);
    setSelectedItemForMove(null);
    setErrorMessage(null);

    if (itemToMove.slotIndice === targetSlotIndex && !itemToMove.equipado) {
      return;
    }

    try {
      if (itemToMove.equipado && itemToMove.slotEquipado) {
        await onUnequipItem(itemToMove.slotEquipado, targetSlotIndex);
        setStatusMessage(
          `Equipamento '${itemToMove.nome}' devolvido ao slot ${targetSlotIndex + 1} da mochila.`,
        );
      } else {
        await onMoveItem(itemToMove.inventarioId, targetSlotIndex, activeTab);
        setStatusMessage(
          `Item '${itemToMove.nome}' movido para o slot #${targetSlotIndex + 1} (persistido no SQLite).`,
        );
      }
    } catch (err) {
      setErrorMessage(err?.message || "Erro ao mover item.");
    }
  }

  async function handleDropOnEquipmentSlot(slotKey) {
    setHoveredEquipSlot(null);
    const itemToEquip = draggedItem || selectedItemForMove;
    if (!itemToEquip) return;

    setDraggedItem(null);
    setSelectedItemForMove(null);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await onEquipItem(itemToEquip.inventarioId, slotKey);
      setStatusMessage(`Item '${itemToEquip.nome}' equipado em ${slotKey}.`);
    } catch (err) {
      setErrorMessage(
        err?.message ||
          "Este item não pode ser equipado neste slot no momento.",
      );
    }
  }

  async function handleDropOnTrash() {
    setIsHoveringTrash(false);
    const itemToDelete = draggedItem || selectedItemForMove;
    if (!itemToDelete) return;

    setDraggedItem(null);
    setSelectedItemForMove(null);
    setErrorMessage(null);

    try {
      await onDeleteItem(itemToDelete.inventarioId);
      setStatusMessage(
        `Item '${itemToDelete.nome}' descartado na lixeira e removido do SQLite.`,
      );
    } catch (err) {
      setErrorMessage(err?.message || "Erro ao remover item na lixeira.");
    }
  }

  function renderEquipmentSlotCard(slotDef) {
    const equippedItem = findEquippedItem(slotDef.key);
    const slotMeta =
      EQUIPMENT_SLOT_PLACEHOLDERS[slotDef.key] || {
        code: "EQP",
        label: slotDef.label,
      };
    const isHovered = hoveredEquipSlot === slotDef.key;

    return (
      <div
        key={slotDef.key}
        data-testid={`equip-slot-${slotDef.key}`}
        onDragOver={(e) => {
          e.preventDefault();
          setHoveredEquipSlot(slotDef.key);
        }}
        onDragLeave={() => setHoveredEquipSlot(null)}
        onDrop={(e) => {
          e.preventDefault();
          handleDropOnEquipmentSlot(slotDef.key);
        }}
        onClick={() => {
          if (selectedItemForMove) {
            handleDropOnEquipmentSlot(slotDef.key);
          }
        }}
        style={{
          background: isHovered ? "#243328" : "#141B16",
          border: isHovered ? "2px dashed #C89B5C" : "1px solid #2E3B30",
          borderRadius: 8,
          padding: "10px 8px",
          minHeight: 74,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          textAlign: "center",
          transition: "all 0.15s ease",
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: "#C89B5C",
            fontWeight: 700,
          }}
        >
          [{slotMeta.code}]
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#EDE6D3" }}>
          {slotDef.label}
        </span>
        {equippedItem ? (
          <div
            draggable
            onDragStart={() => setDraggedItem(equippedItem)}
            onDragEnd={() => setDraggedItem(null)}
            style={{
              marginTop: 2,
              padding: "3px 6px",
              background: "#1F2A22",
              border: "1px solid #38BDF8",
              borderRadius: 4,
              fontSize: 10,
              color: "#38BDF8",
              cursor: "grab",
            }}
          >
            {equippedItem.nome}
          </div>
        ) : (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "#5C6B5E",
            }}
          >
            Vazio
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu de Inventário e Equipamentos"
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
        padding: "20px 24px 96px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          flex: 1,
        }}
      >
        {/* Cabeçalho */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            borderBottom: "1px solid #2E3B30",
            paddingBottom: 10,
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
              Equipamentos (7 Slots) • Mochila 5×10 (50 Slots)
            </span>
            <h2 style={{ margin: "2px 0 0 0", fontSize: 26, fontWeight: 700 }}>
              Inventário do Jogador
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={async () => {
                setErrorMessage(null);
                try {
                  await onSpawnDebugItem();
                  setStatusMessage("Item de Debug adicionado à mochila e salvo no SQLite.");
                } catch (err) {
                  setErrorMessage(err?.message || "Não foi possível criar item de debug.");
                }
              }}
              style={{
                padding: "7px 12px",
                background: "#1B241D",
                border: "1px dashed #38BDF8",
                borderRadius: 6,
                color: "#38BDF8",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              + Gerar Item de Debug
            </button>
          </div>
        </header>

        {statusMessage && (
          <div
            style={{
              padding: "8px 14px",
              background: "#162A1E",
              border: "1px solid #10B981",
              borderRadius: 6,
              color: "#A7F3D0",
              fontSize: 12,
            }}
          >
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: "8px 14px",
              background: "#3B1818",
              border: "1px solid #EF4444",
              borderRadius: 6,
              color: "#FCA5A5",
              fontSize: 12,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Divisão em duas grandes áreas: Lado Esquerdo (Personagem + 7 Slots) | Lado Direito (Mochila 5x10 + Abas + Lixeira) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
            alignItems: "stretch",
            flex: 1,
          }}
        >
          {/* LADO ESQUERDO: Personagem e 7 Slots de Equipamento */}
          <section
            style={{
              background: "#18201A",
              border: "1px solid #2E3B30",
              borderRadius: 12,
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
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
                Lado Esquerdo • Equipamentos do Personagem
              </span>
              <h3 style={{ margin: "4px 0 0 0", fontSize: 18 }}>
                {personagemAtual.nome}
              </h3>
            </div>

            {/* Grade ao redor do personagem: 3 slots à esquerda, Personagem no centro, 3 slots à direita */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.25fr 1fr",
                gap: 12,
                alignItems: "center",
              }}
            >
              {/* 3 Slots Laterais Esquerdos: Cabeça, Superior, Inferior */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SIDE_EQUIPMENT_SLOTS.slice(0, 3).map((slot) =>
                  renderEquipmentSlotCard(slot),
                )}
              </div>

              {/* Visual Central do Personagem (Sprite Animado ou Quadrado Clássico) */}
              <div
                style={{
                  background: "#121814",
                  border: "1px solid #26332A",
                  borderRadius: 10,
                  minHeight: 248,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 120,
                  }}
                >
                  <CharacterAnimatedSprite
                    characterName={personagemAtual.nome}
                    action="mapIdle"
                    scale={1.05}
                    useProcedural={true}
                  />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE6D3" }}>
                    {personagemAtual.nome}
                  </div>
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      color: "#C89B5C",
                      marginTop: 3,
                    }}
                  >
                    {personagemAtual.descricao || "Personagem Ativo"}
                  </div>
                </div>
              </div>

              {/* 3 Slots Laterais Direitos: Mãos, Botas, Acessório */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SIDE_EQUIPMENT_SLOTS.slice(3, 6).map((slot) =>
                  renderEquipmentSlotCard(slot),
                )}
              </div>
            </div>

            {/* Abaixo do personagem: Slot de Arma (7º slot) */}
            <div
              style={{
                maxWidth: 240,
                width: "100%",
                margin: "0 auto",
              }}
            >
              {renderEquipmentSlotCard(WEAPON_SLOT)}
            </div>

            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#7C8C7E",
                textAlign: "center",
                borderTop: "1px solid #26332A",
                paddingTop: 10,
              }}
            >
              7 slots preparados (Cabeça, Superior, Inferior, Mãos, Botas, Acessório e Arma)
            </div>
          </section>

          {/* LADO DIREITO: Mochila 5x10 (50 slots) + Abas + Slot de Lixo */}
          <section
            style={{
              background: "#18201A",
              border: "1px solid #2E3B30",
              borderRadius: 12,
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            {/* Topo da Mochila + Abas Equipáveis e Consumíveis */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
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
                  Lado Direito • Mochila (50 Slots • 5×10)
                </span>
                <h3 style={{ margin: "4px 0 0 0", fontSize: 18 }}>
                  Mochila do Jogador
                </h3>
              </div>

              {/* Abas da Mochila */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("Equipavel")}
                  style={{
                    padding: "8px 14px",
                    background:
                      activeTab === "Equipavel" ? "#C89B5C" : "#121814",
                    border: "1px solid #C89B5C",
                    borderRadius: 6,
                    color: activeTab === "Equipavel" ? "#161D18" : "#EDE6D3",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Equipáveis ({countEquipaveis})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("Consumivel")}
                  style={{
                    padding: "8px 14px",
                    background:
                      activeTab === "Consumivel" ? "#C89B5C" : "#121814",
                    border: "1px solid #C89B5C",
                    borderRadius: 6,
                    color: activeTab === "Consumivel" ? "#161D18" : "#EDE6D3",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Consumíveis ({countConsumiveis})
                </button>
              </div>
            </div>

            {/* Grade de 50 Slots (10 colunas x 5 linhas = 5x10) */}
            <div
              data-testid="backpack-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, minmax(42px, 1fr))",
                gap: 6,
                background: "#121814",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #26332A",
              }}
            >
              {Array.from({ length: TOTAL_BACKPACK_SLOTS }).map((_, slotIdx) => {
                const item = findItemAtSlot(slotIdx);
                const isHovered = hoveredSlot === slotIdx;
                const isSelected =
                  selectedItemForMove &&
                  item &&
                  selectedItemForMove.inventarioId === item.inventarioId;
                const rarityStyle = item
                  ? getRarityVisual(item.raridade)
                  : null;
                const itemVisual = item
                  ? getItemPlaceholder(item.placeholderKey)
                  : null;

                return (
                  <div
                    key={slotIdx}
                    data-testid={`backpack-slot-${slotIdx}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoveredSlot(slotIdx);
                    }}
                    onDragLeave={() => setHoveredSlot(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnBackpackSlot(slotIdx);
                    }}
                    onClick={() => {
                      if (selectedItemForMove && !item) {
                        handleDropOnBackpackSlot(slotIdx);
                      } else if (item) {
                        setSelectedItemForMove(
                          isSelected ? null : item,
                        );
                      }
                    }}
                    title={
                      item
                        ? `${item.nome} | Categoria: ${item.categoria} | Raridade: ${item.raridade} (Arraste para outro slot ou para a lixeira)`
                        : `Slot #${slotIdx + 1} (Vazio)`
                    }
                    style={{
                      aspectRatio: "1 / 1",
                      minHeight: 46,
                      background: item
                        ? rarityStyle.bg
                        : isHovered
                          ? "#233227"
                          : "#171F19",
                      border: isSelected
                        ? "2px solid #FBBF24"
                        : isHovered
                          ? "2px dashed #38BDF8"
                          : item
                            ? `2px solid ${rarityStyle.border}`
                            : "1px solid #26332A",
                      borderRadius: 6,
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: item ? "grab" : selectedItemForMove ? "pointer" : "default",
                      userSelect: "none",
                      padding: 2,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: 4,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 8,
                        color: "#5C6B5E",
                      }}
                    >
                      {slotIdx + 1}
                    </span>

                    {item && (
                      <div
                        draggable
                        data-testid={`inventory-item-${item.codigo}`}
                        onDragStart={(e) => {
                          setDraggedItem(item);
                          e.dataTransfer.setData(
                            "text/plain",
                            String(item.inventarioId),
                          );
                        }}
                        onDragEnd={() => setDraggedItem(null)}
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            color: rarityStyle.color,
                            lineHeight: 1,
                          }}
                        >
                          {itemVisual.symbol}
                        </span>
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#EDE6D3",
                          }}
                        >
                          {itemVisual.code}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rodapé da Mochila: Detalhes do Item / Dica + Slot de Lixo no canto inferior direito */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 220,
                  background: "#121814",
                  border: "1px solid #26332A",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "#8A9A8C",
                }}
              >
                {itemsInActiveTab.length > 0 ? (
                  <div>
                    <strong style={{ color: "#EDE6D3" }}>
                      {itemsInActiveTab[0].nome}
                    </strong>{" "}
                    • Categoria:{" "}
                    <span style={{ color: "#C89B5C" }}>
                      {itemsInActiveTab[0].categoria}
                    </span>{" "}
                    • Raridade:{" "}
                    <span
                      style={{
                        color: getRarityVisual(itemsInActiveTab[0].raridade).color,
                        fontWeight: 700,
                      }}
                    >
                      {itemsInActiveTab[0].raridade}
                    </span>{" "}
                    (Slot #{(itemsInActiveTab[0].slotIndice ?? 0) + 1})
                  </div>
                ) : (
                  <span>
                    Nenhum item na aba {activeTab === "Equipavel" ? "Equipáveis" : "Consumíveis"}. Arraste itens entre slots ou para a lixeira.
                  </span>
                )}
              </div>

              {/* 20. Slot de Lixo no canto inferior direito da mochila */}
              <div
                data-testid="inventory-trash-slot"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsHoveringTrash(true);
                }}
                onDragLeave={() => setIsHoveringTrash(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnTrash();
                }}
                onClick={() => {
                  if (selectedItemForMove) {
                    handleDropOnTrash();
                  }
                }}
                title="Arraste um item para cá para excluí-lo permanentemente do inventário"
                style={{
                  width: 132,
                  height: 58,
                  background: isHoveringTrash ? "#451A1A" : "#221414",
                  border: isHoveringTrash
                    ? "2px dashed #EF4444"
                    : "1px solid #7F1D1D",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  color: "#FCA5A5",
                  cursor: selectedItemForMove ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  [LIXEIRA]
                </span>
                <span style={{ fontSize: 10, color: "#F87171" }}>
                  Soltar para excluir
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <FullScreenMenuCloseButton onClose={onClose} />
    </div>
  );
}

