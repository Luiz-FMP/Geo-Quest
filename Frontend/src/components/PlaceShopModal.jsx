import { useState } from "react";
import {
  getItemPlaceholder,
  getRarityVisual,
} from "../config/placeholderAssets";
import { FullScreenMenuCloseButton } from "./PlayerBottomMenu";

const TOTAL_SHOP_SLOTS = 10;
const TOTAL_BACKPACK_SLOTS = 50;

const SHOP_PLACEHOLDER_SLOTS = Array.from({ length: TOTAL_SHOP_SLOTS }).map(
  (_, idx) => ({
    slotNumber: idx + 1,
    code: `SLOT-${String(idx + 1).padStart(2, "0")}`,
    name: `Produto Placeholder #${idx + 1}`,
    price: 0,
    description: "WIP",
    placeholderKey: "item_placeholder",
  }),
);

/**
 * Interface da Loja (Categoria: Shopping, exceto shopping_mall).
 * Segue a especificação da Seção 11:
 * - Parte superior: barra horizontal com 10 slots maiores que os da mochila, placeholder visual e preço 0 logo abaixo.
 * - Parte inferior: área da mochila (5x10) reutilizando a estrutura visual do inventário.
 * - Seleção de produto: pequeno menu com placeholder, identificação do slot, preço 0, descrição WIP e área de confirmação de compra sem realizar transação.
 */
