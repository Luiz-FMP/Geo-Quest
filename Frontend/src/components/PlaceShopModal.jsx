import { useState } from "react";
import {
  getItemPlaceholder,
  getRarityVisual,
} from "../config/placeholderAssets";
import {
  ALLOWED_CATEGORIES,
  getTranslatedSubcategory,
} from "../utils/placeCategories";
import { FullScreenMenuCloseButton } from "./PlayerBottomMenu";

const TOTAL_SHOP_SLOTS = 10;
const TOTAL_BACKPACK_SLOTS = 50;

function buildPreparedShopSlots(shopCategory) {
  const isConsumableShop = shopCategory === ALLOWED_CATEGORIES.FOOD_AND_DRINK;
  const slotPrefix = isConsumableShop ? "CONS" : "EQUIP";

  return Array.from({ length: TOTAL_SHOP_SLOTS }).map((_, idx) => ({
    slotNumber: idx + 1,
    code: `${slotPrefix}-${String(idx + 1).padStart(2, "0")}`,
    name: isConsumableShop
      ? `Espaço de Consumível #${idx + 1}`
      : `Espaço de Equipamento #${idx + 1}`,
    price: 0,
    description: "WIP",
    placeholderKey: "item_placeholder",
    catalogType: isConsumableShop ? "Consumivel" : "Equipavel",
  }));
}

const SHOP_CATEGORY_CONFIG = {
  [ALLOWED_CATEGORIES.SHOPPING]: {
    badgeLabel: "Shopping • Loja de Equipamentos",
    topSectionTitle: "Espaços de Equipamentos Disponíveis",
    topSectionSubtitle:
      "Estrutura preparada para equipamentos futuros (sem itens à venda nesta etapa)",
    inventoryTab: "Equipavel",
    inventoryLabel: "Inventário de Equipamentos",
    inventorySectionSubtitle:
      "Parte Inferior • Inventário de Equipamentos do Jogador (5×10 • 50 Slots)",
  },
  [ALLOWED_CATEGORIES.FOOD_AND_DRINK]: {
    badgeLabel: "Food and Drink • Loja de Consumíveis",
    topSectionTitle: "Espaços de Consumíveis Disponíveis",
    topSectionSubtitle:
      "Estrutura preparada para consumíveis futuros (sem itens à venda nesta etapa)",
    inventoryTab: "Consumivel",
    inventoryLabel: "Inventário de Consumíveis",
    inventorySectionSubtitle:
      "Parte Inferior • Inventário de Consumíveis do Jogador (5×10 • 50 Slots)",
  },
  [ALLOWED_CATEGORIES.SERVICES]: {
    badgeLabel: "Services • Loja de Buffs",
    defaultBuffCostCoins: 50,
    defaultDescription:
      "Estabelecimento especializado em serviços que concedem aprimoramentos temporários (buffs) ao explorador.",
  },
};

