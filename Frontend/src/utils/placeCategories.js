/**
 * Classificação centralizada de Places (Tabela A da documentação oficial do Google Places).
 * Somente as 10 categorias permitidas abaixo são aceitas no jogo.
 * Qualquer Place que não pertença a uma dessas 10 categorias é descartado (retorna null).
 */

export const ALLOWED_CATEGORIES = {
  CULTURE: "Culture",
  ENTERTAINMENT: "Entertainment and Recreation",
  FOOD_AND_DRINK: "Food and Drink",
  HEALTH_AND_WELLNESS: "Health and Wellness",
  LODGING: "Lodging",
  NATURAL_FEATURES: "Natural Features",
  SERVICES: "Services",
  SHOPPING: "Shopping",
  SPORTS: "Sports",
  TRANSPORTATION: "Transportation",
};

export const PLACE_FUNCTIONS = {
  ARENA: "arena",
  SHOP: "shop",
  BOSS: "boss",
  HOSPITAL: "hospital",
  LODGING: "lodging",
  HOME: "home",
  WIP: "wip",
};

export const SPECIAL_BOSS_SUBCATEGORY = "shopping_mall";
export const SPECIAL_HOSPITAL_SUBCATEGORY = "general_hospital";

/**
 * Ordem de prioridade centralizada e documentada para classificação quando primaryType
 * não está presente ou não pertence às 10 categorias permitidas.
 */
