import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { getCharacterPlaceholder } from "../config/placeholderAssets";
import { normalizePlaceRecord } from "../utils/placeCategories";
import PlaceArrivalModal from "./PlaceArrivalModal";

const PLACES_CACHE_STORAGE_KEY = "geoquest_places_spatial_cache_v1";
const MIN_DISTANCE_FOR_NEW_PLACES_FETCH_KM = 0.22; // 220 metros: evita chamadas redundantes à API para locais muito próximos
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

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

function createCharacterSquareDataUrl(fillColor = "#2563EB", strokeColor = "#DBEAFE") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect x="3" y="3" width="26" height="26" fill="${fillColor}" stroke="${strokeColor}" stroke-width="3" rx="2" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createPlaceIconDataUrl(color = "#C89B5C", isSelected = false) {
  const stroke = isSelected ? "#FFFFFF" : "#161D18";
  const size = isSelected ? 30 : 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">
    <rect x="4" y="4" width="20" height="20" fill="${color}" stroke="${stroke}" stroke-width="2.5" rx="3" />
    <circle cx="14" cy="14" r="3.5" fill="#161D18" />
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
      sinLng * sinLng;
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
    if (!p || !p.id || seen.has(p.id)) continue;
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
  onExitToMenu,
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
  const [lastRouteSummary, setLastRouteSummary] = useState(null);

  const polylineRef = useRef(null);
  const animationTimerRef = useRef(null);
  const spatialCacheRef = useRef(loadSpatialCacheFromSession());
  const allDiscoveredPlacesRef = useRef([]);
  const inFlightCenterRef = useRef(null);

  const charVisual = getCharacterPlaceholder(
    character?.placeholderKey || character?.id || 1,
  );

  const characterSquareIcon = useMemo(
    () => createCharacterSquareDataUrl(charVisual.color, charVisual.borderColor),
    [charVisual.color, charVisual.borderColor],
  );

  const stopMovementAnimation = useCallback(() => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
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

  const registerDiscoveredPlaces = useCallback((centerCoords, normalizedPlaces) => {
    if (!Array.isArray(normalizedPlaces) || normalizedPlaces.length === 0) return;

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
  }, []);

  const fetchNearbyPlaces = useCallback(
    async (targetCoords = initialCoords, options = { forceRefresh: false }) => {
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

      // Evita requisição duplicada concorrente para o mesmo centro
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
                "Nenhum ponto de interesse encontrado próximo a este local.",
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

  const drawRouteAndAnimate = useCallback(
    async (pathCoords, destinationPlace, originCoord, explicitDistanceKm = null) => {
      if (!map) return;

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

      // Calcula a distância da rota em km a partir da Directions API ou geometria da rota
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

      // Consome a energia imediatamente através do backend (ou fallback sincronizado) ao iniciar o deslocamento
      if (onRegisterRouteTraversal) {
        const result = await onRegisterRouteTraversal(
          routeDistanceKm,
          destinationPlace,
        );
        if (result) {
          setLastRouteSummary({
            distanciaKm: result.distanciaKm ?? routeDistanceKm,
            energiaConsumida: result.energiaConsumida ?? 0,
          });
        }
      }

      const steps = interpolateRoutePoints(pathCoords, 90);
      if (steps.length === 0) {
        const finalCoord = {
          lat: destinationPlace.lat,
          lng: destinationPlace.lng,
        };
        setPlayerCoords(finalCoord);
        setArrivedPlace(destinationPlace);
        map.panTo(finalCoord);
        fetchNearbyPlaces(finalCoord);
        return;
      }

      setIsMoving(true);
      let currentStep = 0;

      animationTimerRef.current = setInterval(() => {
        currentStep += 1;
        if (currentStep >= steps.length) {
          clearInterval(animationTimerRef.current);
          animationTimerRef.current = null;
          const finalCoord = {
            lat: destinationPlace.lat,
            lng: destinationPlace.lng,
          };
          setPlayerCoords(finalCoord);
          setIsMoving(false);
          setArrivedPlace(destinationPlace);
          // Centraliza o mapa no novo local e atualiza os pontos de interesse ao redor (com proteção de cache espacial)
          map.panTo(finalCoord);
          fetchNearbyPlaces(finalCoord);
          return;
        }

        setPlayerCoords(steps[currentStep]);
      }, 35);
    },
    [
      map,
      clearRoutePolyline,
      stopMovementAnimation,
      onRegisterRouteTraversal,
      fetchNearbyPlaces,
    ],
  );

  const handleSelectPlace = useCallback(
    async (place) => {
      if (!place || !routesLib || !map) return;

      stopMovementAnimation();
      setArrivedPlace(null);
      setSelectedPlace(place);
      setRouteError(null);
      setIsCalculatingRoute(true);

      const origin = { lat: playerCoords.lat, lng: playerCoords.lng };
      const destination = { lat: place.lat, lng: place.lng };

      // 1. Tenta rota via Backend usando a chave dedicada da Directions API
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
            drawRouteAndAnimate(pathCoords, place, origin, data.distanceKm);
            return;
          }
        }
      } catch {
        // Backend não disponível; prossegue para tentativa direta com a chave Directions/Routes
      }

      // 2. Tenta Google Routes API v2 direto do navegador com VITE_GOOGLE_DIRECTIONS_API_KEY
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
              drawRouteAndAnimate(decoded, place, origin, distKm);
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
            drawRouteAndAnimate(pathCoords, place, origin, distKm);
            return;
          }

          // Fallback to DRIVING if walking route is unavailable
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
                drawRouteAndAnimate(pathCoords, place, origin, distKm);
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

              // Traçado direto de contingência para garantir a continuidade da jogabilidade
              drawRouteAndAnimate([origin, destination], place, origin);
            },
          );
        },
      );
    },
    [routesLib, map, playerCoords, stopMovementAnimation, drawRouteAndAnimate],
  );

  const playerName = playerState?.nome || "Explorador";
  const characterName =
    playerState?.personagemAtual?.nome || character?.name || "Explorador #1";
  const vidaAtual = playerState?.atributos?.vidaAtual ?? 50;
  const vidaFinal = playerState?.atributos?.vidaFinal ?? 50;
  const energiaAtual = playerState?.atributos?.energiaAtual ?? 100;
  const energiaMaxima = playerState?.atributos?.energiaMaximaFinal ?? 100;
  const nivelDePoder = playerState?.atributos?.nivelDePoder ?? 10;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#161D18",
      }}
    >
      {/* Top HUD Bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 20px",
          background: "#131915",
          borderBottom: "1px solid #2E3B30",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 24,
              height: 24,
              background: charVisual.color,
              border: `2px solid ${charVisual.borderColor}`,
              borderRadius: 3,
            }}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE6D3" }}>
              {playerName} •{" "}
              <span style={{ color: "#C89B5C" }}>{characterName}</span>
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#8A9A8C",
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span>
                Vida:{" "}
                <strong style={{ color: "#EDE6D3" }}>
                  {vidaAtual}/{vidaFinal}
                </strong>
              </span>
              <span>
                Energia:{" "}
                <strong style={{ color: "#38BDF8" }}>
                  {Number(energiaAtual).toFixed(2)}/{energiaMaxima}
                </strong>
                {lastRouteSummary && (
                  <span style={{ color: "#F87171", marginLeft: 4 }}>
                    (-{Number(lastRouteSummary.energiaConsumida).toFixed(2)})
                  </span>
                )}
              </span>
              <span>
                Poder: <strong style={{ color: "#C89B5C" }}>{nivelDePoder}</strong>
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: isMoving ? "#38BDF8" : "#C89B5C",
          }}
        >
          {isCalculatingRoute
            ? `Calculando rota para ${selectedPlace?.name}...`
            : isMoving
              ? `Em movimento até: ${selectedPlace?.name}...`
              : selectedPlace
                ? `Local atual: ${selectedPlace.name}`
                : "Selecione um ponto de interesse no mapa"}
        </div>

        <button
          type="button"
          onClick={onExitToMenu}
          style={{
            padding: "8px 14px",
            background: "transparent",
            border: "1px solid #2E3B30",
            borderRadius: 6,
            color: "#EDE6D3",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Menu Inicial
        </button>
      </header>

      {/* Error Banners */}
      {(placesError || routeError) && (
        <div
          role="alert"
          style={{
            background: "#3B1818",
            borderBottom: "1px solid #EF4444",
            color: "#FCA5A5",
            padding: "10px 20px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            zIndex: 10,
          }}
        >
          <span>{routeError || placesError}</span>
          {placesError && (
            <button
              type="button"
              onClick={() => fetchNearbyPlaces(playerCoords, { forceRefresh: true })}
              style={{
                padding: "5px 10px",
                background: "#EF4444",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {/* Map + Side Panel Container */}
      <div
        style={{
          position: "relative",
          flex: 1,
          width: "100%",
          display: "flex",
        }}
      >
        <div style={{ flex: 1, height: "100%", position: "relative" }}>
          <Map
            defaultCenter={initialCoords}
            defaultZoom={16}
            gestureHandling="greedy"
            disableDefaultUI={false}
            streetViewControl={false}
            mapTypeControl={false}
            styles={GAME_MAP_STYLES}
            style={{ width: "100%", height: "100%" }}
          >
            {/* Player Character Marker */}
            <Marker
              position={playerCoords}
              title={`${characterName} (Sua posição)`}
              icon={characterSquareIcon}
              zIndex={1000}
            />

            {/* Nearby Places Markers */}
            {places.map((place) => {
              const isSelected = selectedPlace?.id === place.id;
              return (
                <Marker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  title={`${place.name} (${place.category})`}
                  icon={createPlaceIconDataUrl(place.color, isSelected)}
                  zIndex={isSelected ? 500 : 100}
                  onClick={() => handleSelectPlace(place)}
                />
              );
            })}
          </Map>
        </div>

        {/* Places Sidebar / Overlay List */}
        <aside
          style={{
            width: 310,
            maxWidth: "42vw",
            height: "100%",
            background: "#131915",
            borderLeft: "1px solid #2E3B30",
            display: "flex",
            flexDirection: "column",
            zIndex: 5,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #2E3B30",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                color: "#C89B5C",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Locais Próximos ({places.length})
            </span>

            {isLoadingPlaces && (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "#8A9A8C",
                }}
              >
                Atualizando...
              </span>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {!isLoadingPlaces && places.length === 0 && !placesError && (
              <div
                style={{
                  padding: 16,
                  fontSize: 13,
                  color: "#7C8C7E",
                  textAlign: "center",
                }}
              >
                Nenhum ponto de interesse carregado.
              </div>
            )}

            {places.map((place) => {
              const isSelected = selectedPlace?.id === place.id;
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    width: "100%",
                    padding: "10px 12px",
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
                      width: 14,
                      height: 14,
                      marginTop: 3,
                      borderRadius: 3,
                      background: place.color || "#C89B5C",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#EDE6D3",
                        marginBottom: 3,
                        wordBreak: "break-word",
                      }}
                    >
                      {place.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11,
                        color: "#8A9A8C",
                      }}
                    >
                      Tipo: {place.category}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Arrival Modal */}
      <PlaceArrivalModal
        place={arrivedPlace}
        routeSummary={lastRouteSummary}
        onClose={() => setArrivedPlace(null)}
      />
    </div>
  );
}

export default function GoogleMapDemo({
  initialCoords = { lat: -25.4284, lng: -49.2733 },
  character = { id: 1, name: "Explorador #1" },
  playerState = null,
  onRegisterRouteTraversal,
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
        onExitToMenu={onExitToMenu}
      />
    </APIProvider>
  );
}