export default function PlaceShopModal({ place, playerState, onClose }) {
  const [selectedShopSlot, setSelectedShopSlot] = useState(null);
  const [purchaseNotice, setPurchaseNotice] = useState(null);
  const [serviceBuffWipNotice, setServiceBuffWipNotice] = useState(null);

  const category = place?.category || ALLOWED_CATEGORIES.SHOPPING;
  const isServicesBuffShop = category === ALLOWED_CATEGORIES.SERVICES;
  const isFoodAndDrinkShop = category === ALLOWED_CATEGORIES.FOOD_AND_DRINK;

  const shopConfig =
    SHOP_CATEGORY_CONFIG[category] ||
    SHOP_CATEGORY_CONFIG[ALLOWED_CATEGORIES.SHOPPING];

  const translatedSubcategory = getTranslatedSubcategory(
    place?.subcategory,
    category,
  );

  const moedas = playerState?.moedas ?? playerState?.atributos?.moedas ?? 0;
  const mochilaItems = Array.isArray(playerState?.mochila)
    ? playerState.mochila
    : [];

  const targetInventoryCategory = isFoodAndDrinkShop
    ? "Consumivel"
    : "Equipavel";

  const itemsInShopInventory = mochilaItems.filter(
    (item) =>
      (item.categoriaAba || item.categoria || "Equipavel").toLowerCase() ===
      targetInventoryCategory.toLowerCase(),
  );

  const preparedShopSlots = buildPreparedShopSlots(category);

  function findItemAtSlot(slotIndex) {
    return (
      itemsInShopInventory.find((item) => item.slotIndice === slotIndex) || null
    );
  }

  if (isServicesBuffShop) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Loja de Buffs — ${place?.name || "Services"}`}
        data-testid="place-services-buff-modal"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 14, 11, 0.78)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1180,
          padding: 20,
        }}
      >
        <div
          style={{
            background: "#1B241D",
            border: "1px solid #8B5CF6",
            borderRadius: 12,
            maxWidth: 460,
            width: "100%",
            padding: "24px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.65)",
            color: "#EDE6D3",
            textAlign: "left",
            position: "relative",
          }}
        >
          <button
            type="button"
            aria-label="Fechar loja de buffs"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "transparent",
              border: "1px solid #2E3B30",
              borderRadius: 6,
              color: "#8A9A8C",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          <h3
            data-testid="services-shop-name"
            style={{
              margin: "0 32px 6px 0",
              fontSize: 22,
              fontWeight: 700,
              color: "#EDE6D3",
              lineHeight: 1.25,
            }}
          >
            {place?.name || "Serviço Local"}
          </h3>

          <div
            data-testid="services-shop-subcategory"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: "#C4B5FD",
              marginBottom: 12,
            }}
          >
            {translatedSubcategory} • Categoria: {category}
          </div>

          <div
            data-testid="services-shop-description"
            style={{
              padding: "12px 14px",
              background: "#131915",
              border: "1px dashed #3A4A3C",
              borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: "#9CAEA0",
              marginBottom: 14,
              lineHeight: 1.5,
            }}
          >
            {shopConfig.defaultDescription}
          </div>

          <div
            data-testid="services-buff-status-panel"
            style={{
              padding: "10px 12px",
              background: "#131D17",
              border: "1px solid #26332A",
              borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "#EDE6D3",
              marginBottom: 14,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div>
              Saldo atual:{" "}
              <strong style={{ color: "#FBBF24" }}>{moedas}g</strong>
            </div>
            <div>
              Serviço disponível: <strong>Aprimoramento temporário (Buff)</strong>{" "}
              • Custo: <strong>50 moedas (50g)</strong>
            </div>
          </div>

          {serviceBuffWipNotice && (
            <div
              data-testid="services-buff-wip-notice"
              style={{
                padding: "10px 12px",
                background: "rgba(245, 158, 11, 0.14)",
                border: "1px solid #F59E0B",
                borderRadius: 8,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#FCD34D",
                marginBottom: 14,
                lineHeight: 1.45,
              }}
            >
              {serviceBuffWipNotice}
            </div>
          )}

          <button
            type="button"
            data-testid="services-buy-buff-btn"
            onClick={() =>
              setServiceBuffWipNotice(
                "WIP — O sistema de buffs temporários ainda está em desenvolvimento. Nenhuma moeda foi descontada e nenhum atributo foi modificado.",
              )
            }
            style={{
              width: "100%",
              padding: "12px 18px",
              background: "#6D28D9",
              border: "1px solid #C4B5FD",
              borderRadius: 6,
              color: "#FFFFFF",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            COMPRAR APRIMORAMENTO TEMPORÁRIO (50g)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Loja — ${place?.name || category}`}
      data-testid="place-shop-modal"
      data-shop-category={category}
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
              data-testid="shop-category-header-badge"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: isFoodAndDrinkShop ? "#F97316" : "#06B6D4",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {shopConfig.badgeLabel}
            </span>
            <h2 style={{ margin: "2px 0 0 0", fontSize: 26, fontWeight: 700 }}>
              {place?.name || "Loja"}
            </h2>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#8A9A8C",
                marginTop: 2,
              }}
            >
              {translatedSubcategory}
            </div>
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
                {shopConfig.topSectionTitle}
              </h3>
            </div>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#8A9A8C",
              }}
            >
              {shopConfig.topSectionSubtitle}
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
            {preparedShopSlots.map((product) => {
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

        <section
          aria-label={shopConfig.inventoryLabel}
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
                {shopConfig.inventorySectionSubtitle}
              </span>
              <h3
                data-testid="shop-bottom-inventory-title"
                style={{ margin: "4px 0 0 0", fontSize: 18 }}
              >
                {shopConfig.inventoryLabel}
              </h3>
            </div>

            <div
              data-testid="shop-active-inventory-badge"
              style={{
                padding: "7px 12px",
                background: "#C89B5C",
                border: "1px solid #C89B5C",
                borderRadius: 6,
                color: "#161D18",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {isFoodAndDrinkShop
                ? `Consumíveis (${itemsInShopInventory.length})`
                : `Equipamentos (${itemsInShopInventory.length})`}
            </div>
          </div>

          <div
            data-testid="shop-backpack-grid"
            data-inventory-type={targetInventoryCategory}
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
                Seleção de Espaço • Slot #{selectedShopSlot.slotNumber}
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
