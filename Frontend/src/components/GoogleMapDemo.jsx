import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { getCharacterPlaceholder } from "../config/placeholderAssets";
import {
  COMBAT_TYPES,
  iniciarSessaoCombate,
  planRouteRandomEncounter,
} from "../services/CombatEngine";
import {
  buscarDestinosTransporte,
  calcularCustoViagemTransporte,
} from "../services/playerApi";
import {
  createHomePlace,
  getTranslatedSubcategory,
  normalizePlaceRecord,
} from "../utils/placeCategories";
import CombatScreen from "./combat/CombatScreen";
import PlaceArrivalModal from "./PlaceArrivalModal";
import PlaceShopModal from "./PlaceShopModal";
import RecoveryModal from "./RecoveryModal";

const PLACES_CACHE_STORAGE_KEY = "geoquest_places_spatial_cache_v2";
const MIN_DISTANCE_FOR_NEW_PLACES_FETCH_KM = 0.22; // 220 metros: evita chamadas redundantes à API para locais muito próximos
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos
const PROGRESSIVE_TRANSPORT_RADII_METERS = [1200, 5000, 15000, 30000, 50000];
const MAX_TRANSPORT_DESTINATIONS = 10;

const GAME_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#1d2c22" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b5c9b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#121a14" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3d5243" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#213327" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#26422f" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304436" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a261e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#4a6350" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#13293d" }],
  },
];

// Seção 5.2: Estilo visual distinto para o modo alternativo de transporte
const TRANSPORT_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0b192c" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#93c5fd" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#07101e" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e3a8a" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#0f223d" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#112946" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e3a5f" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0a1628" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2563eb" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#050d1a" }],
  },
];

