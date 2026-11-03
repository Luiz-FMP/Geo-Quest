import { PLACE_FUNCTIONS } from "../utils/placeCategories";

const DISABLED_GRAY_BUTTON_STYLE = {
  width: "100%",
  padding: "12px 18px",
  background: "#262B28",
  border: "1px solid #3E4641",
  borderRadius: 6,
  color: "#7B857E",
  fontFamily: "'IBM Plex Mono', monospace",
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: "0.06em",
  cursor: "not-allowed",
  opacity: 0.85,
};

export default function PlaceArrivalModal({
  place,
  routeSummary,
  hasArrived = false,
  isCalculatingRoute = false,
  playerEnergy = 100,
  onGoToPlace,
  onStartArenaCombat,
  onStartBossCombat,
  onOpenShop,
  onClose,
}) {
  if (!place) return null;

  const isBossSpecial =
    place.isBossSpecial ||
    place.subcategory === "shopping_mall" ||
    place.placeFunction === PLACE_FUNCTIONS.BOSS;

  const isArena =
    !isBossSpecial &&
    (place.placeFunction === PLACE_FUNCTIONS.ARENA ||
      place.category === "Entertainment and Recreation");

  const isShop =
    !isBossSpecial &&
    (place.placeFunction === PLACE_FUNCTIONS.SHOP ||
      place.category === "Shopping");

  const descriptionText = isBossSpecial
    ? "Local especial de Boss. Enfrente o Boss deste território em combate."
    : isArena
      ? "Este local permite enfrentar desafios de combate em uma arena."
      : isShop
        ? "Explore esta loja e confira os produtos disponíveis."
        : "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.";

  const requiredEnergy = Number(routeSummary?.energiaConsumida ?? 0);
  const distanceKm = Number(routeSummary?.distanciaKm ?? 0);
  const currentEnergy = Number(playerEnergy ?? 0);
  const hasEnoughEnergy = currentEnergy >= requiredEnergy;

  const canClickGo = !hasArrived && !isCalculatingRoute && hasEnoughEnergy;
  const canClickPlaceAction =
    hasArrived && (isBossSpecial || isArena || isShop);

  const goButtonLabel = hasArrived
    ? "IR (VOCÊ JÁ ESTÁ NESTE LOCAL)"
    : isCalculatingRoute
      ? "CALCULANDO ROTA..."
      : !hasEnoughEnergy
        ? `IR — ENERGIA INSUFICIENTE (${requiredEnergy.toFixed(1)} necessária)`
        : `IR (${distanceKm.toFixed(2)} km • -${requiredEnergy.toFixed(1)} Energia)`;

  const placeActionLabel = isBossSpecial
    ? "BOSS"
    : isArena
      ? "COMBATE"
      : isShop
        ? "LOJA"
        : "EM DESENVOLVIMENTO";

  const activePlaceActionStyle = isBossSpecial
    ? {
        width: "100%",
        padding: "12px 18px",
        background: "#D97706",
        border: "1px solid #FCD34D",
        borderRadius: 6,
        color: "#FFFFFF",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "0.06em",
        cursor: "pointer",
      }
    : isArena
      ? {
          width: "100%",
          padding: "12px 18px",
          background: "#DC2626",
          border: "1px solid #FCA5A5",
          borderRadius: 6,
          color: "#FFFFFF",
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: "0.06em",
          cursor: "pointer",
        }
      : {
          width: "100%",
          padding: "12px 18px",
          background: "#C89B5C",
          border: "none",
          borderRadius: 6,
          color: "#161D18",
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: "0.06em",
          cursor: "pointer",
        };

  function handlePlaceActionClick() {
    if (!canClickPlaceAction) return;
    if (isBossSpecial && onStartBossCombat) {
      onStartBossCombat(place);
    } else if (isArena && onStartArenaCombat) {
      onStartArenaCombat(place);
    } else if (isShop && onOpenShop) {
      onOpenShop(place);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-modal-title"
      data-testid="place-submenu-modal"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 14, 11, 0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#1B241D",
          border: `1px solid ${isBossSpecial ? "#F59E0B" : isArena ? "#EF4444" : "#C89B5C"}`,
          borderRadius: 12,
          maxWidth: 440,
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
          aria-label="Fechar menu do local"
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

        {/* 1. Nome do Place */}
        <h3
          id="place-modal-title"
          data-testid="place-menu-name"
          style={{
            margin: "0 32px 12px 0",
            fontSize: 22,
            fontWeight: 700,
            color: "#EDE6D3",
            lineHeight: 1.25,
          }}
        >
          {place.name}
        </h3>

        {/* 2. Categoria do Place (+ identificação especial de Boss quando shopping_mall) */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <div
            data-testid="place-menu-category"
            style={{
              display: "inline-block",
              padding: "5px 10px",
              borderRadius: 6,
              background: "#26332A",
              border: `1px solid ${place.color || "#C89B5C"}`,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: "#EDE6D3",
            }}
          >
            Categoria: {place.category}
          </div>

          {isBossSpecial && (
            <div
              data-testid="place-menu-boss-badge"
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: 6,
                background: "#451A03",
                border: "1px solid #F59E0B",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                color: "#FCD34D",
              }}
            >
              Local Especial de Boss (shopping_mall)
            </div>
          )}

          {routeSummary && (
            <div
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: 6,
                background: !hasArrived && !hasEnoughEnergy ? "#3B1818" : "#13293D",
                border: `1px solid ${!hasArrived && !hasEnoughEnergy ? "#EF4444" : "#38BDF8"}`,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: !hasArrived && !hasEnoughEnergy ? "#FCA5A5" : "#38BDF8",
              }}
            >
              {distanceKm.toFixed(2)} km • Custo: {requiredEnergy.toFixed(2)} Energia
            </div>
          )}
        </div>

        {/* 3. Breve descrição da função daquele tipo de local no jogo */}
        <div
          data-testid="place-menu-description"
          style={{
            padding: "12px 14px",
            background: "#131915",
            border: "1px dashed #3A4A3C",
            borderRadius: 8,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: "#9CAEA0",
            marginBottom: 18,
            lineHeight: 1.5,
          }}
        >
          {descriptionText}
        </div>

        {/* 4. Duas opções na parte inferior:
             - Opção de cima: IR para o Place (fica cinza se não tiver energia suficiente ou se já chegou)
             - Opção de baixo: Ação do próprio Place (fica cinza até o personagem chegar lá) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            data-testid="place-action-go"
            disabled={!canClickGo}
            onClick={() => canClickGo && onGoToPlace && onGoToPlace(place)}
            style={
              canClickGo
                ? {
                    width: "100%",
                    padding: "12px 18px",
                    background: "#0284C7",
                    border: "1px solid #38BDF8",
                    borderRadius: 6,
                    color: "#FFFFFF",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                  }
                : DISABLED_GRAY_BUTTON_STYLE
            }
          >
            {goButtonLabel}
          </button>

          <button
            type="button"
            data-testid={
              isBossSpecial
                ? "place-action-boss"
                : isArena
                  ? "place-action-combat"
                  : isShop
                    ? "place-action-shop"
                    : "place-action-wip"
            }
            disabled={!canClickPlaceAction}
            onClick={handlePlaceActionClick}
            style={
              canClickPlaceAction
                ? activePlaceActionStyle
                : DISABLED_GRAY_BUTTON_STYLE
            }
          >
            {placeActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