export const ORDERED_CATEGORY_RULES = [
  {
    category: ALLOWED_CATEGORIES.ENTERTAINMENT,
    key: "entertainment_and_recreation",
    color: "#EF4444",
    placeFunction: PLACE_FUNCTIONS.ARENA,
    interactionHint: "Este local permite enfrentar desafios de combate em uma arena.",
    actionLabel: "COMBATE",
    subcategories: [
      "adventure_sports_center", "amphitheatre", "amusement_center", "amusement_park",
      "aquarium", "banquet_hall", "barbecue_area", "botanical_garden", "bowling_alley",
      "casino", "childrens_camp", "comedy_club", "community_center", "concert_hall",
      "convention_center", "cultural_center", "cycling_park", "dance_hall", "dog_park",
      "event_venue", "ferris_wheel", "garden", "hiking_area", "historical_landmark",
      "internet_cafe", "karaoke", "marina", "movie_rental", "movie_theater",
      "national_park", "night_club", "observation_deck", "off_roading_area", "opera_house",
      "park", "philharmonic_hall", "picnic_ground", "planetarium", "plaza",
      "roller_coaster", "skateboard_park", "state_park", "tourist_attraction", "video_arcade",
      "visitor_center", "water_park", "wedding_venue", "wildlife_park", "wildlife_refuge", "zoo",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.CULTURE,
    key: "culture",
    color: "#EC4899",
    placeFunction: PLACE_FUNCTIONS.WIP,
    interactionHint: "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.",
    actionLabel: null,
    subcategories: [
      "art_gallery", "art_studio", "auditorium", "cultural_landmark", "historical_place",
      "monument", "museum", "performing_arts_theater", "sculpture",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.FOOD_AND_DRINK,
    key: "food_and_drink",
    color: "#F59E0B",
    placeFunction: PLACE_FUNCTIONS.WIP,
    interactionHint: "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.",
    actionLabel: null,
    subcategories: [
      "acai_shop", "afghani_restaurant", "african_restaurant", "american_restaurant",
      "asian_restaurant", "bagel_shop", "bakery", "bar", "bar_and_grill",
      "barbecue_restaurant", "brazilian_restaurant", "breakfast_restaurant", "brunch_restaurant",
      "buffet_restaurant", "cafe", "cafeteria", "candy_store", "cat_cafe",
      "chinese_restaurant", "chocolate_factory", "chocolate_shop", "coffee_shop", "confectionery",
      "deli", "dessert_restaurant", "dessert_shop", "diner", "dog_cafe",
      "donut_shop", "fast_food_restaurant", "fine_dining_restaurant", "food_court",
      "french_restaurant", "greek_restaurant", "hamburger_restaurant", "ice_cream_shop",
      "indian_restaurant", "indonesian_restaurant", "italian_restaurant", "japanese_restaurant",
      "juice_shop", "korean_restaurant", "lebanese_restaurant", "meal_delivery", "meal_takeaway",
      "mediterranean_restaurant", "mexican_restaurant", "middle_eastern_restaurant", "pizza_restaurant",
      "pub", "ramen_restaurant", "restaurant", "sandwich_shop", "seafood_restaurant",
      "spanish_restaurant", "steak_house", "sushi_restaurant", "tea_house", "thai_restaurant",
      "turkish_restaurant", "vegan_restaurant", "vegetarian_restaurant", "vietnamese_restaurant", "wine_bar",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.HEALTH_AND_WELLNESS,
    key: "health_and_wellness",
    color: "#10B981",
    placeFunction: PLACE_FUNCTIONS.HOSPITAL,
    interactionHint: "Este local permite recuperar sua Vida e funciona como checkpoint caso você seja derrotado.",
    actionLabel: "CURAR",
    subcategories: [
      "chiropractor", "dental_clinic", "dentist", "doctor", "drugstore",
      "general_hospital", "hospital", "massage", "medical_lab", "pharmacy", "physiotherapist",
      "sauna", "skin_care_clinic", "spa", "tanning_studio", "wellness_center", "yoga_studio",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.SHOPPING,
    key: "shopping",
    color: "#06B6D4",
    placeFunction: PLACE_FUNCTIONS.SHOP,
    interactionHint: "Explore esta loja e confira os produtos disponíveis.",
    actionLabel: "LOJA",
    subcategories: [
      "asian_grocery_store", "auto_parts_store", "bicycle_store", "book_store",
      "butcher_shop", "cell_phone_store", "clothing_store", "convenience_store",
      "department_store", "discount_store", "electronics_store", "farmers_market",
      "flea_market", "food_store", "furniture_store", "gift_shop", "grocery_store",
      "hardware_store", "home_goods_store", "home_improvement_store", "jewelry_store",
      "liquor_store", "market", "pet_store", "shoe_store", "shopping_mall",
      "sporting_goods_store", "store", "supermarket", "warehouse_store", "wholesaler",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.SPORTS,
    key: "sports",
    color: "#8B5CF6",
    placeFunction: PLACE_FUNCTIONS.WIP,
    interactionHint: "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.",
    actionLabel: null,
    subcategories: [
      "arena", "athletic_field", "fishing_charter", "fishing_pond", "fitness_center",
      "golf_course", "gym", "ice_skating_rink", "playground", "ski_resort",
      "sports_activity_location", "sports_club", "sports_coaching", "sports_complex",
      "stadium", "swimming_pool",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.NATURAL_FEATURES,
    key: "natural_features",
    color: "#22C55E",
    placeFunction: PLACE_FUNCTIONS.WIP,
    interactionHint: "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.",
    actionLabel: null,
    subcategories: [
      "beach", "island", "lake", "mountain_peak", "nature_preserve",
      "river", "scenic_spot", "woods", "natural_feature",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.LODGING,
    key: "lodging",
    color: "#EAB308",
    placeFunction: PLACE_FUNCTIONS.LODGING,
    interactionHint: "Este local permite recuperar sua Energia e funciona como checkpoint caso você fique exausto.",
    actionLabel: "DESCANSAR",
    subcategories: [
      "bed_and_breakfast", "budget_japanese_inn", "campground", "camping_cabin",
      "cottage", "extended_stay_hotel", "farmstay", "guest_house", "hostel",
      "hotel", "inn", "japanese_inn", "lodging", "mobile_home_park",
      "motel", "private_guest_room", "resort_hotel", "rv_park",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.TRANSPORTATION,
    key: "transportation",
    color: "#3B82F6",
    placeFunction: PLACE_FUNCTIONS.WIP,
    interactionHint: "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.",
    actionLabel: null,
    subcategories: [
      "airport", "airstrip", "bus_station", "bus_stop", "ferry_terminal",
      "heliport", "international_airport", "light_rail_station", "park_and_ride",
      "subway_station", "taxi_stand", "train_station", "transit_depot",
      "transit_station", "truck_stop",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.SERVICES,
    key: "services",
    color: "#A855F7",
    placeFunction: PLACE_FUNCTIONS.WIP,
    interactionHint: "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.",
    actionLabel: null,
    subcategories: [
      "astrologer", "barber_shop", "beautician", "beauty_salon", "body_art_service",
      "catering_service", "cemetery", "child_care_agency", "consultant", "courier_service",
      "electrician", "florist", "food_delivery", "foot_care", "funeral_home",
      "hair_care", "hair_salon", "insurance_agency", "laundry", "lawyer",
      "locksmith", "makeup_artist", "moving_company", "nail_salon", "painter",
      "plumber", "psychic", "real_estate_agency", "roofing_contractor", "storage",
      "summer_camp_organizer", "tailor", "telecommunications_service_provider",
      "tour_agency", "tourist_information_center", "travel_agency", "veterinary_care",
    ],
  },
];

function findRuleForSubcategory(subcategory) {
  if (!subcategory) return null;
  const normalized = subcategory.trim().toLowerCase();
  for (const rule of ORDERED_CATEGORY_RULES) {
    if (rule.subcategories.includes(normalized)) {
      return rule;
    }
  }
  return null;
}

function buildClassification(rule, subcategory) {
  if (subcategory === SPECIAL_BOSS_SUBCATEGORY) {
    return {
      key: "shopping_boss",
      category: ALLOWED_CATEGORIES.SHOPPING,
      subcategory: SPECIAL_BOSS_SUBCATEGORY,
      rawType: SPECIAL_BOSS_SUBCATEGORY,
      placeFunction: PLACE_FUNCTIONS.BOSS,
      isBossSpecial: true,
      color: "#F59E0B",
      interactionHint: "Local especial de Boss. Enfrente o Boss deste território em combate.",
      actionLabel: "BOSS",
    };
  }

  return {
    key: rule.key,
    category: rule.category,
    subcategory,
    rawType: subcategory,
    placeFunction: rule.placeFunction,
    isBossSpecial: false,
    color: rule.color,
    interactionHint: rule.interactionHint,
    actionLabel: rule.actionLabel,
  };
}

/**
 * Classifica um Place com base no primaryType e na lista de types retornada pelo Google.
 * Retorna null se o Place não pertencer a nenhuma das 10 categorias permitidas da Tabela A.
 */
export function mapPlaceCategory(rawTypes = [], primaryType = null, explicitCategory = null) {
  const normalizedPrimary =
    typeof primaryType === "string" && primaryType.trim().length > 0
      ? primaryType.trim().toLowerCase()
      : null;

  const normalizedTypes = Array.isArray(rawTypes)
    ? rawTypes
        .filter((t) => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().toLowerCase())
    : [];

  if (normalizedPrimary && !normalizedTypes.includes(normalizedPrimary)) {
    normalizedTypes.unshift(normalizedPrimary);
  }

  // 1. Verificar se o Place possui o tipo shopping_mall (prioridade máxima -> Boss)
  if (
    normalizedPrimary === SPECIAL_BOSS_SUBCATEGORY ||
    normalizedTypes.includes(SPECIAL_BOSS_SUBCATEGORY)
  ) {
    const shoppingRule = ORDERED_CATEGORY_RULES.find(
      (r) => r.category === ALLOWED_CATEGORIES.SHOPPING,
    );
    return buildClassification(shoppingRule, SPECIAL_BOSS_SUBCATEGORY);
  }

  // 2. Preservar general_hospital quando presente nos tipos de Health and Wellness (Seção 7.1)
  if (
    normalizedPrimary === SPECIAL_HOSPITAL_SUBCATEGORY ||
    normalizedTypes.includes(SPECIAL_HOSPITAL_SUBCATEGORY)
  ) {
    const healthRule = ORDERED_CATEGORY_RULES.find(
      (r) => r.category === ALLOWED_CATEGORIES.HEALTH_AND_WELLNESS,
    );
    return buildClassification(healthRule, SPECIAL_HOSPITAL_SUBCATEGORY);
  }

  // 3. Utilizar primeiro o primaryType, caso pertença a uma das 10 categorias permitidas
  if (normalizedPrimary) {
    const primaryRule = findRuleForSubcategory(normalizedPrimary);
    if (primaryRule) {
      return buildClassification(primaryRule, normalizedPrimary);
    }
  }

  // 4. Caso contrário, buscar nos types válidos seguindo a ordem de prioridade centralizada
  for (const rule of ORDERED_CATEGORY_RULES) {
    const matched = normalizedTypes.find(
      (t) => t !== "store" && rule.subcategories.includes(t),
    );
    if (matched) {
      return buildClassification(rule, matched);
    }
  }

  if (normalizedTypes.includes("store")) {
    const shoppingRule = ORDERED_CATEGORY_RULES.find(
      (r) => r.category === ALLOWED_CATEGORIES.SHOPPING,
    );
    return buildClassification(shoppingRule, "store");
  }

  // Caso já venha pré-classificado do backend em uma das 10 categorias permitidas
  if (typeof explicitCategory === "string" && explicitCategory.trim().length > 0) {
    const ruleByCategoryName = ORDERED_CATEGORY_RULES.find(
      (r) => r.category.toLowerCase() === explicitCategory.trim().toLowerCase(),
    );
    if (ruleByCategoryName) {
      const sub = normalizedTypes[0] || ruleByCategoryName.subcategories[0];
      return buildClassification(ruleByCategoryName, sub);
    }
  }

  // Se não for possível classificar em uma das 10 categorias permitidas, descarta o Place
  return null;
}

export function createHomePlace(coords) {
  if (
    !coords ||
    typeof coords.lat !== "number" ||
    typeof coords.lng !== "number" ||
    Number.isNaN(coords.lat) ||
    Number.isNaN(coords.lng)
  ) {
    return null;
  }

  return {
    id: "home",
    name: "Home",
    lat: coords.lat,
    lng: coords.lng,
    category: "Local especial",
    categoryKey: "home",
    subcategory: "home",
    rawType: "home",
    placeFunction: PLACE_FUNCTIONS.HOME,
    isBossSpecial: false,
    isHomeSpecial: true,
    color: "#10B981",
    interactionHint: "Seu ponto inicial de aventura.",
    actionLabel: "DESCANSAR GRATUITAMENTE",
    address: "Ponto inicial de aventura",
  };
}

export function normalizePlaceRecord(rawPlace, index = 0) {
  if (!rawPlace) return null;

  if (rawPlace.isHomeSpecial || rawPlace.id === "home" || rawPlace.placeFunction === PLACE_FUNCTIONS.HOME) {
    return createHomePlace({
      lat: rawPlace.lat ?? rawPlace.latitude,
      lng: rawPlace.lng ?? rawPlace.longitude,
    });
  }

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

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return null;
  }

  const name =
    typeof rawPlace.name === "string" && rawPlace.name.trim().length > 0
      ? rawPlace.name.trim()
      : typeof rawPlace.displayName === "string" && rawPlace.displayName.trim().length > 0
        ? rawPlace.displayName.trim()
        : `Local #${index + 1}`;

  const rawTypes = [];
  if (Array.isArray(rawPlace.types)) {
    rawTypes.push(...rawPlace.types);
  }
  if (typeof rawPlace.subcategory === "string" && rawPlace.subcategory.trim()) {
    rawTypes.push(rawPlace.subcategory.trim());
  }
  if (typeof rawPlace.rawType === "string" && rawPlace.rawType.trim()) {
    rawTypes.push(rawPlace.rawType.trim());
  }

  const primaryType =
    rawPlace.primaryType ||
    rawPlace.primary_type ||
    rawPlace.subcategory ||
    rawPlace.rawType ||
    null;

  const categoryInfo = mapPlaceCategory(rawTypes, primaryType, rawPlace.category);

  // Locais fora das 10 categorias permitidas da Tabela A são completamente ignorados
  if (!categoryInfo) {
    return null;
  }

  return {
    id:
      rawPlace.place_id ||
      rawPlace.id ||
      `place-${index}-${lat.toFixed(5)}-${lng.toFixed(5)}`,
    name,
    lat,
    lng,
    category: categoryInfo.category,
    categoryKey: categoryInfo.key,
    subcategory: categoryInfo.subcategory,
    rawType: categoryInfo.rawType,
    placeFunction: categoryInfo.placeFunction,
    isBossSpecial: categoryInfo.isBossSpecial,
    color: categoryInfo.color,
    interactionHint: categoryInfo.interactionHint,
    actionLabel: categoryInfo.actionLabel,
    address: rawPlace.vicinity || rawPlace.address || null,
  };
}