function createCharacterSquareDataUrl(
  fillColor = "#2563EB",
  strokeColor = "#DBEAFE",
) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect x="3" y="3" width="26" height="26" fill="${fillColor}" stroke="${strokeColor}" stroke-width="3" rx="2" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createPlaceIconDataUrl(
  color = "#C89B5C",
  isSelected = false,
  isBossSpecial = false,
) {
  const stroke = isSelected ? "#FFFFFF" : isBossSpecial ? "#FCD34D" : "#161D18";
  const size = isSelected ? 30 : isBossSpecial ? 28 : 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">
    <rect x="4" y="4" width="20" height="20" fill="${color}" stroke="${stroke}" stroke-width="2.5" rx="3" />
    <circle cx="14" cy="14" r="3.5" fill="#161D18" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createTransportDestinationIconDataUrl(isSelected = false) {
  const fill = isSelected ? "#38BDF8" : "#2563EB";
  const stroke = isSelected ? "#FFFFFF" : "#BFDBFE";
  const size = isSelected ? 32 : 26;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">
    <polygon points="14,2 26,14 14,26 2,14" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />
    <circle cx="14" cy="14" r="4" fill="#0B192C" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createHomeIconDataUrl(isSelected = false) {
  const stroke = isSelected ? "#FFFFFF" : "#FDE047";
  const size = isSelected ? 34 : 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="13" fill="#065F46" stroke="${stroke}" stroke-width="2.5" />
    <polygon points="16,7 7,15 10,15 10,23 22,23 22,15 25,15" fill="#FDE047" />
    <rect x="14" y="17" width="4" height="6" fill="#065F46" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function decodeEncodedPolyline(encoded) {
  if (!encoded || typeof encoded !== "string") return [];
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

function haversineDistanceKm(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function calculatePathDistanceKm(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let totalKm = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalKm += haversineDistanceKm(points[i], points[i + 1]);
  }
  return Number(totalKm.toFixed(3));
}

function sortPlacesByProximity(placesList, centerCoords, maxResults = 18) {
  if (!Array.isArray(placesList)) return [];
  const seen = new Set();
  const unique = [];
  for (const p of placesList) {
    if (!p || !p.id || !p.category || seen.has(p.id)) continue;
    seen.add(p.id);
    unique.push(p);
  }
  return unique
    .map((p) => ({
      ...p,
      distanceFromCenterKm: haversineDistanceKm(centerCoords, {
        lat: p.lat,
        lng: p.lng,
      }),
    }))
    .filter((p) => p.distanceFromCenterKm <= 1.6)
    .sort((a, b) => a.distanceFromCenterKm - b.distanceFromCenterKm)
    .slice(0, maxResults);
}

function loadSpatialCacheFromSession() {
  try {
    const raw = sessionStorage.getItem(PLACES_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (entry) =>
        entry &&
        entry.center &&
        Array.isArray(entry.places) &&
        now - (entry.timestamp || 0) < CACHE_TTL_MS,
    );
  } catch {
    return [];
  }
}

function saveSpatialCacheToSession(entries) {
  try {
    sessionStorage.setItem(
      PLACES_CACHE_STORAGE_KEY,
      JSON.stringify(entries.slice(-15)),
    );
  } catch {
    // Ignore storage quota errors
  }
}

function interpolateRoutePoints(rawPoints, totalSteps = 90) {
  if (!Array.isArray(rawPoints) || rawPoints.length === 0) return [];
  if (rawPoints.length === 1) return [rawPoints[0]];

  const distances = [];
  let totalDistance = 0;

  for (let i = 0; i < rawPoints.length - 1; i++) {
    const a = rawPoints[i];
    const b = rawPoints[i + 1];
    const dLat = b.lat - a.lat;
    const dLng = b.lng - a.lng;
    const dist = Math.hypot(dLat, dLng);
    distances.push(dist);
    totalDistance += dist;
  }

  if (totalDistance === 0) {
    return [rawPoints[rawPoints.length - 1]];
  }

  const interpolated = [];
  for (let step = 0; step <= totalSteps; step++) {
    const targetDist = (step / totalSteps) * totalDistance;
    let accumulated = 0;

    for (let i = 0; i < distances.length; i++) {
      const segDist = distances[i];
      if (accumulated + segDist >= targetDist || i === distances.length - 1) {
        const ratio = segDist > 0 ? (targetDist - accumulated) / segDist : 1;
        const clampedRatio = Math.max(0, Math.min(1, ratio));
        const start = rawPoints[i];
        const end = rawPoints[i + 1];
        interpolated.push({
          lat: start.lat + (end.lat - start.lat) * clampedRatio,
          lng: start.lng + (end.lng - start.lng) * clampedRatio,
        });
        break;
      }
      accumulated += segDist;
    }
  }

  return interpolated;
}

function GameMapContent({
  initialCoords,
  character,
  playerState,
  onRegisterRouteTraversal,
  onUpdatePlayerHp,
  onDefineHome,
  onVisitPlace,
  onHospitalHeal,
  onLodgingRest,
  onHomeRest,
  onExploreNaturalFeature,
  onTrainSports,
  onTravelTransport,
  onTransportModeChange,
  onCompleteCombatPlace,
  onReturnToCheckpoint,
}) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const routesLib = useMapsLibrary("routes");

  const [playerCoords, setPlayerCoords] = useState(initialCoords);
  const [places, setPlaces] = useState([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState(null);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [arrivedPlace, setArrivedPlace] = useState(null);
  const [hasArrivedAtPlace, setHasArrivedAtPlace] = useState(false);
  const [lastRouteSummary, setLastRouteSummary] = useState(null);

  // Estado de recolhimento/expansão do painel de Locais Próximos (Seção 4)
  const [isPlacesPanelCollapsed, setIsPlacesPanelCollapsed] = useState(false);

  // Estado do combate ativo, loja aberta e modal de morte/esgotamento
  const [activeCombatSession, setActiveCombatSession] = useState(null);
  const [activeShopPlace, setActiveShopPlace] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(null); // "esgotamento" | "morte" | null

  // Seção 5: Estado do modo de mapa alternativo de transporte
  const [transportMode, setTransportMode] = useState(null);

  const polylineRef = useRef(null);
  const animationTimerRef = useRef(null);
  const pausedRouteRef = useRef(null);
  const preparedRouteRef = useRef(null);
  const activeCombatPlaceRef = useRef(null);
  const homeInitializedRef = useRef(false);
  const spatialCacheRef = useRef(loadSpatialCacheFromSession());
  const allDiscoveredPlacesRef = useRef([]);
  const inFlightCenterRef = useRef(null);

  // Place especial Home (Seção 9): fixo no ponto inicial do jogador
  const homeLat = playerState?.home?.latitude;
  const homeLng = playerState?.home?.longitude;
  const homeCoords = useMemo(() => {
    if (typeof homeLat === "number" && typeof homeLng === "number") {
      return {
        lat: homeLat,
        lng: homeLng,
      };
    }
    return initialCoords;
  }, [homeLat, homeLng, initialCoords]);

  const homePlace = useMemo(() => createHomePlace(homeCoords), [homeCoords]);

  useEffect(() => {
    if (homeInitializedRef.current) return;
    if (
      initialCoords &&
      typeof initialCoords.lat === "number" &&
      typeof initialCoords.lng === "number" &&
      !playerState?.home &&
      onDefineHome
    ) {
      homeInitializedRef.current = true;
      onDefineHome(initialCoords.lat, initialCoords.lng).catch(() => {});
    }
  }, [initialCoords, playerState?.home, onDefineHome]);

  // Alterna o estilo visual do Google Map quando entra ou sai do modo de transporte (Seção 5.2)
  useEffect(() => {
    if (!map) return;
    map.setOptions({
      styles: transportMode ? TRANSPORT_MAP_STYLES : GAME_MAP_STYLES,
    });
  }, [map, transportMode]);

  useEffect(() => {
    onTransportModeChange?.(Boolean(transportMode));
  }, [transportMode, onTransportModeChange]);

  useEffect(() => {
    return () => {
      onTransportModeChange?.(false);
    };
  }, [onTransportModeChange]);

  const charVisual = getCharacterPlaceholder(
    character?.placeholderKey || character?.id || 1,
  );

  const characterSquareIcon = useMemo(
    () =>
      createCharacterSquareDataUrl(charVisual.color, charVisual.borderColor),
    [charVisual.color, charVisual.borderColor],
  );

  const stopMovementAnimation = useCallback(() => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    pausedRouteRef.current = null;
    setIsMoving(false);
  }, []);

  const clearRoutePolyline = useCallback(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMovementAnimation();
      clearRoutePolyline();
    };
  }, [stopMovementAnimation, clearRoutePolyline]);

  const registerDiscoveredPlaces = useCallback(
    (centerCoords, normalizedPlaces) => {
      if (!Array.isArray(normalizedPlaces) || normalizedPlaces.length === 0)
        return;

      const mergedMap = new globalThis.Map();
      for (const p of allDiscoveredPlacesRef.current) {
        if (p?.id) mergedMap.set(p.id, p);
      }
      for (const p of normalizedPlaces) {
        if (p?.id) mergedMap.set(p.id, p);
      }
      allDiscoveredPlacesRef.current = Array.from(mergedMap.values());

      spatialCacheRef.current = [
        ...spatialCacheRef.current.filter(
          (entry) =>
            haversineDistanceKm(entry.center, centerCoords) >=
            MIN_DISTANCE_FOR_NEW_PLACES_FETCH_KM,
        ),
        {
          center: { lat: centerCoords.lat, lng: centerCoords.lng },
          places: normalizedPlaces,
          timestamp: Date.now(),
        },
      ];
      saveSpatialCacheToSession(spatialCacheRef.current);
    },
    [],
  );

  const fetchNearbyPlaces = useCallback(
    async (
      targetCoords = initialCoords,
      options = { forceRefresh: false },
    ) => {
      if (!targetCoords || !map || !placesLib) return;

      const center = { lat: targetCoords.lat, lng: targetCoords.lng };

      // 1. Verifica cache espacial para evitar chamadas desnecessárias à API
      if (!options?.forceRefresh) {
        const now = Date.now();
        const cachedHit = spatialCacheRef.current.find(
          (entry) =>
            now - (entry.timestamp || 0) < CACHE_TTL_MS &&
            haversineDistanceKm(entry.center, center) <
              MIN_DISTANCE_FOR_NEW_PLACES_FETCH_KM &&
            Array.isArray(entry.places) &&
            entry.places.length > 0,
        );

        if (cachedHit) {
          const combined = [
            ...cachedHit.places,
            ...allDiscoveredPlacesRef.current,
          ];
          const reordered = sortPlacesByProximity(combined, center, 18);
          if (reordered.length > 0) {
            setPlaces(reordered);
            setPlacesError(null);
            return;
          }
        }
      }

      if (
        inFlightCenterRef.current &&
        haversineDistanceKm(inFlightCenterRef.current, center) < 0.05
      ) {
        return;
      }
      inFlightCenterRef.current = center;

      setIsLoadingPlaces(true);
      setPlacesError(null);

      // 2. Tenta Backend API primeiro se configurado/disponível
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2200);
        const response = await fetch(
          `${apiBase}/api/places/nearby?lat=${encodeURIComponent(center.lat)}&lng=${encodeURIComponent(center.lng)}&radius=1200`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawList = Array.isArray(data?.places) ? data.places : [];
          const normalized = rawList
            .map((item, idx) => normalizePlaceRecord(item, idx))
            .filter(Boolean);

          if (normalized.length > 0) {
            registerDiscoveredPlaces(center, normalized);
            const sorted = sortPlacesByProximity(
              [...normalized, ...allDiscoveredPlacesRef.current],
              center,
              18,
            );
            setPlaces(sorted);
            setIsLoadingPlaces(false);
            inFlightCenterRef.current = null;
            return;
          }
        }
      } catch {
        // Backend indisponível ou chave configurada apenas no frontend; continua para Maps JS Places
      }

      // 3. Fallback para Google Maps JavaScript Places Library no navegador
      try {
        const service = new placesLib.PlacesService(map);
        service.nearbySearch(
          {
            location: center,
            radius: 1200,
          },
          async (results, status) => {
            inFlightCenterRef.current = null;

            if (
              status === placesLib.PlacesServiceStatus.OK &&
              Array.isArray(results) &&
              results.length > 0
            ) {
              const normalized = results
                .map((item, idx) => normalizePlaceRecord(item, idx))
                .filter(Boolean);

              if (normalized.length > 0) {
                registerDiscoveredPlaces(center, normalized);
                const sorted = sortPlacesByProximity(
                  [...normalized, ...allDiscoveredPlacesRef.current],
                  center,
                  18,
                );
                setPlaces(sorted);
                setIsLoadingPlaces(false);
                return;
              }
            }

            if (status === placesLib.PlacesServiceStatus.ZERO_RESULTS) {
              setPlaces([]);
              setPlacesError(
                "Nenhum ponto de interesse permitido encontrado próximo a este local.",
              );
              setIsLoadingPlaces(false);
              return;
            }

            // Tenta Places API (New) Place.searchNearby se disponível
            if (typeof placesLib.Place?.searchNearby === "function") {
              try {
                const { places: newPlaces } =
                  await placesLib.Place.searchNearby({
                    fields: [
                      "id",
                      "displayName",
                      "location",
                      "primaryType",
                      "types",
                      "formattedAddress",
                    ],
                    locationRestriction: {
                      center,
                      radius: 1200,
                    },
                    maxResultCount: 18,
                  });

                const normalized = (newPlaces || [])
                  .map((p, idx) =>
                    normalizePlaceRecord(
                      {
                        id: p.id,
                        name: p.displayName,
                        lat:
                          typeof p.location?.lat === "function"
                            ? p.location.lat()
                            : p.location?.lat,
                        lng:
                          typeof p.location?.lng === "function"
                            ? p.location.lng()
                            : p.location?.lng,
                        primaryType: p.primaryType,
                        types: p.types,
                        address: p.formattedAddress,
                      },
                      idx,
                    ),
                  )
                  .filter(Boolean);

                if (normalized.length > 0) {
                  registerDiscoveredPlaces(center, normalized);
                  const sorted = sortPlacesByProximity(
                    [...normalized, ...allDiscoveredPlacesRef.current],
                    center,
                    18,
                  );
                  setPlaces(sorted);
                  setIsLoadingPlaces(false);
                  return;
                }
              } catch {
                // Tratado abaixo
              }
            }

            setPlacesError(
              `Não foi possível carregar pontos de interesse (Status: ${status || "ERRO_API"}). Verifique se a Google Places API está habilitada.`,
            );
            setIsLoadingPlaces(false);
          },
        );
      } catch {
        inFlightCenterRef.current = null;
        setPlacesError("Erro ao inicializar o serviço Google Places.");
        setIsLoadingPlaces(false);
      }
    },
    [initialCoords, map, placesLib, registerDiscoveredPlaces],
  );

  useEffect(() => {
    if (!map || !placesLib) return;
    const timerId = setTimeout(() => {
      fetchNearbyPlaces(initialCoords);
    }, 0);
    return () => clearTimeout(timerId);
  }, [map, placesLib, initialCoords, fetchNearbyPlaces]);

  // Seção 5.3: Busca híbrida progressiva de destinos de transporte do mesmo tipo (airport -> airport, bus_station -> bus_station)
  const handleOpenTransportMap = useCallback(
    async (originPlace) => {
      if (!originPlace) return;

      const rawSub = String(originPlace.subcategory || "").toLowerCase();
      const transportType = rawSub.includes("airport")
        ? "airport"
        : "bus_station";

      clearRoutePolyline();
      stopMovementAnimation();
      setArrivedPlace(null);

      setTransportMode({
        originPlace,
        transportType,
        destinations: [],
        isLoading: true,
        error: null,
        selectedDestination: null,
        isTraveling: false,
        travelError: null,
        maxRadiusReachedMeters: 1200,
      });

      const originCoord = { lat: originPlace.lat, lng: originPlace.lng };

      const normalizeDestinationEntry = (rawItem) => {
        if (!rawItem || !rawItem.id) return null;
        if (rawItem.id === originPlace.id) return null;

        const lat = Number(rawItem.lat ?? rawItem.latitude);
        const lng = Number(rawItem.lng ?? rawItem.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

        // Valida categoria e subcategoria para garantir que somente lugares do mesmo tipo de transporte apareçam
        if (
          rawItem.category &&
          (rawItem.category !== "Transportation" ||
            rawItem.subcategory !== transportType)
        ) {
          return null;
        }

        if (!rawItem.category && (rawItem.primaryType || rawItem.types)) {
          const classified = normalizePlaceRecord(
            {
              id: rawItem.id,
              name: rawItem.name,
              lat,
              lng,
              primaryType: rawItem.primaryType,
              types: rawItem.types,
              address: rawItem.address,
            },
            0,
          );
          if (
            !classified ||
            classified.category !== "Transportation" ||
            classified.subcategory !== transportType
          ) {
            return null;
          }
        }

        const distKm =
          typeof rawItem.distanceKm === "number" && rawItem.distanceKm > 0
            ? Number(rawItem.distanceKm.toFixed(3))
            : Number(
                haversineDistanceKm(originCoord, { lat, lng }).toFixed(3),
              );

        if (distKm < 0.02) return null; // Exclui o próprio terminal atual

        const rawCost = rawItem.costCoins ?? rawItem.travelCostCoins;

        return {
          id: rawItem.id,
          name: rawItem.name || "Terminal de Transporte",
          category: "Transportation",
          subcategory: transportType,
          lat,
          lng,
          address: rawItem.address || null,
          distanceKm: distKm,
          costCoins:
            typeof rawCost === "number" && rawCost > 0
              ? rawCost
              : calcularCustoViagemTransporte(distKm),
        };
      };

      const applyFoundDestinations = (list, radiusReached) => {
        const dedupedMap = new globalThis.Map();
        for (const item of list) {
          const norm = normalizeDestinationEntry(item);
          if (norm && !dedupedMap.has(norm.id)) {
            dedupedMap.set(norm.id, norm);
          }
        }

        const ordered = Array.from(dedupedMap.values())
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, MAX_TRANSPORT_DESTINATIONS);

        setTransportMode((prev) =>
          prev
            ? {
                ...prev,
                destinations: ordered,
                isLoading: false,
                error: null,
                maxRadiusReachedMeters: radiusReached,
              }
            : null,
        );

        if (map && ordered.length > 0 && window.google?.maps?.LatLngBounds) {
          try {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(originCoord);
            for (const dest of ordered) {
              bounds.extend({ lat: dest.lat, lng: dest.lng });
            }
            map.fitBounds(bounds, 72);
          } catch {
            // Mantém zoom atual se fitBounds falhar
          }
        }
      };

      // Pré-carrega candidatos compatíveis já conhecidos no mapa para garantir destinos imediatos do mesmo subtipo
      const collectedById = new globalThis.Map();
      for (const known of [...places, ...allDiscoveredPlacesRef.current]) {
        if (
          known &&
          known.category === "Transportation" &&
          known.subcategory === transportType &&
          known.id !== originPlace.id
        ) {
          const norm = normalizeDestinationEntry(known);
          if (norm && !collectedById.has(norm.id)) {
            collectedById.set(norm.id, norm);
          }
        }
      }

      // 1. Tenta endpoint dedicado do Backend (Places API New progressivo 1200m -> 50km)
      try {
        const backendData = await buscarDestinosTransporte({
          lat: originCoord.lat,
          lng: originCoord.lng,
          type: transportType,
          excludePlaceId: originPlace.id,
        });

        if (
          Array.isArray(backendData?.destinations) &&
          backendData.destinations.length > 0
        ) {
          const mergedBackend = [
            ...Array.from(collectedById.values()),
            ...backendData.destinations,
          ];
          applyFoundDestinations(
            mergedBackend,
            backendData.radiusMetersUsed ||
              backendData.maxRadiusReachedMeters ||
              1200,
          );
          return;
        }
      } catch {
        // Prossegue para busca progressiva via Google Places API (New) no navegador
      }

      // 2. Fallback híbrido progressivo no navegador: raios [1200, 5000, 15000, 30000, 50000] metros
      let lastRadiusUsed = 1200;
      const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const searchIncludedTypes =
        transportType === "airport"
          ? ["airport", "international_airport", "airstrip"]
          : ["bus_station", "bus_stop"];

      for (const radiusMeters of PROGRESSIVE_TRANSPORT_RADII_METERS) {
        lastRadiusUsed = radiusMeters;
        let radiusBatch = [];

        // 2a. Google Places API Nearby Search (New) via SDK (Place.searchNearby)
        if (placesLib && typeof placesLib.Place?.searchNearby === "function") {
          try {
            const { places: sdkPlaces } = await placesLib.Place.searchNearby({
              fields: [
                "id",
                "displayName",
                "location",
                "primaryType",
                "types",
                "formattedAddress",
              ],
              locationRestriction: {
                center: originCoord,
                radius: radiusMeters,
              },
              includedTypes: searchIncludedTypes,
              maxResultCount: 20,
              rankPreference: "DISTANCE",
            });

            if (Array.isArray(sdkPlaces) && sdkPlaces.length > 0) {
              radiusBatch = sdkPlaces.map((p) => ({
                id: p.id,
                name: p.displayName,
                lat:
                  typeof p.location?.lat === "function"
                    ? p.location.lat()
                    : p.location?.lat,
                lng:
                  typeof p.location?.lng === "function"
                    ? p.location.lng()
                    : p.location?.lng,
                primaryType: p.primaryType,
                types: p.types,
                address: p.formattedAddress,
              }));
            }
          } catch {
            // Tenta chamada REST New ou PlacesService abaixo
          }
        }

        // 2b. Google Places API Nearby Search (New) via REST v1
        if (radiusBatch.length === 0 && mapsApiKey) {
          try {
            const resp = await fetch(
              "https://places.googleapis.com/v1/places:searchNearby",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Goog-Api-Key": mapsApiKey,
                  "X-Goog-FieldMask":
                    "places.id,places.displayName,places.location,places.primaryType,places.types,places.formattedAddress",
                },
                body: JSON.stringify({
                  includedTypes: searchIncludedTypes,
                  maxResultCount: 20,
                  rankPreference: "DISTANCE",
                  locationRestriction: {
                    circle: {
                      center: {
                        latitude: originCoord.lat,
                        longitude: originCoord.lng,
                      },
                      radius: radiusMeters,
                    },
                  },
                }),
              },
            );

            if (resp.ok) {
              const json = await resp.json();
              if (Array.isArray(json?.places)) {
                radiusBatch = json.places.map((p) => ({
                  id: p.id,
                  name: p.displayName?.text || "Terminal",
                  lat: p.location?.latitude,
                  lng: p.location?.longitude,
                  primaryType: p.primaryType,
                  types: p.types,
                  address: p.formattedAddress,
                }));
              }
            }
          } catch {
            // Continua para PlacesService fallback
          }
        }

        // 2c. Fallback legado PlacesService.nearbySearch filtrado estritamente pelo tipo de transporte
        if (radiusBatch.length === 0 && map && placesLib?.PlacesService) {
          try {
            radiusBatch = await new Promise((resolve) => {
              const service = new placesLib.PlacesService(map);
              service.nearbySearch(
                {
                  location: originCoord,
                  radius: radiusMeters,
                  type: transportType,
                },
                (results, status) => {
                  if (
                    status === placesLib.PlacesServiceStatus.OK &&
                    Array.isArray(results)
                  ) {
                    resolve(
                      results.map((r) => ({
                        id: r.place_id,
                        name: r.name,
                        lat:
                          typeof r.geometry?.location?.lat === "function"
                            ? r.geometry.location.lat()
                            : r.geometry?.location?.lat,
                        lng:
                          typeof r.geometry?.location?.lng === "function"
                            ? r.geometry.location.lng()
                            : r.geometry?.location?.lng,
                        primaryType: r.primary_type || r.primaryType,
                        types: r.types,
                        address: r.vicinity,
                      })),
                    );
                  } else {
                    resolve([]);
                  }
                },
              );
            });
          } catch {
            radiusBatch = [];
          }
        }

        for (const candidate of radiusBatch) {
          const norm = normalizeDestinationEntry(candidate);
          if (norm && !collectedById.has(norm.id)) {
            collectedById.set(norm.id, norm);
          }
        }

        if (collectedById.size >= MAX_TRANSPORT_DESTINATIONS) {
          break;
        }
      }

      applyFoundDestinations(
        Array.from(collectedById.values()),
        lastRadiusUsed,
      );
    },
    [clearRoutePolyline, stopMovementAnimation, map, placesLib, places],
  );

  // Seção 5.7: Sair do modo de transporte sem alterar posição, moedas ou estado do jogador
  const handleExitTransportMode = useCallback(() => {
    setTransportMode(null);
    if (map && playerCoords) {
      map.panTo(playerCoords);
      map.setZoom(16);
    }
  }, [map, playerCoords]);

  // Seção 5.6: Confirmar e executar a viagem direta entre terminais de transporte
  const handleConfirmTransportTravel = useCallback(async () => {
    if (
      !transportMode?.originPlace ||
      !transportMode?.selectedDestination ||
      transportMode.isTraveling ||
      !onTravelTransport
    ) {
      return;
    }

    const originPlace = transportMode.originPlace;
    const destination = transportMode.selectedDestination;
    const currentCoins =
      playerState?.moedas ?? playerState?.atributos?.moedas ?? 0;

    if (currentCoins < destination.costCoins) {
      setTransportMode((prev) =>
        prev
          ? {
              ...prev,
              travelError: `Moedas insuficientes para a viagem. Custo: ${destination.costCoins}g (Saldo atual: ${currentCoins}g).`,
            }
          : null,
      );
      return;
    }

    setTransportMode((prev) =>
      prev ? { ...prev, isTraveling: true, travelError: null } : null,
    );

    try {
      await onTravelTransport(originPlace, destination);

      const newCoords = { lat: destination.lat, lng: destination.lng };
      setTransportMode(null);
      clearRoutePolyline();
      stopMovementAnimation();
      setPlayerCoords(newCoords);

      if (map) {
        map.panTo(newCoords);
        map.setZoom(16);
      }

      fetchNearbyPlaces(newCoords, { forceRefresh: true });

      const arrivedTransportPlace = normalizePlaceRecord({
        id: destination.id,
        name: destination.name,
        lat: destination.lat,
        lng: destination.lng,
        category: "Transportation",
        subcategory: destination.subcategory,
        primaryType: destination.subcategory,
        types: [destination.subcategory],
        address: destination.address,
      });

      if (arrivedTransportPlace) {
        setSelectedPlace(arrivedTransportPlace);
        setHasArrivedAtPlace(true);
        setLastRouteSummary({ distanciaKm: 0, energiaConsumida: 0 });
        setArrivedPlace(arrivedTransportPlace);
      }
    } catch (err) {
      setTransportMode((prev) =>
        prev
          ? {
              ...prev,
              isTraveling: false,
              travelError:
                err?.message ||
                "Não foi possível concluir a viagem de transporte.",
            }
          : null,
      );
    }
  }, [
    transportMode,
    onTravelTransport,
    playerState?.moedas,
    playerState?.atributos?.moedas,
    clearRoutePolyline,
    stopMovementAnimation,
    map,
    fetchNearbyPlaces,
  ]);

  const startCombatSession = useCallback(
    async (tipoCombate, targetPlace) => {
      activeCombatPlaceRef.current =
        tipoCombate === COMBAT_TYPES.RANDOM ? null : targetPlace || null;
      const sessao = await iniciarSessaoCombate({
        jogadorId: playerState?.id || 1,
        tipoCombate,
        nomeLocal: targetPlace?.name || "Trajeto Urbano",
        placeId:
          tipoCombate === COMBAT_TYPES.RANDOM
            ? null
            : targetPlace?.id || null,
        cidadeId: 1,
      });
      setActiveCombatSession(sessao);
    },
    [playerState?.id],
  );

  const calculateRouteEnergyCost = useCallback(
    (distanceKm) => {
      const safeDist = Math.max(0, Number(distanceKm) || 0);
      if (safeDist <= 0) return 0;
      const consumoPorKm =
        playerState?.atributos?.consumoEnergiaPorKm ??
        10 / Math.pow(2, (playerState?.atributos?.velocidadeFinal ?? 0) / 100);
      return Number((safeDist * consumoPorKm).toFixed(2));
    },
    [
      playerState?.atributos?.consumoEnergiaPorKm,
      playerState?.atributos?.velocidadeFinal,
    ],
  );

  const runRouteStepAnimation = useCallback(
    (
      steps,
      startStepIndex,
      destinationPlace,
      encounterPlan = null,
      alreadyTriggeredEncounter = false,
      routeMeta = null,
    ) => {
      if (!map) return;

      const totalSteps = Math.max(1, steps.length - 1);
      const totalDistanceKm = routeMeta?.routeDistanceKm ?? 0.01;
      const totalEnergyCost =
        routeMeta?.energiaConsumida ??
        calculateRouteEnergyCost(totalDistanceKm);
      const startingEnergy = Number(
        routeMeta?.startingEnergy ??
          playerState?.atributos?.energiaAtual ??
          100,
      );

      let currentStep = startStepIndex;
      let triggeredEncounter = alreadyTriggeredEncounter;
      setIsMoving(true);

      animationTimerRef.current = setInterval(() => {
        currentStep += 1;

        const progressRatio = Math.min(1, currentStep / totalSteps);
        const consumedSoFar = totalEnergyCost * progressRatio;
        const remainingEnergy = Number(
          (startingEnergy - consumedSoFar).toFixed(2),
        );

        if (remainingEnergy <= 0 && currentStep < steps.length) {
          clearInterval(animationTimerRef.current);
          animationTimerRef.current = null;
          pausedRouteRef.current = null;

          const stopCoord = steps[currentStep] || playerCoords;
          setPlayerCoords(stopCoord);
          setIsMoving(false);
          clearRoutePolyline();
          setArrivedPlace(null);

          const partialDistKm = Math.max(
            0.01,
            Number((totalDistanceKm * progressRatio).toFixed(3)),
          );
          if (onRegisterRouteTraversal) {
            onRegisterRouteTraversal(
              partialDistKm,
              destinationPlace,
              false,
            ).catch(() => {});
          }
          if (onUpdatePlayerHp) {
            onUpdatePlayerHp(
              playerState?.atributos?.vidaAtual ?? 50,
              0,
            ).catch(() => {});
          }
          setRecoveryMode("esgotamento");
          return;
        }

        if (
          encounterPlan?.willTrigger &&
          !triggeredEncounter &&
          currentStep === encounterPlan.triggerStep
        ) {
          triggeredEncounter = true;
          clearInterval(animationTimerRef.current);
          animationTimerRef.current = null;

          const pauseCoord = steps[currentStep] || playerCoords;
          setPlayerCoords(pauseCoord);
          setIsMoving(false);

          pausedRouteRef.current = {
            steps,
            currentStep,
            destinationPlace,
            routeMeta,
          };

          startCombatSession(COMBAT_TYPES.RANDOM, destinationPlace);
          return;
        }

        if (currentStep >= steps.length) {
          clearInterval(animationTimerRef.current);
          animationTimerRef.current = null;
          pausedRouteRef.current = null;

          const finalCoord = {
            lat: destinationPlace.lat,
            lng: destinationPlace.lng,
          };
          setPlayerCoords(finalCoord);
          setIsMoving(false);
          map.panTo(finalCoord);
          fetchNearbyPlaces(finalCoord);

          if (onRegisterRouteTraversal) {
            onRegisterRouteTraversal(totalDistanceKm, destinationPlace, true)
              .then((result) => {
                if (result) {
                  setLastRouteSummary({
                    distanciaKm: result.distanciaKm ?? totalDistanceKm,
                    energiaConsumida:
                      result.energiaConsumida ?? totalEnergyCost,
                  });
                }
                const nextEnergy =
                  result?.jogador?.atributos?.energiaAtual ?? remainingEnergy;
                if (nextEnergy <= 0) {
                  clearRoutePolyline();
                  setArrivedPlace(null);
                  setRecoveryMode("esgotamento");
                } else {
                  setHasArrivedAtPlace(true);
                  setArrivedPlace(destinationPlace);
                }
              })
              .catch(() => {
                setHasArrivedAtPlace(true);
                setArrivedPlace(destinationPlace);
              });
          } else {
            setHasArrivedAtPlace(true);
            setArrivedPlace(destinationPlace);
          }
          return;
        }

        setPlayerCoords(steps[currentStep]);
      }, 35);
    },
    [
      map,
      playerCoords,
      playerState?.atributos?.energiaAtual,
      playerState?.atributos?.vidaAtual,
      calculateRouteEnergyCost,
      clearRoutePolyline,
      onRegisterRouteTraversal,
      onUpdatePlayerHp,
      fetchNearbyPlaces,
      startCombatSession,
    ],
  );

  const prepareRoutePreview = useCallback(
    (
      pathCoords,
      destinationPlace,
      originCoord,
      explicitDistanceKm = null,
    ) => {
      if (!map) return;

      clearRoutePolyline();

      const polyline = new window.google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: "#38BDF8",
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map,
      });
      polylineRef.current = polyline;

      const pathDistKm = calculatePathDistanceKm(pathCoords);
      const directDistKm = haversineDistanceKm(originCoord, {
        lat: destinationPlace.lat,
        lng: destinationPlace.lng,
      });

      const rawDistanceKm =
        typeof explicitDistanceKm === "number" && explicitDistanceKm > 0
          ? explicitDistanceKm
          : pathDistKm > 0
            ? pathDistKm
            : directDistKm;

      const routeDistanceKm = Math.max(0.01, Number(rawDistanceKm.toFixed(3)));
      const energiaConsumida = calculateRouteEnergyCost(routeDistanceKm);

      preparedRouteRef.current = {
        pathCoords,
        destinationPlace,
        originCoord,
        routeDistanceKm,
        energiaConsumida,
      };

      setLastRouteSummary({
        distanciaKm: routeDistanceKm,
        energiaConsumida,
      });
    },
    [map, clearRoutePolyline, calculateRouteEnergyCost],
  );

  const drawRouteAndAnimate = useCallback(
    async (
      pathCoords,
      destinationPlace,
      originCoord,
      explicitDistanceKm = null,
    ) => {
      if (!map || recoveryMode) return;

      const currentEnergy = Number(
        playerState?.atributos?.energiaAtual ?? 100,
      );
      if (currentEnergy <= 0) {
        clearRoutePolyline();
        stopMovementAnimation();
        setArrivedPlace(null);
        setRecoveryMode("esgotamento");
        return;
      }

      clearRoutePolyline();
      stopMovementAnimation();

      const polyline = new window.google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: "#38BDF8",
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map,
      });
      polylineRef.current = polyline;

      const pathDistKm = calculatePathDistanceKm(pathCoords);
      const directDistKm = haversineDistanceKm(originCoord, {
        lat: destinationPlace.lat,
        lng: destinationPlace.lng,
      });

      const rawDistanceKm =
        typeof explicitDistanceKm === "number" && explicitDistanceKm > 0
          ? explicitDistanceKm
          : pathDistKm > 0
            ? pathDistKm
            : directDistKm;

      const routeDistanceKm = Math.max(0.01, Number(rawDistanceKm.toFixed(3)));
      const energiaConsumida = calculateRouteEnergyCost(routeDistanceKm);

      const steps = interpolateRoutePoints(pathCoords, 90);
      if (steps.length === 0) {
        const finalCoord = {
          lat: destinationPlace.lat,
          lng: destinationPlace.lng,
        };
        setPlayerCoords(finalCoord);
        if (onRegisterRouteTraversal) {
          await onRegisterRouteTraversal(
            routeDistanceKm,
            destinationPlace,
            true,
          );
        }
        setHasArrivedAtPlace(true);
        setArrivedPlace(destinationPlace);
        map.panTo(finalCoord);
        fetchNearbyPlaces(finalCoord);
        return;
      }

      const encounterPlan = planRouteRandomEncounter(
        routeDistanceKm,
        steps.length,
      );

      runRouteStepAnimation(
        steps,
        0,
        destinationPlace,
        encounterPlan,
        false,
        {
          routeDistanceKm,
          energiaConsumida,
          startingEnergy: currentEnergy,
        },
      );
    },
    [
      map,
      recoveryMode,
      playerState?.atributos?.energiaAtual,
      clearRoutePolyline,
      stopMovementAnimation,
      calculateRouteEnergyCost,
      onRegisterRouteTraversal,
      fetchNearbyPlaces,
      runRouteStepAnimation,
    ],
  );

  const handleGoToPlace = useCallback(
    (targetPlace) => {
      if (recoveryMode) return;
      const place = targetPlace || arrivedPlace || selectedPlace;
      if (!place) return;

      const origin = { lat: playerCoords.lat, lng: playerCoords.lng };
      const destination = { lat: place.lat, lng: place.lng };
      const prepared = preparedRouteRef.current;

      const pathCoords =
        prepared &&
        prepared.destinationPlace?.id === place.id &&
        Array.isArray(prepared.pathCoords) &&
        prepared.pathCoords.length > 0
          ? prepared.pathCoords
          : [origin, destination];

      const explicitDistanceKm =
        prepared && prepared.destinationPlace?.id === place.id
          ? prepared.routeDistanceKm
          : null;

      setArrivedPlace(null);
      drawRouteAndAnimate(pathCoords, place, origin, explicitDistanceKm);
    },
    [
      recoveryMode,
      arrivedPlace,
      selectedPlace,
      playerCoords,
      drawRouteAndAnimate,
    ],
  );

  const handleFinishCombat = useCallback(
    async (result) => {
      const finishedCombatType = activeCombatSession?.tipoCombate;
      const combatPlace = activeCombatPlaceRef.current;
      activeCombatPlaceRef.current = null;
      setActiveCombatSession(null);

      const isDefeated =
        (result?.vitoria === false && !result?.fugiu) ||
        (typeof result?.hpRestante === "number" && result.hpRestante <= 0);

      const nextHp = isDefeated
        ? 0
        : Math.max(1, Math.round(result?.hpRestante ?? 1));
      const nextEnergy =
        typeof result?.energiaRestante === "number"
          ? Math.max(0, result.energiaRestante)
          : null;

      if (
        onCompleteCombatPlace &&
        (combatPlace || isDefeated || result?.vitoria)
      ) {
        try {
          await onCompleteCombatPlace({
            placeId: combatPlace?.id || null,
            nome: combatPlace?.name || null,
            categoria: combatPlace?.category || null,
            subcategoria: combatPlace?.subcategory || null,
            latitude: combatPlace?.lat ?? null,
            longitude: combatPlace?.lng ?? null,
            tipoCombate: finishedCombatType || "arena",
            vitoria: Boolean(result?.vitoria),
            hpRestante: nextHp,
            vidaRestante: nextHp,
            energiaRestante: nextEnergy,
            moedasGanhas: Number(result?.moedasGanhas) || 0,
          });
        } catch {
          if (onUpdatePlayerHp) {
            await onUpdatePlayerHp(nextHp, nextEnergy);
          }
        }
      } else if (onUpdatePlayerHp) {
        await onUpdatePlayerHp(nextHp, nextEnergy);
      }

      if (isDefeated) {
        pausedRouteRef.current = null;
        clearRoutePolyline();
        stopMovementAnimation();
        setArrivedPlace(null);
        setRecoveryMode("morte");
        return;
      }

      if (typeof nextEnergy === "number" && nextEnergy <= 0) {
        pausedRouteRef.current = null;
        clearRoutePolyline();
        stopMovementAnimation();
        setArrivedPlace(null);
        setRecoveryMode("esgotamento");
        return;
      }

      if (
        finishedCombatType === COMBAT_TYPES.RANDOM &&
        pausedRouteRef.current
      ) {
        const { steps, currentStep, destinationPlace, routeMeta } =
          pausedRouteRef.current;
        pausedRouteRef.current = null;
        runRouteStepAnimation(
          steps,
          currentStep,
          destinationPlace,
          null,
          true,
          routeMeta,
        );
      }
    },
    [
      activeCombatSession,
      onCompleteCombatPlace,
      onUpdatePlayerHp,
      clearRoutePolyline,
      stopMovementAnimation,
      runRouteStepAnimation,
    ],
  );

  const handleSelectReturnDestination = useCallback(
    async (motivo, destino) => {
      if (!onReturnToCheckpoint) return;

      clearRoutePolyline();
      stopMovementAnimation();
      setArrivedPlace(null);

      const response = await onReturnToCheckpoint(motivo, destino);
      setRecoveryMode(null);

      const destLat =
        typeof response?.latitude === "number"
          ? response.latitude
          : homePlace.lat;
      const destLng =
        typeof response?.longitude === "number"
          ? response.longitude
          : homePlace.lng;
      const destCoords = { lat: destLat, lng: destLng };

      setPlayerCoords(destCoords);
      if (map) {
        map.panTo(destCoords);
      }
      fetchNearbyPlaces(destCoords);

      const targetPlaceId = response?.destinoPlaceId || response?.placeId;
      const targetName =
        response?.destinoNome || response?.nomeDestino || "Ponto de Retorno";

      if (destino === "home" || targetPlaceId === "home") {
        setSelectedPlace(homePlace);
        setHasArrivedAtPlace(true);
        setLastRouteSummary({ distanciaKm: 0, energiaConsumida: 0 });
        setArrivedPlace(homePlace);
      } else if (targetPlaceId) {
        const matchedPlace =
          places.find((p) => p.id === targetPlaceId) ||
          allDiscoveredPlacesRef.current.find(
            (p) => p.id === targetPlaceId,
          ) ||
          normalizePlaceRecord({
            id: targetPlaceId,
            name: targetName,
            lat: destLat,
            lng: destLng,
            primaryType:
              motivo === "esgotamento"
                ? playerState?.checkpointEnergia?.subcategoria || "hotel"
                : playerState?.checkpointVida?.subcategoria || "hospital",
          });

        if (matchedPlace) {
          setSelectedPlace(matchedPlace);
          setHasArrivedAtPlace(true);
          setLastRouteSummary({ distanciaKm: 0, energiaConsumida: 0 });
          setArrivedPlace(matchedPlace);
        }
      }
    },
    [
      onReturnToCheckpoint,
      clearRoutePolyline,
      stopMovementAnimation,
      homePlace,
      map,
      fetchNearbyPlaces,
      places,
      playerState?.checkpointEnergia?.subcategoria,
      playerState?.checkpointVida?.subcategoria,
    ],
  );

  const handleSelectPlace = useCallback(
    async (place) => {
      if (!place || !routesLib || !map || recoveryMode || transportMode) return;

      stopMovementAnimation();
      setSelectedPlace(place);
      setRouteError(null);

      const origin = { lat: playerCoords.lat, lng: playerCoords.lng };
      const destination = { lat: place.lat, lng: place.lng };

      if (haversineDistanceKm(origin, destination) < 0.015) {
        clearRoutePolyline();
        preparedRouteRef.current = null;
        setIsCalculatingRoute(false);
        setHasArrivedAtPlace(true);
        setLastRouteSummary({ distanciaKm: 0, energiaConsumida: 0 });
        setArrivedPlace(place);
        if (onVisitPlace && place.id !== "home") {
          onVisitPlace(place).catch(() => {});
        }
        return;
      }

      setHasArrivedAtPlace(false);
      prepareRoutePreview([origin, destination], place, origin);
      setArrivedPlace(place);
      setIsCalculatingRoute(true);

      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch(
          `${apiBase}/api/directions?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}&mode=walking`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);

        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.points) && data.points.length > 0) {
            setIsCalculatingRoute(false);
            const pathCoords = data.points.map((p) => ({
              lat: typeof p.lat === "number" ? p.lat : p.Lat,
              lng: typeof p.lng === "number" ? p.lng : p.Lng,
            }));
            prepareRoutePreview(pathCoords, place, origin, data.distanceKm);
            return;
          }
        }
      } catch {
        // Backend não disponível; prossegue para tentativa direta
      }

      const directionsKey =
        import.meta.env.VITE_GOOGLE_DIRECTIONS_API_KEY ||
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (directionsKey) {
        try {
          const routesResp = await fetch(
            "https://routes.googleapis.com/directions/v2:computeRoutes",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": directionsKey,
                "X-Goog-FieldMask":
                  "routes.distanceMeters,routes.polyline.encodedPolyline",
              },
              body: JSON.stringify({
                origin: {
                  location: {
                    latLng: { latitude: origin.lat, longitude: origin.lng },
                  },
                },
                destination: {
                  location: {
                    latLng: {
                      latitude: destination.lat,
                      longitude: destination.lng,
                    },
                  },
                },
                travelMode: "WALK",
              }),
            },
          );

          if (routesResp.ok) {
            const routesData = await routesResp.json();
            const firstRoute = routesData?.routes?.[0];
            const encoded = firstRoute?.polyline?.encodedPolyline;
            const decoded = decodeEncodedPolyline(encoded);
            if (decoded.length > 0) {
              setIsCalculatingRoute(false);
              const distKm =
                typeof firstRoute?.distanceMeters === "number"
                  ? Number((firstRoute.distanceMeters / 1000).toFixed(3))
                  : null;
              prepareRoutePreview(decoded, place, origin, distKm);
              return;
            }
          }
        } catch {
          // Prossegue para DirectionsService do Maps JS SDK
        }
      }

      const directionsService = new routesLib.DirectionsService();

      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === "OK" && result?.routes?.[0]?.overview_path?.length) {
            setIsCalculatingRoute(false);
            const pathCoords = result.routes[0].overview_path.map((pt) => ({
              lat: pt.lat(),
              lng: pt.lng(),
            }));
            const legMeters = result.routes[0]?.legs?.[0]?.distance?.value;
            const distKm =
              typeof legMeters === "number"
                ? Number((legMeters / 1000).toFixed(3))
                : null;
            prepareRoutePreview(pathCoords, place, origin, distKm);
            return;
          }

          directionsService.route(
            {
              origin,
              destination,
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (fallbackResult, fallbackStatus) => {
              setIsCalculatingRoute(false);
              if (
                fallbackStatus === "OK" &&
                fallbackResult?.routes?.[0]?.overview_path?.length
              ) {
                const pathCoords =
                  fallbackResult.routes[0].overview_path.map((pt) => ({
                    lat: pt.lat(),
                    lng: pt.lng(),
                  }));
                const legMeters =
                  fallbackResult.routes[0]?.legs?.[0]?.distance?.value;
                const distKm =
                  typeof legMeters === "number"
                    ? Number((legMeters / 1000).toFixed(3))
                    : null;
                prepareRoutePreview(pathCoords, place, origin, distKm);
                return;
              }

              const isDenied =
                fallbackStatus === "REQUEST_DENIED" ||
                status === "REQUEST_DENIED";
              if (isDenied) {
                setRouteError(
                  `Aviso: Directions API não habilitada no Google Cloud (${fallbackStatus || status}). Utilizando trajeto direto alternativo até o destino.`,
                );
              } else {
                setRouteError(
                  `Não foi possível calcular trajeto pelas vias (${fallbackStatus || status}). Utilizando trajeto direto alternativo.`,
                );
              }

              prepareRoutePreview([origin, destination], place, origin);
            },
          );
        },
      );
    },
    [
      routesLib,
      map,
      recoveryMode,
      transportMode,
      playerCoords,
      stopMovementAnimation,
      clearRoutePolyline,
      prepareRoutePreview,
      onVisitPlace,
    ],
  );

  const playerName = playerState?.nome || "Explorador";
  const characterName =
    playerState?.personagemAtual?.nome || character?.name || "Explorador #1";
  const vidaAtual = playerState?.atributos?.vidaAtual ?? 50;
  const vidaFinal = Math.max(1, playerState?.atributos?.vidaFinal ?? 50);
  const energiaAtual = playerState?.atributos?.energiaAtual ?? 100;
  const energiaMaxima = Math.max(
    1,
    playerState?.atributos?.energiaMaximaFinal ?? 100,
  );
  const nivelDePoder = playerState?.atributos?.nivelDePoder ?? 10;
  const moedas = playerState?.moedas ?? playerState?.atributos?.moedas ?? 0;

  const vidaPercent = Math.max(
    0,
    Math.min(100, Math.round((vidaAtual / vidaFinal) * 100)),
  );
  const energiaPercent = Math.max(
    0,
    Math.min(100, Math.round((energiaAtual / energiaMaxima) * 100)),
  );

  const isTransportModeActive = Boolean(transportMode);
  const transportTypeTranslated = transportMode
    ? getTranslatedSubcategory(transportMode.transportType, "Transportation")
    : "";

  return (
    <div
      data-testid={
        isTransportModeActive ? "transport-map-container" : "game-map-container"
      }
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: isTransportModeActive ? "#0B192C" : "#161D18",
      }}
    >
      {/* Mapa ocupando toda a tela */}
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <Map
          defaultCenter={initialCoords}
          defaultZoom={16}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={false}
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
          styles={
            isTransportModeActive ? TRANSPORT_MAP_STYLES : GAME_MAP_STYLES
          }
          style={{ width: "100%", height: "100%" }}
        >
          {/* Marcador do Jogador */}
          <Marker
            position={playerCoords}
            title={`${characterName} (Sua posição)`}
            icon={characterSquareIcon}
            zIndex={1000}
          />

          {/* MODO NORMAL: Marcador especial do Home + Places normais */}
          {!isTransportModeActive && homePlace && (
            <Marker
              position={{ lat: homePlace.lat, lng: homePlace.lng }}
              title="Home (Local especial — Ponto inicial)"
              icon={createHomeIconDataUrl(selectedPlace?.id === "home")}
              zIndex={selectedPlace?.id === "home" ? 700 : 600}
              onClick={() => handleSelectPlace(homePlace)}
            />
          )}

          {!isTransportModeActive &&
            places.map((place) => {
              const isSelected = selectedPlace?.id === place.id;
              return (
                <Marker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  title={`${place.name} (${place.category})`}
                  icon={createPlaceIconDataUrl(
                    place.color,
                    isSelected,
                    place.isBossSpecial,
                  )}
                  zIndex={isSelected ? 500 : place.isBossSpecial ? 300 : 100}
                  onClick={() => handleSelectPlace(place)}
                />
              );
            })}

          {/* MODO DE TRANSPORTE (Seção 5.2): Mostra SOMENTE os pontos de transporte do mesmo tipo */}
          {isTransportModeActive &&
            transportMode.destinations.map((dest) => {
              const isSelectedDest =
                transportMode.selectedDestination?.id === dest.id;
              return (
                <Marker
                  key={dest.id}
                  position={{ lat: dest.lat, lng: dest.lng }}
                  title={`${dest.name} (${transportTypeTranslated} • ${dest.distanceKm.toFixed(2)} km • ${dest.costCoins}g)`}
                  icon={createTransportDestinationIconDataUrl(isSelectedDest)}
                  zIndex={isSelectedDest ? 850 : 650}
                  onClick={() =>
                    setTransportMode((prev) =>
                      prev
                        ? {
                            ...prev,
                            selectedDestination: dest,
                            travelError: null,
                          }
                        : null,
                    )
                  }
                />
              );
            })}
        </Map>

        {/* Menu Superior — Overlay Minimalista Integrado ao Mapa */}
        <header
          data-testid="top-hud-overlay"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: isPlacesPanelCollapsed ? 180 : 324,
            maxWidth: 680,
            background: isTransportModeActive
              ? "rgba(11, 25, 44, 0.9)"
              : "rgba(19, 25, 21, 0.82)",
            backdropFilter: "blur(6px)",
            border: isTransportModeActive
              ? "1px solid #3B82F6"
              : "1px solid rgba(200, 155, 92, 0.45)",
            borderRadius: 10,
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            zIndex: 15,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
            pointerEvents: "auto",
            transition: "right 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: charVisual.color,
                border: `2px solid ${charVisual.borderColor}`,
                borderRadius: 4,
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  data-testid="hud-player-name"
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#EDE6D3",
                    lineHeight: 1.2,
                  }}
                >
                  {playerName}
                </span>
                <span
                  data-testid="hud-player-power"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#C89B5C",
                    background: "rgba(200, 155, 92, 0.14)",
                    border: "1px solid rgba(200, 155, 92, 0.4)",
                    borderRadius: 4,
                    padding: "1px 6px",
                  }}
                >
                  Poder {nivelDePoder}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "#9CAEA0",
                  flexWrap: "wrap",
                }}
              >
                <span data-testid="hud-character-name">{characterName}</span>
                <span style={{ color: "#3A4A3C" }}>•</span>
                <span
                  data-testid="hud-player-coins"
                  style={{ color: "#FBBF24", fontWeight: 600 }}
                >
                  Moedas: {moedas}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minWidth: 185,
              flex: "0 1 220px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: "#EDE6D3",
                  marginBottom: 2,
                }}
              >
                <span>VIDA</span>
                <strong data-testid="hud-health-value">
                  {vidaAtual}/{vidaFinal}
                </strong>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 7,
                  background: "rgba(15, 20, 16, 0.85)",
                  border: "1px solid #2E3B30",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  data-testid="hud-health-bar-fill"
                  style={{
                    width: `${vidaPercent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #DC2626, #EF4444)",
                    transition: "width 0.25s ease",
                  }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: "#EDE6D3",
                  marginBottom: 2,
                }}
              >
                <span>ENERGIA</span>
                <strong data-testid="hud-energy-value">
                  {Number(energiaAtual).toFixed(1)}/{energiaMaxima}
                </strong>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 7,
                  background: "rgba(15, 20, 16, 0.85)",
                  border: "1px solid #2E3B30",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  data-testid="hud-energy-bar-fill"
                  style={{
                    width: `${energiaPercent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #0284C7, #38BDF8)",
                    transition: "width 0.25s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Banner identificador do Modo Alternativo de Transporte (Seção 5.2) */}
        {isTransportModeActive && (
          <div
            data-testid="transport-mode-banner"
            style={{
              position: "absolute",
              top: 86,
              left: 12,
              maxWidth: 520,
              background: "rgba(15, 34, 61, 0.94)",
              border: "1px solid #38BDF8",
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "#E0F2FE",
              zIndex: 14,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55)",
            }}
          >
            <div style={{ fontWeight: 700, color: "#38BDF8", marginBottom: 2 }}>
              MODO DE TRANSPORTE • {transportTypeTranslated.toUpperCase()}
            </div>
            <div>
              Origem: <strong>{transportMode.originPlace?.name}</strong> •
              Exibindo apenas destinos de{" "}
              <strong>{transportTypeTranslated.toLowerCase()}</strong> (até{" "}
              {(
                (transportMode.maxRadiusReachedMeters || 1200) / 1000
              ).toFixed(1)}{" "}
              km).
            </div>
          </div>
        )}

        {/* Indicador discreto de deslocamento / erro (Modo Normal) */}
        {!isTransportModeActive &&
          (isCalculatingRoute || isMoving || placesError || routeError) && (
            <div
              style={{
                position: "absolute",
                top: 86,
                left: 12,
                maxWidth: 440,
                background:
                  placesError || routeError
                    ? "rgba(59, 24, 24, 0.9)"
                    : "rgba(19, 25, 21, 0.82)",
                border:
                  placesError || routeError
                    ? "1px solid #EF4444"
                    : "1px solid #2E3B30",
                borderRadius: 8,
                padding: "6px 12px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: placesError || routeError ? "#FCA5A5" : "#38BDF8",
                zIndex: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span>
                {routeError ||
                  placesError ||
                  (isCalculatingRoute
                    ? `Calculando rota até ${selectedPlace?.name}...`
                    : `Em deslocamento até ${selectedPlace?.name}...`)}
              </span>
              {placesError && (
                <button
                  type="button"
                  onClick={() =>
                    fetchNearbyPlaces(playerCoords, { forceRefresh: true })
                  }
                  style={{
                    padding: "3px 8px",
                    background: "#EF4444",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  Tentar novamente
                </button>
              )}
            </div>
          )}

        {/* Painel Lateral Direito: Alterna entre "Locais Próximos" (Modo Normal) e "Destinos de Transporte" (Modo Transporte) */}
        <aside
          data-testid="nearby-places-panel"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: isPlacesPanelCollapsed ? "auto" : 300,
            maxWidth: "42vw",
            maxHeight: isPlacesPanelCollapsed ? "auto" : "calc(100vh - 96px)",
            background: isTransportModeActive
              ? "rgba(11, 25, 44, 0.94)"
              : "rgba(19, 25, 21, 0.9)",
            backdropFilter: "blur(6px)",
            border: isTransportModeActive
              ? "1px solid #3B82F6"
              : "1px solid #2E3B30",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            zIndex: 15,
            boxShadow: "0 10px 28px rgba(0, 0, 0, 0.5)",
            transition: "all 0.2s ease",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: isPlacesPanelCollapsed ? "8px 12px" : "12px 14px",
              borderBottom: isPlacesPanelCollapsed
                ? "none"
                : isTransportModeActive
                  ? "1px solid #1E3A8A"
                  : "1px solid #2E3B30",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                color: isTransportModeActive ? "#60A5FA" : "#C89B5C",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              {isTransportModeActive
                ? `${transportTypeTranslated}s (${transportMode.destinations.length})`
                : `Locais Próximos (${places.length})`}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {!isPlacesPanelCollapsed &&
                (isLoadingPlaces || transportMode?.isLoading) && (
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      color: isTransportModeActive ? "#93C5FD" : "#8A9A8C",
                    }}
                  >
                    ...
                  </span>
                )}

              <button
                type="button"
                data-testid="toggle-nearby-places-btn"
                aria-expanded={!isPlacesPanelCollapsed}
                aria-label={
                  isPlacesPanelCollapsed
                    ? "Expandir painel de locais próximos"
                    : "Recolher painel de locais próximos"
                }
                onClick={() => setIsPlacesPanelCollapsed((prev) => !prev)}
                style={{
                  width: 24,
                  height: 24,
                  background: isTransportModeActive ? "#0F223D" : "#18201A",
                  border: isTransportModeActive
                    ? "1px solid #3B82F6"
                    : "1px solid #3A4A3C",
                  borderRadius: 5,
                  color: "#EDE6D3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                {isPlacesPanelCollapsed ? "▾" : "▴"}
              </button>
            </div>
          </div>

          {!isPlacesPanelCollapsed && (
            <div
              data-testid="nearby-places-list"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {isTransportModeActive ? (
                <>
                  {transportMode.isLoading && (
                    <div
                      data-testid="transport-loading-notice"
                      style={{
                        padding: 14,
                        fontSize: 12,
                        color: "#93C5FD",
                        textAlign: "center",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      Buscando destinos de{" "}
                      {transportTypeTranslated.toLowerCase()} próximos (até 50
                      km)...
                    </div>
                  )}

                  {!transportMode.isLoading &&
                    transportMode.destinations.length === 0 && (
                      <div
                        data-testid="transport-empty-notice"
                        style={{
                          padding: 14,
                          fontSize: 12,
                          color: "#93C5FD",
                          textAlign: "center",
                          fontFamily: "'IBM Plex Mono', monospace",
                          lineHeight: 1.5,
                        }}
                      >
                        Não há destinos de{" "}
                        {transportTypeTranslated.toLowerCase()} disponíveis na
                        região (busca realizada até 50 km).
                      </div>
                    )}

                  {transportMode.destinations.map((dest) => {
                    const isSelectedDest =
                      transportMode.selectedDestination?.id === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        data-testid={`transport-destination-item-${dest.id}`}
                        onClick={() =>
                          setTransportMode((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedDestination: dest,
                                  travelError: null,
                                }
                              : null,
                          )
                        }
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          width: "100%",
                          padding: "10px 11px",
                          background: isSelectedDest ? "#1E3A8A" : "#0F223D",
                          border: isSelectedDest
                            ? "1px solid #38BDF8"
                            : "1px solid #1E3A8A",
                          borderRadius: 8,
                          color: "#E0F2FE",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            marginTop: 3,
                            borderRadius: 3,
                            background: "#3B82F6",
                            border: "1px solid #93C5FD",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ overflow: "hidden", flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#FFFFFF",
                              marginBottom: 2,
                              wordBreak: "break-word",
                            }}
                          >
                            {dest.name}
                          </div>
                          <div
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 10,
                              color: "#93C5FD",
                            }}
                          >
                            {transportTypeTranslated} •{" "}
                            {dest.distanceKm.toFixed(2)} km •{" "}
                            <strong style={{ color: "#FBBF24" }}>
                              {dest.costCoins}g
                            </strong>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  {/* Place especial Home fixo no topo da lista (Modo Normal) */}
                  {homePlace && (
                    <button
                      type="button"
                      data-testid="nearby-place-item-home"
                      onClick={() => handleSelectPlace(homePlace)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        width: "100%",
                        padding: "9px 11px",
                        background:
                          selectedPlace?.id === "home" ? "#064E3B" : "#11221B",
                        border:
                          selectedPlace?.id === "home"
                            ? "1px solid #34D399"
                            : "1px solid rgba(52, 211, 153, 0.45)",
                        borderRadius: 8,
                        color: "#EDE6D3",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          marginTop: 3,
                          borderRadius: "50%",
                          background: "#10B981",
                          border: "1.5px solid #FDE047",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ overflow: "hidden" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#A7F3D0",
                            marginBottom: 2,
                          }}
                        >
                          Home (Ponto Inicial)
                        </div>
                        <div
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10,
                            color: "#6EE7B7",
                          }}
                        >
                          Local especial • Descanso Gratuito
                        </div>
                      </div>
                    </button>
                  )}

                  {!isLoadingPlaces && places.length === 0 && !placesError && (
                    <div
                      style={{
                        padding: 14,
                        fontSize: 12,
                        color: "#7C8C7E",
                        textAlign: "center",
                      }}
                    >
                      Nenhum ponto de interesse permitido encontrado.
                    </div>
                  )}

                  {places.map((place) => {
                    const isSelected = selectedPlace?.id === place.id;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        data-testid={`nearby-place-item-${place.id}`}
                        onClick={() => handleSelectPlace(place)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          width: "100%",
                          padding: "9px 11px",
                          background: isSelected ? "#1F2A22" : "#18201A",
                          border: isSelected
                            ? "1px solid #38BDF8"
                            : "1px solid #26332A",
                          borderRadius: 8,
                          color: "#EDE6D3",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            marginTop: 3,
                            borderRadius: 3,
                            background: place.color || "#C89B5C",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ overflow: "hidden" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#EDE6D3",
                              marginBottom: 2,
                              wordBreak: "break-word",
                            }}
                          >
                            {place.name}
                          </div>
                          <div
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 10,
                              color: "#8A9A8C",
                            }}
                          >
                            {place.category}
                            {place.isBossSpecial ? " • BOSS" : ""}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Submenu padronizado do Place selecionado (Modo Normal) */}
      {!isTransportModeActive && (
        <PlaceArrivalModal
          key={arrivedPlace?.id || "closed"}
          place={arrivedPlace}
          routeSummary={lastRouteSummary}
          hasArrived={hasArrivedAtPlace}
          isCalculatingRoute={isCalculatingRoute}
          playerEnergy={energiaAtual}
          playerState={playerState}
          onGoToPlace={handleGoToPlace}
          onStartArenaCombat={(targetPlace) => {
            setArrivedPlace(null);
            startCombatSession(COMBAT_TYPES.ARENA, targetPlace);
          }}
          onStartBossCombat={(targetPlace) => {
            setArrivedPlace(null);
            startCombatSession(COMBAT_TYPES.BOSS, targetPlace);
          }}
          onOpenShop={(targetPlace) => {
            setArrivedPlace(null);
            setActiveShopPlace(targetPlace);
          }}
          onHospitalHeal={onHospitalHeal}
          onLodgingRest={onLodgingRest}
          onHomeRest={(targetPlace) =>
            onHomeRest?.(
              targetPlace?.lat ?? homePlace.lat,
              targetPlace?.lng ?? homePlace.lng,
            )
          }
          onExploreNaturalFeature={onExploreNaturalFeature}
          onOpenTransportMap={handleOpenTransportMap}
          onTrainSports={onTrainSports}
          onClose={() => setArrivedPlace(null)}
        />
      )}

      {/* Seção 5.4: Menu do destino no modo transporte (cor diferenciada, distância, custo em moedas e botão IR) */}
      {isTransportModeActive && transportMode.selectedDestination && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Destino de Transporte Selecionado"
          data-testid="transport-destination-modal"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 14, 26, 0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1150,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#0F223D",
              border: "2px solid #38BDF8",
              borderRadius: 12,
              maxWidth: 440,
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
              color: "#E0F2FE",
              textAlign: "left",
              position: "relative",
            }}
          >
            <button
              type="button"
              aria-label="Fechar destino de transporte"
              onClick={() =>
                setTransportMode((prev) =>
                  prev
                    ? { ...prev, selectedDestination: null, travelError: null }
                    : null,
                )
              }
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "transparent",
                border: "1px solid #1E3A8A",
                borderRadius: 6,
                color: "#93C5FD",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#38BDF8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
              }}
            >
              Modo Transporte • Destino Selecionado
            </span>

            <h3
              data-testid="transport-destination-name"
              style={{
                margin: "6px 32px 4px 0",
                fontSize: 22,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.25,
              }}
            >
              {transportMode.selectedDestination.name}
            </h3>

            <div
              data-testid="transport-destination-subcategory"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                color: "#93C5FD",
                marginBottom: 14,
              }}
            >
              {transportTypeTranslated}
            </div>

            <div
              style={{
                padding: "12px 14px",
                background: "#0B192C",
                border: "1px solid #1E3A8A",
                borderRadius: 8,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: "#E0F2FE",
                marginBottom: 14,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#93C5FD" }}>Distância:</span>
                <strong data-testid="transport-destination-distance">
                  {transportMode.selectedDestination.distanceKm.toFixed(2)} km
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#93C5FD" }}>Custo da viagem:</span>
                <strong
                  data-testid="transport-destination-cost"
                  style={{ color: "#FBBF24" }}
                >
                  {transportMode.selectedDestination.costCoins}g (
                  {transportMode.selectedDestination.costCoins} moedas)
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#93C5FD" }}>Seu saldo atual:</span>
                <strong>{moedas}g</strong>
              </div>
            </div>

            {transportMode.travelError && (
              <div
                role="alert"
                data-testid="transport-travel-error"
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
                {transportMode.travelError}
              </div>
            )}

            <button
              type="button"
              data-testid="transport-confirm-go-btn"
              disabled={transportMode.isTraveling}
              onClick={handleConfirmTransportTravel}
              style={{
                width: "100%",
                padding: "12px 18px",
                background:
                  moedas >= transportMode.selectedDestination.costCoins
                    ? "#2563EB"
                    : "#1E293B",
                border:
                  moedas >= transportMode.selectedDestination.costCoins
                    ? "1px solid #60A5FA"
                    : "1px solid #475569",
                borderRadius: 6,
                color: "#FFFFFF",
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.05em",
                cursor: transportMode.isTraveling ? "wait" : "pointer",
              }}
            >
              {transportMode.isTraveling
                ? "VIAJANDO..."
                : `IR (${transportMode.selectedDestination.costCoins}g)`}
            </button>
          </div>
        </div>
      )}

      {/* Seção 5.7: Botão vermelho de sair do modo transporte (mesma posição e tamanho do botão de fechar menu) */}
      {isTransportModeActive && (
        <button
          type="button"
          data-testid="transport-exit-btn"
          aria-label="Sair do modo de transporte e voltar ao mapa normal"
          onClick={handleExitTransportMode}
          style={{
            position: "fixed",
            bottom: 22,
            left: "50%",
            transform: "translateX(-50%)",
            width: 148,
            height: 48,
            borderRadius: 8,
            background: "#DC2626",
            border: "2px solid #FCA5A5",
            color: "#FFFFFF",
            fontFamily:
              "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            zIndex: 1210,
            boxShadow: "0 10px 28px rgba(0, 0, 0, 0.7)",
          }}
        >
          ✕ SAIR
        </button>
      )}

      {/* Interface de Esgotamento (Energia = 0) ou Morte (Vida = 0) */}
      <RecoveryModal
        mode={recoveryMode}
        playerState={playerState}
        onSelectReturnDestination={handleSelectReturnDestination}
      />

      {/* Interface da Loja (Shopping, Food and Drink, Services) */}
      {activeShopPlace && (
        <PlaceShopModal
          place={activeShopPlace}
          playerState={playerState}
          onClose={() => setActiveShopPlace(null)}
        />
      )}

      {/* Sistema de Combate Existente Integrado: Emboscada, Arena e Boss */}
      {activeCombatSession && (
        <CombatScreen
          personagem={{
            id: playerState?.personagemAtual?.id || character?.id || 1,
            nome: characterName,
            vantagem: playerState?.personagemAtual?.vantagem || "Equilibrado",
            placeholderKey:
              playerState?.personagemAtual?.placeholderKey ||
              character?.placeholderKey ||
              "char_1",
            vida: vidaFinal,
            vidaAtual: Math.max(1, vidaAtual),
            energia: energiaMaxima,
            energiaAtual,
            ataque: playerState?.atributos?.danoFinal ?? 10,
            defesa: playerState?.atributos?.defesaFinal ?? 0,
            velocidade: (playerState?.atributos?.velocidadeFinal ?? 0) + 12,
          }}
          sessaoCombate={activeCombatSession}
          onFinishCombat={handleFinishCombat}
        />
      )}
    </div>
  );
}

