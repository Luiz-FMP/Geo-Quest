import { useEffect, useState } from "react";
import { getBuffPlaceholder, getItemPlaceholder } from "../config/placeholderAssets";
import { obterEspecificacaoBuff } from "../services/playerApi";
import {
  ALLOWED_CATEGORIES,
  getNaturalFeatureFlavorText,
  getTranslatedSubcategory,
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

const SPORTS_UPGRADE_OPTIONS = [
  {
    key: "dano",
    label: "Upar dano",
    detail: "+1 de dano",
    accent: "#EF4444",
    border: "#FCA5A5",
  },
  {
    key: "vida",
    label: "Upar vida",
    detail: "+5 de vida máxima",
    accent: "#10B981",
    border: "#6EE7B7",
  },
  {
    key: "energia",
    label: "Upar energia",
    detail: "+10 de energia máxima",
    accent: "#0284C7",
    border: "#7DD3FC",
  },
  {
    key: "velocidade",
    label: "Upar velocidade",
    detail: "+1 de velocidade",
    accent: "#D97706",
    border: "#FCD34D",
  },
];

function createInteractionId(placeId) {
  return `${placeId || "place"}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

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
  onExploreNaturalFeature,
  onOpenTransportMap,
  onTrainSports,
  onEnsureServicesAttribute,
  onBuyServicesBuff,
  onReceiveCultureBuff,
  onClose,
}) {
  const [actionFeedback, setActionFeedback] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [prevContextKey, setPrevContextKey] = useState(null);

  // Estados locais por interação com o Place (Natural Features, Culture, Sports, Services)
  const [interactionId, setInteractionId] = useState(() =>
    createInteractionId(place?.id),
  );
  const [naturalExplorationResult, setNaturalExplorationResult] =
    useState(null);
  const [cultureBuffResult, setCultureBuffResult] = useState(null);
  const [sportsTrainedOption, setSportsTrainedOption] = useState(null);
  const [servicesBuffSpec, setServicesBuffSpec] = useState(null);

  const currentContextKey = `${place?.id || "none"}:${hasArrived ? "arrived" : "preview"}`;
  if (currentContextKey !== prevContextKey) {
    setPrevContextKey(currentContextKey);
    setInteractionId(createInteractionId(place?.id));
    if (actionError !== null) setActionError(null);
    if (actionFeedback !== null) setActionFeedback(null);
    if (naturalExplorationResult !== null) setNaturalExplorationResult(null);
    if (cultureBuffResult !== null) setCultureBuffResult(null);
    if (sportsTrainedOption !== null) setSportsTrainedOption(null);
    if (servicesBuffSpec !== null) setServicesBuffSpec(null);
  }

  // Seção 4: Quando selecionar um Place com a categoria Services, escolher de forma aleatória qual atributo será melhorado e salvar para esse Place.
  useEffect(() => {
    let active = true;
    if (!place || place.category !== ALLOWED_CATEGORIES.SERVICES) {
      return undefined;
    }

    const existingState = (playerState?.estadosPlaces || []).find(
      (e) => e.placeId === place.id,
    );
    if (existingState?.estoqueJson) {
      try {
        const parsed = JSON.parse(existingState.estoqueJson);
        if (parsed?.atributo) {
          return undefined;
        }
      } catch {
        // Ignora JSON inválido
      }
    }

    if (typeof onEnsureServicesAttribute === "function") {
      onEnsureServicesAttribute(place)
        .then((res) => {
          if (active && res?.atributo) {
            setServicesBuffSpec(obterEspecificacaoBuff(res.atributo, "services"));
          }
        })
        .catch(() => {
          // Mantém fallback visual caso ocorra falha transitória
        });
    }
    return () => {
      active = false;
    };
  }, [place, playerState?.estadosPlaces, onEnsureServicesAttribute]);

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

  const isEquipmentShop =
    !isHomeSpecial &&
    !isBossSpecial &&
    place.category === ALLOWED_CATEGORIES.SHOPPING;

  const isConsumableShop =
    !isHomeSpecial &&
    !isBossSpecial &&
    place.category === ALLOWED_CATEGORIES.FOOD_AND_DRINK;

  const isServicesBuffShop =
    !isHomeSpecial &&
    !isBossSpecial &&
    place.category === ALLOWED_CATEGORIES.SERVICES;

  const isShop = isEquipmentShop || isConsumableShop;

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

  const isNaturalFeature =
    !isHomeSpecial && place.category === ALLOWED_CATEGORIES.NATURAL_FEATURES;

  const isTransportation =
    !isHomeSpecial && place.category === ALLOWED_CATEGORIES.TRANSPORTATION;

  const isCulture =
    !isHomeSpecial && place.category === ALLOWED_CATEGORIES.CULTURE;

  const isSports =
    !isHomeSpecial && place.category === ALLOWED_CATEGORIES.SPORTS;

  const translatedSubcategory = getTranslatedSubcategory(
    place.subcategory,
    place.category,
  );

  // Estado permanente persistido para este Place
  const permanentState = (playerState?.estadosPlaces || []).find(
    (e) => e.placeId === place.id,
  );
  const isPlaceCompleted = Boolean(permanentState?.concluido);
  const isFreeHealUsed = Boolean(permanentState?.curaGratuitaUtilizada);

  // Em Sports, recupera qual melhoria foi escolhida e persistida no SQLite/estado permanente
  let persistedSportsUpgradeLabel = null;
  if (isSports) {
    if (permanentState?.estoqueJson) {
      try {
        const parsed = JSON.parse(permanentState.estoqueJson);
        if (parsed?.rotulo) {
          persistedSportsUpgradeLabel = parsed.rotulo;
        } else if (parsed?.melhoria) {
          const foundOpt = SPORTS_UPGRADE_OPTIONS.find(
            (o) => o.key === String(parsed.melhoria).toLowerCase(),
          );
          if (foundOpt) {
            persistedSportsUpgradeLabel = `${foundOpt.label} (${foundOpt.detail})`;
          }
        }
      } catch {
        // Ignora caso estoqueJson não seja JSON estruturado
      }
    }
    if (!persistedSportsUpgradeLabel && sportsTrainedOption) {
      const foundOpt = SPORTS_UPGRADE_OPTIONS.find(
        (o) => o.key === sportsTrainedOption,
      );
      if (foundOpt) {
        persistedSportsUpgradeLabel = `${foundOpt.label} (${foundOpt.detail})`;
      }
    }
  }
  const isSportsCompleted =
    isSports && (isPlaceCompleted || sportsTrainedOption !== null);

  // Em Services, recupera qual atributo foi sorteado e persistido para este Place
  let resolvedServicesSpec = servicesBuffSpec;
  if (isServicesBuffShop && !resolvedServicesSpec && permanentState?.estoqueJson) {
    try {
      const parsed = JSON.parse(permanentState.estoqueJson);
      if (parsed?.atributo) {
        resolvedServicesSpec = obterEspecificacaoBuff(parsed.atributo, "services");
      }
    } catch {
      // Ignora JSON inválido
    }
  }

  // Em Culture, recupera resultado persistido ou da sessão atual
  let resolvedCultureSpec = null;
  if (isCulture) {
    if (cultureBuffResult?.atributo) {
      resolvedCultureSpec = obterEspecificacaoBuff(cultureBuffResult.atributo, "culture");
    } else if (permanentState?.estoqueJson) {
      try {
        const parsed = JSON.parse(permanentState.estoqueJson);
        if (parsed?.atributo) {
          resolvedCultureSpec = obterEspecificacaoBuff(parsed.atributo, "culture");
        }
      } catch {
        // Ignora JSON inválido
      }
    }
  }
  const isCultureCompleted =
    isCulture && (isPlaceCompleted || cultureBuffResult !== null);

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

  // Seção 4.3: Em Natural Features, após vasculhar, a descrição inicial é substituída pelo texto narrativo de resultado
  // Seção 5: Em Culture, a descrição é "Espaço cultural que inspira o explorador e concede um aprimoramento cultural temporário (buff). (5 min)"
  const descriptionText = isHomeSpecial
    ? "Seu ponto inicial de aventura."
    : isBossSpecial
      ? "Local especial de Boss. Enfrente o Boss deste território em combate."
      : isArena
        ? "Este local permite enfrentar desafios de combate em uma arena."
        : isEquipmentShop
          ? "Loja de equipamentos. Confira a vitrine preparada para futuros equipamentos e consulte seu inventário de equipamentos."
          : isConsumableShop
            ? "Loja de consumíveis. Confira a vitrine preparada para futuros consumíveis e consulte seu inventário de consumíveis."
            : isServicesBuffShop
              ? "Estabelecimento de serviços que oferece aprimoramentos temporários (buffs) para sua jornada."
              : isHospital
                ? "Este local permite recuperar sua Vida e funciona como checkpoint caso você seja derrotado."
                : isLodging
                  ? "Este local permite recuperar sua Energia e funciona como checkpoint caso você fique exausto."
                  : isNaturalFeature
                    ? naturalExplorationResult?.mensagem ||
                      getNaturalFeatureFlavorText(place.subcategory)
                    : isTransportation
                      ? `Terminal de transporte (${translatedSubcategory}). Viaje diretamente para outros pontos de ${translatedSubcategory.toLowerCase()} próximos no mapa de transporte.`
                      : isCulture
                        ? "Espaço cultural que inspira o explorador e concede um aprimoramento cultural temporário (buff). (5 min)"
                        : isSports
                          ? "Local de prática esportiva e treinamento físico. Escolha um atributo base para aprimorar permanentemente nesta visita."
                          : "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.";

  const requiredEnergy = Number(routeSummary?.energiaConsumida ?? 0);
  const distanceKm = Number(routeSummary?.distanciaKm ?? 0);
  const hasEnoughEnergy = energiaAtual > 0 && energiaAtual >= requiredEnergy;

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
  const freeHealAmount = Math.max(
    1,
    Math.round(vidaFinal * (freeHealPct / 100)),
  );
  const paidHealAmount =
    paidHealPct === 100 ? vidaFinal : Math.max(1, Math.round(vidaFinal * 0.5));

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
        "Descanso realizado na Home! Sua vida foi garantida em pelo menos 50% da Vida máxima.",
      );
    } catch (err) {
      setActionError(err?.message || "Não foi possível descansar no Home.");
    } finally {
      setIsBusy(false);
    }
  }

  // Seção 4: Services — Compra de buff temporário (50g, 10 minutos, permite compras repetidas)
  async function handleBuyServicesBuff() {
    if (!hasArrived || isBusy || !onBuyServicesBuff) return;
    setActionError(null);
    setActionFeedback(null);
    setIsBusy(true);
    try {
      const response = await onBuyServicesBuff(place);
      if (response?.atributo) {
        setServicesBuffSpec(obterEspecificacaoBuff(response.atributo, "services"));
      }
      setActionFeedback(
        response?.mensagem ||
          "Aprimoramento temporário adquirido com sucesso (-50g)!",
      );
    } catch (err) {
      setActionError(
        err?.message ||
          "Você não possui moedas suficientes para comprar este aprimoramento. Custo: 50g.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  // Seção 4: Natural Features — Vasculhar local (calculado e persistido no backend)
  async function handleScavengeNaturalFeature() {
    if (
      !hasArrived ||
      isBusy ||
      naturalExplorationResult !== null ||
      !onExploreNaturalFeature
    ) {
      return;
    }
    setActionError(null);
    setActionFeedback(null);
    setIsBusy(true);
    try {
      const response = await onExploreNaturalFeature(place, interactionId);
      setNaturalExplorationResult(response);
    } catch (err) {
      setActionError(
        err?.message || "Não foi possível vasculhar este local agora.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  // Seção 5: Transportation — Abrir mapa alternativo de transporte
  function handleOpenTransportMode() {
    if (!hasArrived || isBusy || !onOpenTransportMap) return;
    setActionError(null);
    setActionFeedback(null);
    onOpenTransportMap(place);
  }

  // Seção 5: Culture — Receber aprimoramento temporário gratuito (5 min, 1 vez por Place)
  async function handleReceiveCultureBuff() {
    if (!hasArrived || isBusy || isCultureCompleted || !onReceiveCultureBuff) {
      return;
    }
    setActionError(null);
    setActionFeedback(null);
    setIsBusy(true);
    try {
      const response = await onReceiveCultureBuff(place, interactionId);
      setCultureBuffResult(response);
      setActionFeedback(
        response?.mensagem ||
          "Inspiração cultural recebida!",
      );
    } catch (err) {
      setActionError(
        err?.message || "Não foi possível receber o aprimoramento neste local.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  // Seção 7: Sports — Treinar 1 atributo permanente uma única vez por Place
  async function handleSelectSportsUpgrade(optionKey) {
    if (
      !hasArrived ||
      isBusy ||
      isSportsCompleted ||
      !onTrainSports
    ) {
      return;
    }
    setActionError(null);
    setActionFeedback(null);
    setIsBusy(true);
    try {
      const response = await onTrainSports(place, optionKey, interactionId);
      setSportsTrainedOption(optionKey);
      setActionFeedback(
        response?.mensagem ||
          "Treinamento concluído! Atributo permanente aprimorado.",
      );
    } catch (err) {
      setActionError(
        err?.message || "Não foi possível concluir o treinamento neste local.",
      );
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

  const foundItemVisual = naturalExplorationResult?.itemEncontrado
    ? getItemPlaceholder(
        naturalExplorationResult.itemEncontrado.placeholderKey ||
          "debug_cube_magenta",
      )
    : getItemPlaceholder("debug_cube_magenta");

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
                  : place.color || "#C89B5C"
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

        {/* 1. Nome original do Place */}
        <h3
          id="place-modal-title"
          data-testid="place-menu-name"
          style={{
            margin: "0 32px 4px 0",
            fontSize: 22,
            fontWeight: 700,
            color: "#EDE6D3",
            lineHeight: 1.25,
          }}
        >
          {place.name}
        </h3>

        {/* Nome traduzido e simplificado da subcategoria em tamanho menor (sem expor identificador técnico) */}
        {!isHomeSpecial && translatedSubcategory && (
          <div
            data-testid="place-menu-subcategory"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              fontWeight: 600,
              color: place.color || "#C89B5C",
              marginBottom: 10,
            }}
          >
            {translatedSubcategory}
          </div>
        )}

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
              Hospital Geral
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
              Local Especial de Boss
            </div>
          )}

          {(isArena || isBossSpecial || isSports || isCulture) &&
            (isPlaceCompleted || isSportsCompleted || isCultureCompleted) && (
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
                {isBossSpecial
                  ? "Boss Derrotado (Concluído)"
                  : isSports
                    ? "Aprimoramento Concluído"
                    : isCulture
                      ? "Inspiração Concluída"
                      : "Arena Concluída"}
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
              {distanceKm.toFixed(2)} km • Custo: {requiredEnergy.toFixed(2)}{" "}
              Energia
            </div>
          )}
        </div>

        {/* 3. Descrição / Flavor / Resultado Narrativo */}
        <div
          data-testid="place-menu-description"
          style={{
            padding: "12px 14px",
            background: "#131915",
            border: "1px dashed #3A4A3C",
            borderRadius: 8,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: naturalExplorationResult ? "#EDE6D3" : "#9CAEA0",
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          {descriptionText}
        </div>

        {/* Seção 4: Painel para Services (Compra de Buff temporário no Place) */}
        {isServicesBuffShop && (
          <div
            data-testid="services-status-panel"
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
              <strong style={{ color: "#FBBF24" }}>Moedas: {moedas}g</strong>
            </div>
            <div data-testid="services-buff-service-text">
              Serviço:{" "}
              <strong>
                {resolvedServicesSpec
                  ? `Aprimoramento temporário em ${resolvedServicesSpec.rotuloAtributo} (10 min)`
                  : "Aprimoramento temporário (10 min)"}
              </strong>{" "}
              • Custo:{" "}
              <strong style={{ color: "#C4B5FD" }}>50 moedas (50g)</strong>
            </div>
            {resolvedServicesSpec && (
              <div style={{ color: "#9CAEA0" }}>
                Bônus deste local:{" "}
                <strong style={{ color: "#86EFAC" }}>
                  +{resolvedServicesSpec.bonus} de {resolvedServicesSpec.rotuloAtributo}
                </strong>{" "}
                por 10 minutos.
              </div>
            )}
          </div>
        )}

        {/* Seção 4.3: Apresentação visual do resultado da exploração em Natural Features */}
        {isNaturalFeature && naturalExplorationResult && (
          <div
            data-testid="natural-feature-result-panel"
            data-result-type={
              naturalExplorationResult.resultado ||
              naturalExplorationResult.tipoResultado
            }
            style={{
              padding: "14px",
              background: "#131D17",
              border: "1px solid #22C55E",
              borderRadius: 10,
              marginBottom: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              textAlign: "center",
            }}
          >
            {(naturalExplorationResult.resultado ||
              naturalExplorationResult.tipoResultado) === "item" && (
              <>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: "#86EFAC",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 700,
                  }}
                >
                  Item Encontrado!
                </span>
                {/* Quadrado destacado na tela preparado para receber futuramente os assets dos itens */}
                <div
                  data-testid="natural-feature-item-box"
                  style={{
                    width: 88,
                    height: 88,
                    background: "#171F19",
                    border: "2px solid #C89B5C",
                    boxShadow: "0 0 18px rgba(200, 155, 92, 0.35)",
                    borderRadius: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      color: foundItemVisual.accent || "#D946EF",
                      lineHeight: 1,
                    }}
                  >
                    {foundItemVisual.symbol}
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#EDE6D3",
                    }}
                  >
                    {foundItemVisual.code}
                  </span>
                </div>
                <div
                  data-testid="natural-feature-item-name"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#EDE6D3",
                  }}
                >
                  {naturalExplorationResult.itemEncontrado?.nome ||
                    "Item de Debug"}
                </div>
              </>
            )}

            {(naturalExplorationResult.resultado ||
              naturalExplorationResult.tipoResultado) === "moedas" && (
              <div
                data-testid="natural-feature-coins-reward"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#FBBF24",
                  padding: "6px 14px",
                  background: "rgba(251, 191, 36, 0.12)",
                  border: "1px solid #FBBF24",
                  borderRadius: 8,
                }}
              >
                +{naturalExplorationResult.moedasGanhas || 10}g adicionados ao
                saldo! (Total: {moedas}g)
              </div>
            )}

            {(naturalExplorationResult.resultado ||
              naturalExplorationResult.tipoResultado) === "nada" && (
              <div
                data-testid="natural-feature-empty-reward"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  color: "#9CAEA0",
                }}
              >
                Nenhuma recompensa encontrada nesta busca.
              </div>
            )}
          </div>
        )}

        {/* Seção 5: Visualização de aprimoramento adquirido em Culture */}
        {isCulture && isCultureCompleted && resolvedCultureSpec && (
          <div
            data-testid="culture-buff-result-panel"
            style={{
              padding: "16px",
              background: "#131D17",
              border: "1px solid #F43F5E",
              borderRadius: 10,
              marginBottom: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#FDA4AF",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 700,
              }}
            >
              {resolvedCultureSpec.atributo === "nada"
                ? "Nenhum Aprimoramento Adquirido"
                : "Aprimoramento Adquirido (5 min)"}
            </span>

            {/* Quadrado destacado para o ícone do aprimoramento */}
            <div
              data-testid="culture-buff-empty-square"
              style={{
                width: 84,
                height: 84,
                background: "#171F19",
                border: "2px solid #F43F5E",
                boxShadow: "0 0 16px rgba(244, 63, 94, 0.28)",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {resolvedCultureSpec.atributo !== "nada" && (
                <>
                  <span
                    style={{
                      fontSize: 28,
                      color:
                        getBuffPlaceholder(resolvedCultureSpec.placeholderKey)
                          .accent || "#FDA4AF",
                      lineHeight: 1,
                    }}
                  >
                    {
                      getBuffPlaceholder(resolvedCultureSpec.placeholderKey)
                        .symbol
                    }
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#EDE6D3",
                    }}
                  >
                    {
                      getBuffPlaceholder(resolvedCultureSpec.placeholderKey)
                        .code
                    }
                  </span>
                </>
              )}
            </div>

            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 14,
                color: "#EDE6D3",
              }}
            >
              Nome:{" "}
              <strong data-testid="culture-buff-name" style={{ color: "#FFFFFF" }}>
                {resolvedCultureSpec.nomeBuff}
              </strong>
            </div>

            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: "#9CAEA0",
              }}
            >
              Descrição:{" "}
              <strong
                data-testid="culture-buff-description"
                style={{ color: "#FCD34D" }}
              >
                {resolvedCultureSpec.descricaoBuff}
              </strong>
            </div>
          </div>
        )}

        {/* Seção 7: Painel informativo de atributos atuais em Sports */}
        {isSports && (
          <div
            data-testid="sports-status-panel"
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
              Atributos atuais:{" "}
              <strong>Dano {playerState?.atributos?.danoFinal ?? 10}</strong> •{" "}
              <strong>Vida Máx. {vidaFinal}</strong> •{" "}
              <strong>Energia Máx. {energiaMaxima}</strong> •{" "}
              <strong>
                Velocidade {playerState?.atributos?.velocidadeFinal ?? 0}
              </strong>
            </div>
            <div style={{ color: "#9CAEA0" }}>
              {isSportsCompleted
                ? `Melhoria permanente já adquirida neste local${persistedSportsUpgradeLabel ? `: ${persistedSportsUpgradeLabel}` : "."}`
                : "Cada local de Sports permite escolher apenas 1 aprimoramento permanente uma única vez."}
            </div>
          </div>
        )}

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
              Recuperação:{" "}
              <strong>
                Garante pelo menos 50% da Vida máxima ({Math.round(vidaFinal * 0.5)}/{vidaFinal}) — Grátis
              </strong>
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

        {/* 4. Botões na parte inferior */}
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

          {/* Ações específicas de Health and Wellness */}
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
            /* Ação específica de Lodging */
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
            /* Ação específica de Home */
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
          ) : isServicesBuffShop ? (
            /* Seção 3.3: Services — Loja de buffs (50g, estado WIP) */
            <button
              type="button"
              data-testid="place-action-services-buff"
              disabled={!hasArrived || isBusy}
              onClick={handleBuyServicesBuff}
              style={
                hasArrived && !isBusy
                  ? {
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
                    }
                  : DISABLED_GRAY_BUTTON_STYLE
              }
            >
              COMPRAR APRIMORAMENTO TEMPORÁRIO (50g)
            </button>
          ) : isNaturalFeature ? (
            /* Seção 4: Natural Features — Botão VASCULHAR LOCAL */
            <button
              type="button"
              data-testid="place-action-scavenge"
              disabled={
                !hasArrived || isBusy || naturalExplorationResult !== null
              }
              onClick={handleScavengeNaturalFeature}
              style={
                hasArrived && !isBusy && naturalExplorationResult === null
                  ? {
                      width: "100%",
                      padding: "12px 18px",
                      background: "#15803D",
                      border: "1px solid #86EFAC",
                      borderRadius: 6,
                      color: "#FFFFFF",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 700,
                      fontSize: 13,
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }
                  : DISABLED_GRAY_BUTTON_STYLE
              }
            >
              {isBusy
                ? "VASCULHANDO LOCAL..."
                : naturalExplorationResult !== null
                  ? "LOCAL VASCULHADO"
                  : "VASCULHAR LOCAL"}
            </button>
          ) : isTransportation ? (
            /* Seção 5.1: Transportation — Botão VER LOCALIZAÇÕES PRÓXIMAS */
            <button
              type="button"
              data-testid="place-action-transport-map"
              disabled={!hasArrived || isBusy}
              onClick={handleOpenTransportMode}
              style={
                hasArrived && !isBusy
                  ? {
                      width: "100%",
                      padding: "12px 18px",
                      background: "#1D4ED8",
                      border: "1px solid #93C5FD",
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
              VER LOCALIZAÇÕES PRÓXIMAS
            </button>
          ) : isCulture ? (
            /* Seção 5: Culture — Botão RECEBER APRIMORAMENTO (vez única por Place) */
            <button
              type="button"
              data-testid="place-action-culture-buff"
              disabled={!hasArrived || isBusy || isCultureCompleted}
              onClick={handleReceiveCultureBuff}
              style={
                hasArrived && !isBusy && !isCultureCompleted
                  ? {
                      width: "100%",
                      padding: "12px 18px",
                      background: "#BE123C",
                      border: "1px solid #FDA4AF",
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
              {isBusy
                ? "INSPIRANDO-SE..."
                : isCultureCompleted
                  ? "APRIMORAMENTO JÁ RECEBIDO"
                  : "RECEBER APRIMORAMENTO"}
            </button>
          ) : isSports ? (
            /* Item 5: Sports — Aprimoramento uma única vez por Place. Se já concluído, não exibe as opções novamente */
            isSportsCompleted ? (
              <div
                data-testid="sports-completed-panel"
                style={{
                  padding: "12px 14px",
                  background: "rgba(20, 83, 45, 0.35)",
                  border: "1px solid #22C55E",
                  borderRadius: 8,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  color: "#86EFAC",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <strong style={{ fontSize: 13 }}>
                  MELHORIA PERMANENTE JÁ ADQUIRIDA NESTE LOCAL
                </strong>
                <span style={{ color: "#D1FAE5", fontSize: 11 }}>
                  {persistedSportsUpgradeLabel
                    ? `Aprimoramento registrado: ${persistedSportsUpgradeLabel}`
                    : "Você já realizou o treinamento único disponível neste estabelecimento esportivo."}
                </span>
              </div>
            ) : (
              <div
                data-testid="sports-upgrade-options-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {SPORTS_UPGRADE_OPTIONS.map((opt) => {
                  const canSelect = hasArrived && !isBusy;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      data-testid={`sports-upgrade-${opt.key}`}
                      disabled={!canSelect}
                      onClick={() => handleSelectSportsUpgrade(opt.key)}
                      style={
                        canSelect
                          ? {
                              padding: "10px 10px",
                              background: opt.accent,
                              border: `1px solid ${opt.border}`,
                              borderRadius: 6,
                              color: "#FFFFFF",
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 2,
                            }
                          : {
                              ...DISABLED_GRAY_BUTTON_STYLE,
                              padding: "10px 10px",
                              fontSize: 12,
                              border: "1px solid #3E4641",
                              color: "#7B857E",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 2,
                            }
                      }
                    >
                      <span>{opt.label}</span>
                      <span style={{ fontSize: 10, opacity: 0.9 }}>
                        ({opt.detail})
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            /* Ação para Arena, Boss, Loja (Shopping e Food and Drink) ou Categorias WIP */
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
                  : isEquipmentShop
                    ? "LOJA DE EQUIPAMENTOS"
                    : isConsumableShop
                      ? "LOJA DE CONSUMÍVEIS"
                      : "EM DESENVOLVIMENTO"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
