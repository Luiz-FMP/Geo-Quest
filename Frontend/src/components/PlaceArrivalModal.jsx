import { useState } from "react";
import {
  ALLOWED_CATEGORIES,
  PLACE_FUNCTIONS,
  SPECIAL_HOSPITAL_SUBCATEGORY,
} from "../utils/placeCategories";

const DISABLED_GRAY_BUTTON_STYLE = {
  width: "100%",
  padding: "12px 18px",
  background: "#262B28",
  border: "1px solid #3E4641",
  borderRadius: 6,
  color: "#7B857E",
  fontFamily: "'IBM Plex Mono', monospace",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: "0.05em",
  cursor: "not-allowed",
  opacity: 0.85,
};

export default function PlaceArrivalModal({
  place,
  routeSummary,
  hasArrived = false,
  isCalculatingRoute = false,
  playerEnergy = 100,
  playerState = null,
  onGoToPlace,
  onStartArenaCombat,
  onStartBossCombat,
  onOpenShop,
  onHospitalHeal,
  onLodgingRest,
  onHomeRest,
  onClose,
}) {
  const [actionFeedback, setActionFeedback] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [prevContextKey, setPrevContextKey] = useState(null);

  const currentContextKey = `${place?.id || "none"}:${hasArrived ? "arrived" : "preview"}`;
  if (currentContextKey !== prevContextKey) {
    setPrevContextKey(currentContextKey);
    if (actionError !== null) setActionError(null);
    if (actionFeedback !== null) setActionFeedback(null);
  }

  if (!place) return null;

  const isHomeSpecial =
    place.isHomeSpecial ||
    place.id === "home" ||
    place.placeFunction === PLACE_FUNCTIONS.HOME;

  const isBossSpecial =
    !isHomeSpecial &&
    (place.isBossSpecial ||
      place.subcategory === "shopping_mall" ||
      place.placeFunction === PLACE_FUNCTIONS.BOSS);

  const isArena =
    !isHomeSpecial &&
    !isBossSpecial &&
    (place.placeFunction === PLACE_FUNCTIONS.ARENA ||
      place.category === ALLOWED_CATEGORIES.ENTERTAINMENT);

  const isShop =
    !isHomeSpecial &&
    !isBossSpecial &&
    (place.placeFunction === PLACE_FUNCTIONS.SHOP ||
      place.category === ALLOWED_CATEGORIES.SHOPPING);

  const isHospital =
    !isHomeSpecial &&
    (place.placeFunction === PLACE_FUNCTIONS.HOSPITAL ||
      place.category === ALLOWED_CATEGORIES.HEALTH_AND_WELLNESS);

  const isGeneralHospital =
    isHospital &&
    String(place.subcategory || "").toLowerCase() ===
      SPECIAL_HOSPITAL_SUBCATEGORY;

  const isLodging =
    !isHomeSpecial &&
    (place.placeFunction === PLACE_FUNCTIONS.LODGING ||
      place.category === ALLOWED_CATEGORIES.LODGING);

  // Estado permanente persistido para este Place (Seção 5.2, 6, 11)
  const permanentState = (playerState?.estadosPlaces || []).find(
    (e) => e.placeId === place.id,
  );
  const isPlaceCompleted = Boolean(permanentState?.concluido);
  const isFreeHealUsed = Boolean(permanentState?.curaGratuitaUtilizada);

  const vidaAtual = playerState?.atributos?.vidaAtual ?? 50;
  const vidaFinal = Math.max(1, playerState?.atributos?.vidaFinal ?? 50);
  const energiaAtual = Number(
    playerState?.atributos?.energiaAtual ?? playerEnergy ?? 100,
  );
  const energiaMaxima = Math.max(
    1,
    playerState?.atributos?.energiaMaximaFinal ?? 100,
  );
  const moedas = playerState?.moedas ?? playerState?.atributos?.moedas ?? 0;

  const descriptionText = isHomeSpecial
    ? "Seu ponto inicial de aventura."
    : isBossSpecial
      ? "Local especial de Boss. Enfrente o Boss deste território em combate."
      : isArena
        ? "Este local permite enfrentar desafios de combate em uma arena."
        : isShop
          ? "Explore esta loja e confira os produtos disponíveis."
          : isHospital
            ? "Este local permite recuperar sua Vida e funciona como checkpoint caso você seja derrotado."
            : isLodging
              ? "Este local permite recuperar sua Energia e funciona como checkpoint caso você fique exausto."
              : "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.";

  const requiredEnergy = Number(routeSummary?.energiaConsumida ?? 0);
  const distanceKm = Number(routeSummary?.distanciaKm ?? 0);
  const hasEnoughEnergy = energiaAtual > 0 && energiaAtual >= requiredEnergy;

  // Permite clicar em IR quando o personagem ainda não está no local e tem Energia > 0
  // (Se energiaAtual <= 0, o botão IR fica cinza; se 0 < energiaAtual < requiredEnergy, ao caminhar a Energia chegará a 0 no meio da rota acionando o Esgotamento da Seção 3.1)
  const canClickGo = !hasArrived && !isCalculatingRoute && energiaAtual > 0;

  const goButtonLabel = hasArrived
    ? "IR (VOCÊ JÁ ESTÁ NESTE LOCAL)"
    : isCalculatingRoute
      ? "CALCULANDO ROTA..."
      : energiaAtual <= 0
        ? "IR — SEM ENERGIA DISPONÍVEL (0)"
        : !hasEnoughEnergy
          ? `IR (${distanceKm.toFixed(2)} km • Custo: ${requiredEnergy.toFixed(1)} PE — Esgotará no trajeto)`
          : `IR (${distanceKm.toFixed(2)} km • -${requiredEnergy.toFixed(1)} Energia)`;

  const freeHealPct = isGeneralHospital ? 50 : 25;
  const paidHealPct = isGeneralHospital ? 100 : 50;
  const freeHealAmount = Math.max(1, Math.round(vidaFinal * (freeHealPct / 100)));
  const paidHealAmount =
    paidHealPct === 100
      ? vidaFinal
      : Math.max(1, Math.round(vidaFinal * 0.5));

  async function handleHospitalCure(tipoCura) {
    if (!hasArrived || isBusy || !onHospitalHeal) return;
    setActionError(null);
    setActionFeedback(null);
    setIsBusy(true);
    try {
      await onHospitalHeal(place, tipoCura);
      setActionFeedback(
        tipoCura === "gratuita"
          ? `Cura gratuita realizada (+${freeHealPct}% da Vida máxima)! Checkpoint de Vida atualizado.`
          : `Cura paga realizada (-50 moedas)! Checkpoint de Vida atualizado.`,
      );
    } catch (err) {
      setActionError(
        err?.message || "Não foi possível realizar a cura neste local.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleHotelRest() {
    if (!hasArrived || isBusy || !onLodgingRest) return;
    setActionError(null);
    setActionFeedback(null);
    setIsBusy(true);
    try {
      await onLodgingRest(place);
      setActionFeedback(
        "Descanso realizado (-25 moedas, 100% de Energia recuperada)! Checkpoint de Energia atualizado.",
      );
    } catch (err) {
      setActionError(
        err?.message || "Não foi possível descansar nesta hospedagem.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRestAtHome() {
    if (!hasArrived || isBusy || !onHomeRest) return;
    setActionError(null);
    setActionFeedback(null);
    setIsBusy(true);
    try {
      await onHomeRest();
      setActionFeedback(
        "Descanso gratuito realizado! +50% da Vida total e 100% da Energia foram recuperadas.",
      );
    } catch (err) {
      setActionError(err?.message || "Não foi possível descansar no Home.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleCombatOrShopClick() {
    setActionError(null);
    setActionFeedback(null);

    if (!hasArrived) return;

    if (isBossSpecial || isArena) {
      if (isPlaceCompleted) {
        setActionError("Este local já foi concluído permanentemente.");
        return;
      }
      if (vidaAtual <= 0) {
        setActionError(
          "Sua Vida está em 0. Recupere sua Vida em um local de Health and Wellness ou no Home antes de lutar.",
        );
        return;
      }
      if (isBossSpecial && onStartBossCombat) {
        onStartBossCombat(place);
      } else if (isArena && onStartArenaCombat) {
        onStartArenaCombat(place);
      }
      return;
    }

    if (isShop && onOpenShop) {
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
          border: `1px solid ${
            isHomeSpecial
              ? "#10B981"
              : isBossSpecial
                ? "#F59E0B"
                : isArena
                  ? "#EF4444"
                  : "#C89B5C"
          }`,
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
          aria-label="Fechar menu do local"
          onClick={() => {
            setActionError(null);
            setActionFeedback(null);
            if (onClose) onClose();
          }}
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

        {/* 2. Categoria e badges especiais */}
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

          {isGeneralHospital && (
            <div
              data-testid="place-menu-general-hospital-badge"
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: 6,
                background: "#064E3B",
                border: "1px solid #10B981",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                color: "#6EE7B7",
              }}
            >
              General Hospital (general_hospital)
            </div>
          )}

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

          {(isArena || isBossSpecial) && isPlaceCompleted && (
            <div
              data-testid="place-menu-completed-badge"
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: 6,
                background: "#14532D",
                border: "1px solid #22C55E",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                color: "#86EFAC",
              }}
            >
              {isBossSpecial ? "Boss Derrotado (Concluído)" : "Arena Concluída"}
            </div>
          )}

          {routeSummary && !hasArrived && (
            <div
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: 6,
                background: !hasEnoughEnergy ? "#3B1818" : "#13293D",
                border: `1px solid ${!hasEnoughEnergy ? "#EF4444" : "#38BDF8"}`,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: !hasEnoughEnergy ? "#FCA5A5" : "#38BDF8",
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
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          {descriptionText}
        </div>

        {/* Informações adicionais de estado para Health and Wellness, Lodging, Home ou Locais Concluídos */}
        {isHospital && (
          <div
            data-testid="hospital-status-panel"
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
              Estado atual: <strong>Vida {vidaAtual}/{vidaFinal}</strong> •{" "}
              <strong style={{ color: "#FBBF24" }}>Moedas: {moedas}</strong>
            </div>
            <div>
              Cura gratuita:{" "}
              <strong>
                +{freeHealPct}% ({freeHealAmount} Vida)
              </strong>{" "}
              • Cura paga:{" "}
              <strong>
                {paidHealPct === 100
                  ? `100% (${vidaFinal} Vida)`
                  : `+50% (${paidHealAmount} Vida)`}{" "}
                por 50 moedas
              </strong>
            </div>
            {isFreeHealUsed && (
              <div
                data-testid="free-heal-used-notice"
                style={{ color: "#FBBF24", fontWeight: 700, marginTop: 2 }}
              >
                Benefício gratuito já resgatado neste local.
              </div>
            )}
          </div>
        )}

        {isLodging && (
          <div
            data-testid="lodging-status-panel"
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
              Estado atual:{" "}
              <strong>
                Energia {energiaAtual.toFixed(1)}/{energiaMaxima}
              </strong>{" "}
              • <strong style={{ color: "#FBBF24" }}>Moedas: {moedas}</strong>
            </div>
            <div>
              Recuperação: <strong>100% da Energia máxima</strong> • Custo:{" "}
              <strong>25 moedas</strong>
            </div>
            <div style={{ color: "#9CAEA0" }}>
              O checkpoint de descanso é salvo ao descansar neste local.
            </div>
          </div>
        )}

        {isHomeSpecial && (
          <div
            data-testid="home-status-panel"
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
              Estado atual: <strong>Vida {vidaAtual}/{vidaFinal}</strong> •{" "}
              <strong>
                Energia {energiaAtual.toFixed(1)}/{energiaMaxima}
              </strong>
            </div>
            <div>
              Recuperação: <strong>+50% da Vida total e 100% da Energia (Grátis)</strong>
            </div>
          </div>
        )}

        {(isArena || isBossSpecial) && isPlaceCompleted && (
          <div
            data-testid="combat-place-completed-notice"
            style={{
              padding: "10px 12px",
              background: "rgba(20, 83, 45, 0.35)",
              border: "1px solid #22C55E",
              borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "#86EFAC",
              marginBottom: 14,
              fontWeight: 700,
            }}
          >
            {isBossSpecial
              ? "O Boss deste local já foi derrotado. Local concluído permanentemente."
              : "Os desafios desta arena já foram vencidos. Local concluído permanentemente."}
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            data-testid="place-action-error"
            style={{
              padding: "10px 12px",
              background: "#3B1818",
              border: "1px solid #EF4444",
              borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "#FCA5A5",
              marginBottom: 14,
            }}
          >
            {actionError}
          </div>
        )}

        {actionFeedback && (
          <div
            data-testid="place-action-feedback"
            style={{
              padding: "10px 12px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid #10B981",
              borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "#6EE7B7",
              marginBottom: 14,
            }}
          >
            {actionFeedback}
          </div>
        )}

        {/* 4. Botões na parte inferior:
             - Botão superior: IR para o Place
             - Botão(ões) inferior(es): Ação do próprio Place (fica cinza até o personagem chegar lá) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            data-testid="place-action-go"
            disabled={!canClickGo}
            onClick={() => {
              if (!canClickGo || !onGoToPlace) return;
              setActionError(null);
              setActionFeedback(null);
              onGoToPlace(place);
            }}
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

          {/* Ações específicas de Health and Wellness (Seção 7) */}
          {isHospital ? (
            <>
              <button
                type="button"
                data-testid="place-action-heal-free"
                disabled={!hasArrived || isFreeHealUsed || isBusy}
                onClick={() => handleHospitalCure("gratuita")}
                style={
                  hasArrived && !isFreeHealUsed && !isBusy
                    ? {
                        width: "100%",
                        padding: "12px 18px",
                        background: "#059669",
                        border: "1px solid #34D399",
                        borderRadius: 6,
                        color: "#FFFFFF",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 700,
                        fontSize: 13,
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                      }
                    : DISABLED_GRAY_BUTTON_STYLE
                }
              >
                {isFreeHealUsed
                  ? "CURA GRATUITA (JÁ UTILIZADA)"
                  : `CURA GRATUITA (+${freeHealPct}% VIDA)`}
              </button>

              <button
                type="button"
                data-testid="place-action-heal-paid"
                disabled={!hasArrived || isBusy}
                onClick={() => handleHospitalCure("paga")}
                style={
                  hasArrived && !isBusy
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
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                      }
                    : DISABLED_GRAY_BUTTON_STYLE
                }
              >
                {`CURA PAGA (${paidHealPct}% VIDA • 50 MOEDAS)`}
              </button>
            </>
          ) : isLodging ? (
            /* Ação específica de Lodging (Seção 8) */
            <button
              type="button"
              data-testid="place-action-lodging-rest"
              disabled={!hasArrived || isBusy}
              onClick={handleHotelRest}
              style={
                hasArrived && !isBusy
                  ? {
                      width: "100%",
                      padding: "12px 18px",
                      background: "#CA8A04",
                      border: "1px solid #FDE047",
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
              DESCANSAR (100% ENERGIA • 25 MOEDAS)
            </button>
          ) : isHomeSpecial ? (
            /* Ação específica de Home (Seção 9.3) */
            <button
              type="button"
              data-testid="place-action-home-rest"
              disabled={!hasArrived || isBusy}
              onClick={handleRestAtHome}
              style={
                hasArrived && !isBusy
                  ? {
                      width: "100%",
                      padding: "12px 18px",
                      background: "#059669",
                      border: "1px solid #6EE7B7",
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
              DESCANSAR GRATUITAMENTE
            </button>
          ) : (
            /* Ação para Arena, Boss, Loja ou Categorias WIP */
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
              disabled={
                !hasArrived ||
                isPlaceCompleted ||
                (!isBossSpecial && !isArena && !isShop)
              }
              onClick={handleCombatOrShopClick}
              style={
                hasArrived &&
                !isPlaceCompleted &&
                (isBossSpecial || isArena || isShop)
                  ? isBossSpecial
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
                        }
                  : DISABLED_GRAY_BUTTON_STYLE
              }
            >
              {isBossSpecial
                ? isPlaceCompleted
                  ? "BOSS DERROTADO (CONCLUÍDO)"
                  : "BOSS"
                : isArena
                  ? isPlaceCompleted
                    ? "ARENA CONCLUÍDA"
                    : "COMBATE"
                  : isShop
                    ? "LOJA"
                    : "EM DESENVOLVIMENTO"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