export default function PlaceShopModal({ place, playerState, onClose }) {
  const [selectedShopSlot, setSelectedShopSlot] = useState(null);
  const [activeBackpackTab, setActiveBackpackTab] = useState("Equipavel");
  const [purchaseNotice, setPurchaseNotice] = useState(null);

  const moedas = playerState?.moedas ?? playerState?.atributos?.moedas ?? 0;
  const mochilaItems = Array.isArray(playerState?.mochila)
    ? playerState.mochila
    : [];

  const itemsInActiveTab = mochilaItems.filter(
    (item) =>
      (item.categoriaAba || item.categoria || "Equipavel").toLowerCase() ===
      activeBackpackTab.toLowerCase(),
  );

  const countEquipaveis = mochilaItems.filter(
    (i) => (i.categoriaAba || i.categoria || "Equipavel") === "Equipavel",
  ).length;

  const countConsumiveis = mochilaItems.filter(
    (i) => (i.categoriaAba || i.categoria) === "Consumivel",
  ).length;

  function findItemAtSlot(slotIndex) {
    return (
      itemsInActiveTab.find((item) => item.slotIndice === slotIndex) || null
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Loja — ${place?.name || "Shopping"}`}
      data-testid="place-shop-modal"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "#121814",
        color: "#EDE6D3",
        zIndex: 1180,
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
          maxWidth: 1140,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          flex: 1,
        }}
      >
        {/* Cabeçalho da Loja */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            borderBottom: "1px solid #2E3B30",
            paddingBottom: 12,
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#06B6D4",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Shopping • Loja do Local
            </span>
            <h2 style={{ margin: "2px 0 0 0", fontSize: 26, fontWeight: 700 }}>
              {place?.name || "Loja"}
            </h2>
          </div>

          <div
            style={{
              background: "#18201A",
              border: "1px solid #C89B5C",
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              color: "#EDE6D3",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "#C89B5C" }}>◈ Moedas:</span>
            <strong data-testid="shop-player-coins">{moedas}</strong>
          </div>
        </header>

        {/* PARTE SUPERIOR: Barra horizontal contendo 10 slots maiores que os da mochila + preço em moedas abaixo */}
        <section
          aria-label="Produtos da Loja"
          style={{
            background: "#18201A",
            border: "1px solid #2E3B30",
            borderRadius: 12,
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
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
                Parte Superior • Vitrine da Loja (10 Slots)
              </span>
              <h3 style={{ margin: "4px 0 0 0", fontSize: 18 }}>
                Produtos Disponíveis (Placeholders)
              </h3>
            </div>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#8A9A8C",
              }}
            >
              Clique em um slot para inspecionar o produto
            </span>
          </div>

          <div
            data-testid="shop-top-slots-bar"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(10, minmax(76px, 1fr))",
              gap: 10,
              overflowX: "auto",
              background: "#121814",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #26332A",
            }}
          >
            {SHOP_PLACEHOLDER_SLOTS.map((product) => {
              const isSelected =
                selectedShopSlot?.slotNumber === product.slotNumber;
              const visual = getItemPlaceholder(product.placeholderKey);

              return (
                <div
                  key={product.slotNumber}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {/* Slot de item (maior que os slots da mochila) */}
                  <button
                    type="button"
                    data-testid={`shop-slot-${product.slotNumber}`}
                    onClick={() => {
                      setPurchaseNotice(null);
                      setSelectedShopSlot(product);
                    }}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      minHeight: 76,
                      background: isSelected ? "#1F2A22" : "#171F19",
                      border: isSelected
                        ? "2px solid #C89B5C"
                        : "1px solid #2E3B30",
                      borderRadius: 8,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      cursor: "pointer",
                      color: "#EDE6D3",
                      position: "relative",
                      padding: 6,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 6,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 9,
                        color: "#5C6B5E",
                      }}
                    >
                      #{product.slotNumber}
                    </span>
                    <span
                      style={{
                        fontSize: 22,
                        color: visual.accent,
                        lineHeight: 1,
                      }}
                    >
                      {visual.symbol}
                    </span>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#EDE6D3",
                      }}
                    >
                      {product.code}
                    </span>
                  </button>

                  {/* Preço em moedas logo abaixo de cada slot */}
                  <div
                    data-testid={`shop-slot-price-${product.slotNumber}`}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#C89B5C",
                      background: "#141B16",
                      border: "1px solid #26332A",
                      borderRadius: 4,
                      padding: "2px 8px",
                      width: "100%",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    {product.price} Moedas
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PARTE INFERIOR: Área semelhante à mochila do inventário */}
        <section
          aria-label="Mochila do Jogador na Loja"
          style={{
            background: "#18201A",
            border: "1px solid #2E3B30",
            borderRadius: 12,
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
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
                Parte Inferior • Mochila do Jogador (5×10 • 50 Slots)
              </span>
              <h3 style={{ margin: "4px 0 0 0", fontSize: 18 }}>
                Mochila do Inventário
              </h3>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setActiveBackpackTab("Equipavel")}
                style={{
                  padding: "7px 12px",
                  background:
                    activeBackpackTab === "Equipavel" ? "#C89B5C" : "#121814",
                  border: "1px solid #C89B5C",
                  borderRadius: 6,
                  color:
                    activeBackpackTab === "Equipavel" ? "#161D18" : "#EDE6D3",
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
                onClick={() => setActiveBackpackTab("Consumivel")}
                style={{
                  padding: "7px 12px",
                  background:
                    activeBackpackTab === "Consumivel" ? "#C89B5C" : "#121814",
                  border: "1px solid #C89B5C",
                  borderRadius: 6,
                  color:
                    activeBackpackTab === "Consumivel" ? "#161D18" : "#EDE6D3",
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

          <div
            data-testid="shop-backpack-grid"
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
              const rarityStyle = item ? getRarityVisual(item.raridade) : null;
              const itemVisual = item
                ? getItemPlaceholder(item.placeholderKey)
                : null;

              return (
                <div
                  key={slotIdx}
                  style={{
                    aspectRatio: "1 / 1",
                    minHeight: 44,
                    background: item ? rarityStyle.bg : "#171F19",
                    border: item
                      ? `2px solid ${rarityStyle.border}`
                      : "1px solid #26332A",
                    borderRadius: 6,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
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
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
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
        </section>
      </div>

      {/* Submenu de Seleção de Produto (Seção 11.2) */}
      {selectedShopSlot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detalhes do Produto Selecionado"
          data-testid="shop-product-selection-modal"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 14, 11, 0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1250,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#1B241D",
              border: "1px solid #C89B5C",
              borderRadius: 12,
              maxWidth: 380,
              width: "100%",
              padding: "22px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
              color: "#EDE6D3",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "#C89B5C",
                  textTransform: "uppercase",
                }}
              >
                Seleção de Produto • Slot #{selectedShopSlot.slotNumber}
              </span>
              <button
                type="button"
                aria-label="Fechar seleção de produto"
                onClick={() => setSelectedShopSlot(null)}
                style={{
                  background: "transparent",
                  border: "1px solid #2E3B30",
                  borderRadius: 4,
                  color: "#8A9A8C",
                  cursor: "pointer",
                  padding: "2px 8px",
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            </div>

            {/* Placeholder do Produto + Nome/Identificação + Preço */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#121814",
                border: "1px solid #26332A",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  background: "#171F19",
                  border: "2px dashed #C89B5C",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 20, color: "#C89B5C" }}>◆</span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    color: "#EDE6D3",
                  }}
                >
                  {selectedShopSlot.code}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {selectedShopSlot.name}
                </div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 13,
                    color: "#C89B5C",
                    marginTop: 4,
                  }}
                >
                  Preço: <strong>{selectedShopSlot.price} Moedas</strong>
                </div>
              </div>
            </div>

            {/* Descrição: WIP */}
            <div
              style={{
                padding: "10px 12px",
                background: "#121814",
                border: "1px dashed #3A4A3C",
                borderRadius: 8,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: "#9CAEA0",
              }}
            >
              Descrição: <strong style={{ color: "#EDE6D3" }}>WIP</strong> — Em
              desenvolvimento.
            </div>

            {/* Área para confirmação de compra (preparada visualmente, sem transação real) */}
            <div
              style={{
                background: "#141B16",
                border: "1px solid #2E3B30",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                flexDirection: "column",
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
                Confirmação de Compra
              </span>

              {purchaseNotice && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#FBBF24",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {purchaseNotice}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  data-testid="shop-confirm-purchase-btn"
                  onClick={() =>
                    setPurchaseNotice(
                      "WIP — Em desenvolvimento. Nenhuma transação ou desconto de moedas é realizado nesta etapa.",
                    )
                  }
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "#26332A",
                    border: "1px solid #C89B5C",
                    borderRadius: 6,
                    color: "#EDE6D3",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Confirmar Compra (WIP)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShopSlot(null)}
                  style={{
                    padding: "10px 12px",
                    background: "transparent",
                    border: "1px solid #2E3B30",
                    borderRadius: 6,
                    color: "#8A9A8C",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FullScreenMenuCloseButton onClose={onClose} />
    </div>
  );
}

