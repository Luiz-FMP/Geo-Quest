const CATEGORY_RULES = [
  {
    key: "hospital",
    label: "Hospital",
    color: "#EF4444",
    interactionHint: "Interação futura: sistema de cura e recuperação de vida.",
    types: [
      "hospital",
      "doctor",
      "pharmacy",
      "health",
      "dentist",
      "clinic",
      "physiotherapist",
      "medical_lab",
    ],
  },
  {
    key: "restaurante",
    label: "Restaurante",
    color: "#F59E0B",
    interactionHint: "Interação futura: alimentação e recuperação de energia.",
    types: [
      "restaurant",
      "food",
      "cafe",
      "bakery",
      "meal_takeaway",
      "meal_delivery",
      "bar",
    ],
  },
  {
    key: "escola",
    label: "Escola",
    color: "#8B5CF6",
    interactionHint: "Interação futura: estudo, missões de conhecimento e atributos.",
    types: [
      "school",
      "university",
      "primary_school",
      "secondary_school",
      "library",
      "book_store",
    ],
  },
  {
    key: "parque",
    label: "Parque",
    color: "#10B981",
    interactionHint: "Interação futura: exploração ao ar livre e eventos da cidade.",
    types: ["park", "natural_feature", "campground", "zoo", "aquarium"],
  },
  {
    key: "cultura",
    label: "Local Cultural",
    color: "#EC4899",
    interactionHint: "Interação futura: missão histórica ou cultural.",
    types: [
      "museum",
      "art_gallery",
      "tourist_attraction",
      "church",
      "place_of_worship",
      "town_square",
      "landmark",
    ],
  },
  {
    key: "comercio",
    label: "Comércio",
    color: "#06B6D4",
    interactionHint: "Interação futura: obtenção de itens e suprimentos.",
    types: [
      "store",
      "shopping_mall",
      "supermarket",
      "convenience_store",
      "clothing_store",
      "department_store",
    ],
  },
];

export function mapPlaceCategory(rawTypes = [], explicitCategory = null) {
  const normalizedTypes = Array.isArray(rawTypes)
    ? rawTypes
        .filter((t) => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().toLowerCase())
    : [];

  for (const rule of CATEGORY_RULES) {
    if (normalizedTypes.some((t) => rule.types.includes(t))) {
      return {
        key: rule.key,
        label: rule.label,
        color: rule.color,
        interactionHint: rule.interactionHint,
        rawType: normalizedTypes[0] || rule.key,
      };
    }
  }

  if (explicitCategory && typeof explicitCategory === "string" && explicitCategory.trim()) {
    return {
      key: "outro",
      label: explicitCategory.trim(),
      color: "#C89B5C",
      interactionHint: "Interação futura: missão vinculada a este ponto de interesse.",
      rawType: normalizedTypes[0] || "point_of_interest",
    };
  }

  const firstSpecific = normalizedTypes.find(
    (t) => t !== "point_of_interest" && t !== "establishment",
  );

  if (firstSpecific) {
    const formatted = firstSpecific.replace(/_/g, " ");
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    return {
      key: "outro",
      label: capitalized,
      color: "#C89B5C",
      interactionHint: "Interação futura: missão vinculada a este ponto de interesse.",
      rawType: firstSpecific,
    };
  }

  return {
    key: "ponto_interesse",
    label: "Ponto de Interesse",
    color: "#C89B5C",
    interactionHint: "Interação futura: exploração deste local.",
    rawType: normalizedTypes[0] || "point_of_interest",
  };
}

export function normalizePlaceRecord(rawPlace, index = 0) {
  if (!rawPlace) return null;

  let lat = null;
  let lng = null;

  if (typeof rawPlace.latitude === "number" && typeof rawPlace.longitude === "number") {
    lat = rawPlace.latitude;
    lng = rawPlace.longitude;
  } else if (typeof rawPlace.lat === "number" && typeof rawPlace.lng === "number") {
    lat = rawPlace.lat;
    lng = rawPlace.lng;
  } else if (rawPlace.geometry?.location) {
    const loc = rawPlace.geometry.location;
    lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
    lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
  }

  if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const name =
    typeof rawPlace.name === "string" && rawPlace.name.trim().length > 0
      ? rawPlace.name.trim()
      : typeof rawPlace.displayName === "string" && rawPlace.displayName.trim().length > 0
        ? rawPlace.displayName.trim()
        : `Local #${index + 1}`;

  const types = Array.isArray(rawPlace.types)
    ? rawPlace.types
    : rawPlace.rawType
      ? [rawPlace.rawType]
      : [];

  const categoryInfo = mapPlaceCategory(types, rawPlace.category);

  return {
    id: rawPlace.place_id || rawPlace.id || `place-${index}-${lat.toFixed(5)}-${lng.toFixed(5)}`,
    name,
    lat,
    lng,
    category: categoryInfo.label,
    categoryKey: categoryInfo.key,
    color: categoryInfo.color,
    interactionHint: rawPlace.interactionHint || categoryInfo.interactionHint,
    address: rawPlace.vicinity || rawPlace.address || null,
  };
}