export default function GoogleMapDemo({
  initialCoords = { lat: -25.4284, lng: -49.2733 },
  character = { id: 1, name: "Explorador #1" },
  playerState = null,
  onRegisterRouteTraversal,
  onUpdatePlayerHp,
  onDefineHome,
  onVisitPlace,
  onHospitalHeal,
  onLodgingRest,
  onHomeRest,
  onExploreNaturalFeature,
  onTrainSports,
  onTravelTransport,
  onTransportModeChange,
  onCompleteCombatPlace,
  onReturnToCheckpoint,
  onExitToMenu,
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [mapLoadError, setMapLoadError] = useState(null);

  if (!apiKey) {
    return (
      <div
        role="alert"
        style={{
          padding: 32,
          color: "#FCA5A5",
          background: "#1B241D",
          border: "1px solid #EF4444",
          borderRadius: 8,
          maxWidth: 480,
          margin: "40px auto",
          textAlign: "center",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#EDE6D3" }}>
          Google Maps não configurado
        </h3>
        <p style={{ fontSize: 14, marginBottom: 16 }}>
          A variável de ambiente <code>VITE_GOOGLE_MAPS_API_KEY</code> não foi
          encontrada no arquivo <code>.env</code> do Frontend.
        </p>
        {onExitToMenu && (
          <button
            type="button"
            onClick={onExitToMenu}
            style={{
              padding: "10px 18px",
              background: "#C89B5C",
              color: "#161D18",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Voltar ao Menu
          </button>
        )}
      </div>
    );
  }

  if (mapLoadError) {
    return (
      <div
        role="alert"
        style={{
          padding: 32,
          color: "#FCA5A5",
          background: "#1B241D",
          border: "1px solid #EF4444",
          borderRadius: 8,
          maxWidth: 480,
          margin: "40px auto",
          textAlign: "center",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#EDE6D3" }}>
          Erro ao carregar o Google Maps
        </h3>
        <p style={{ fontSize: 14, marginBottom: 16 }}>{mapLoadError}</p>
        {onExitToMenu && (
          <button
            type="button"
            onClick={onExitToMenu}
            style={{
              padding: "10px 18px",
              background: "#C89B5C",
              color: "#161D18",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Voltar ao Menu
          </button>
        )}
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={["places", "routes"]}
      onError={() =>
        setMapLoadError(
          "Falha ao carregar a API do Google Maps. Verifique sua conexão e a chave de API.",
        )
      }
    >
      <GameMapContent
        initialCoords={initialCoords}
        character={character}
        playerState={playerState}
        onRegisterRouteTraversal={onRegisterRouteTraversal}
        onUpdatePlayerHp={onUpdatePlayerHp}
        onDefineHome={onDefineHome}
        onVisitPlace={onVisitPlace}
        onHospitalHeal={handleHospitalHealFallback(onHospitalHeal)}
        onLodgingRest={onLodgingRest}
        onHomeRest={onHomeRest}
        onExploreNaturalFeature={onExploreNaturalFeature}
        onTrainSports={onTrainSports}
        onTravelTransport={onTravelTransport}
        onTransportModeChange={onTransportModeChange}
        onCompleteCombatPlace={onCompleteCombatPlace}
        onReturnToCheckpoint={onReturnToCheckpoint}
        onExitToMenu={onExitToMenu}
      />
    </APIProvider>
  );
}

function handleHospitalHealFallback(fn) {
  return fn;
}
