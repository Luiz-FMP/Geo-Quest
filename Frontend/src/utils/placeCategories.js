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
  EXPLORATION: "exploration",
  TRANSPORT: "transport",
  CULTURE: "culture",
  SPORTS: "sports",
  WIP: "wip",
};

export const SPECIAL_BOSS_SUBCATEGORY = "shopping_mall";
export const SPECIAL_HOSPITAL_SUBCATEGORY = "general_hospital";

export const SPECIFIC_NATURAL_SUBCATEGORIES = [
  "beach",
  "island",
  "lake",
  "mountain_peak",
  "nature_preserve",
  "river",
  "scenic_spot",
  "woods",
];

export const ORDERED_TRANSPORTATION_SUBCATEGORIES = [
  "international_airport",
  "airport",
  "airstrip",
  "heliport",
  "ferry_terminal",
  "ferry_service",
  "train_station",
  "subway_station",
  "light_rail_station",
  "tram_stop",
  "bus_station",
  "bus_stop",
  "transit_depot",
  "transit_station",
  "transit_stop",
  "park_and_ride",
  "taxi_stand",
  "taxi_service",
  "train_ticket_office",
  "bike_sharing_station",
  "truck_stop",
  "toll_station",
  "bridge",
  "transportation_service",
];

export const ALLOWED_TRANSPORTATION_SUBCATEGORIES = new Set(
  ORDERED_TRANSPORTATION_SUBCATEGORIES,
);

export function isAllowedTransportationSubcategory(subcategory) {
  if (typeof subcategory !== "string") return false;
  return ALLOWED_TRANSPORTATION_SUBCATEGORIES.has(subcategory.trim().toLowerCase());
}

export function resolveTransportationSubcategory(
  primaryType = null,
  types = [],
  fallbackSubcategory = null,
) {
  const normPrimary =
    typeof primaryType === "string" ? primaryType.trim().toLowerCase() : "";
  if (normPrimary && ALLOWED_TRANSPORTATION_SUBCATEGORIES.has(normPrimary)) {
    return normPrimary;
  }

  const normTypes = Array.isArray(types)
    ? types
        .filter((t) => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().toLowerCase())
    : [];

  for (const sub of ORDERED_TRANSPORTATION_SUBCATEGORIES) {
    if (normTypes.includes(sub)) {
      return sub;
    }
  }

  const normFallback =
    typeof fallbackSubcategory === "string"
      ? fallbackSubcategory.trim().toLowerCase()
      : "";
  if (normFallback && ALLOWED_TRANSPORTATION_SUBCATEGORIES.has(normFallback)) {
    return normFallback;
  }

  return null;
}

export const NATURAL_FEATURE_SUBCATEGORY_NAMES = {
  beach: "Praia",
  island: "Ilha",
  lake: "Lago",
  mountain_peak: "Pico de montanha",
  nature_preserve: "Reserva natural",
  river: "Rio",
  scenic_spot: "Mirante",
  woods: "Bosque",
};

export const NATURAL_FEATURE_FLAVOR_TEXTS = {
  beach:
    "A brisa do mar percorre a faixa de areia úmida, onde as ondas costumam deixar vestígios trazidos pela maré.",
  island:
    "Cercado por água em todas as direções, este refúgio isolado guarda recantos silenciosos prontos para serem explorados.",
  lake:
    "As águas tranquilas espelham o céu, enquanto as margens silenciosas parecem esconder segredos entre as pedras e juncos.",
  mountain_peak:
    "O vento frio da altitude acompanha uma visão ampla da paisagem, revelando fendas rochosas pouco visitadas.",
  nature_preserve:
    "A vegetação preservada protege trilhas naturais e clareiras discretas onde a natureza permanece quase intocada.",
  river:
    "A correnteza constante desliza sobre o leito de pedras, carregando pequenos objetos ao longo das margens.",
  scenic_spot:
    "Um ponto privilegiado de observação da paisagem, cercado por caminhos e arredores que convidam a uma busca atenta.",
  woods:
    "As árvores fechadas filtram a luz do sol sobre caminhos naturais cobertos de folhas, raízes e esconderijos.",
};

export const SUBCATEGORY_TRANSLATIONS = {
  ...NATURAL_FEATURE_SUBCATEGORY_NAMES,
  natural_feature: "Bosque",

  airport: "Aeroporto",
  airstrip: "Pista de pouso",
  bike_sharing_station: "Estação de bicicletas",
  bridge: "Ponte",
  bus_station: "Estação de ônibus",
  bus_stop: "Ponto de ônibus",
  ferry_service: "Serviço de balsa",
  ferry_terminal: "Terminal de balsas",
  heliport: "Heliporto",
  international_airport: "Aeroporto internacional",
  light_rail_station: "Estação de VLT",
  park_and_ride: "Estacionamento integrado",
  subway_station: "Estação de metrô",
  taxi_service: "Serviço de táxi",
  taxi_stand: "Ponto de táxi",
  toll_station: "Praça de pedágio",
  train_station: "Estação de trem",
  train_ticket_office: "Bilheteria ferroviária",
  tram_stop: "Parada de bonde",
  transit_depot: "Garagem de transporte",
  transit_station: "Estação de transporte",
  transit_stop: "Parada de transporte",
  transportation_service: "Serviço de transporte",
  truck_stop: "Parada de caminhões",

  art_gallery: "Galeria de arte",
  art_studio: "Estúdio de arte",
  auditorium: "Auditório",
  cultural_landmark: "Marco cultural",
  historical_place: "Local histórico",
  monument: "Monumento",
  museum: "Museu",
  performing_arts_theater: "Teatro",
  sculpture: "Escultura",

  arena: "Arena esportiva",
  athletic_field: "Campo esportivo",
  fishing_charter: "Pesca esportiva",
  fishing_pond: "Lago de pesca",
  fitness_center: "Centro de condicionamento",
  golf_course: "Campo de golfe",
  gym: "Academia",
  ice_skating_rink: "Pista de patinação",
  playground: "Área de recreação esportiva",
  ski_resort: "Estação de esqui",
  sports_activity_location: "Centro de atividades esportivas",
  sports_club: "Clube esportivo",
  sports_coaching: "Centro de treinamento",
  sports_complex: "Complexo esportivo",
  stadium: "Estádio",
  swimming_pool: "Piscina esportiva",

  astrologer: "Astrólogo",
  barber_shop: "Barbearia",
  beautician: "Estética",
  beauty_salon: "Salão de beleza",
  body_art_service: "Estúdio de arte corporal",
  catering_service: "Serviço de buffet",
  cemetery: "Memorial",
  child_care_agency: "Centro de cuidados",
  consultant: "Consultoria",
  courier_service: "Serviço de entregas",
  electrician: "Serviço elétrico",
  florist: "Floricultura",
  food_delivery: "Serviço de entrega",
  foot_care: "Podologia",
  funeral_home: "Serviço funerário",
  hair_care: "Cuidados capilares",
  hair_salon: "Salão de cabeleireiro",
  insurance_agency: "Seguradora",
  laundry: "Lavanderia",
  lawyer: "Escritório jurídico",
  locksmith: "Chaveiro",
  makeup_artist: "Estúdio de maquiagem",
  moving_company: "Transportadora",
  nail_salon: "Salão de manicure",
  painter: "Oficina de pintura",
  plumber: "Serviço hidráulico",
  psychic: "Oráculo",
  real_estate_agency: "Imobiliária",
  roofing_contractor: "Oficina de manutenção",
  storage: "Depósito",
  summer_camp_organizer: "Organizador de expedições",
  tailor: "Alfaiataria",
  telecommunications_service_provider: "Central de telecomunicações",
  tour_agency: "Agência de turismo",
  tourist_information_center: "Centro de informações",
  travel_agency: "Agência de viagens",
  veterinary_care: "Clínica veterinária",

  shopping_mall: "Shopping Center",
  store: "Loja de equipamentos",
  clothing_store: "Loja de vestuário",
  shoe_store: "Loja de calçados",
  sporting_goods_store: "Loja de artigos esportivos",
  electronics_store: "Loja de eletrônicos",
  hardware_store: "Loja de ferramentas",
  jewelry_store: "Joalheria",
  book_store: "Livraria",
  bicycle_store: "Loja de bicicletas",
  department_store: "Loja de departamentos",
  gift_shop: "Loja de presentes",
  home_goods_store: "Loja de utilidades",
  home_improvement_store: "Loja de construção",
  market: "Mercado",
  supermarket: "Supermercado",
  grocery_store: "Mercearia",
  convenience_store: "Loja de conveniência",
  pet_store: "Pet shop",
  auto_parts_store: "Loja de autopeças",
  furniture_store: "Loja de móveis",
  discount_store: "Loja de variedades",
  warehouse_store: "Atacado",
  wholesaler: "Distribuidora",

  restaurant: "Restaurante",
  cafe: "Cafeteria",
  coffee_shop: "Cafeteria",
  bakery: "Padaria",
  bar: "Bar",
  pub: "Pub",
  fast_food_restaurant: "Lanchonete rápida",
  hamburger_restaurant: "Hamburgueria",
  pizza_restaurant: "Pizzaria",
  ice_cream_shop: "Sorveteria",
  juice_shop: "Casa de sucos",
  acai_shop: "Loja de açaí",
  snack_bar: "Lanchonete",
  sandwich_shop: "Sanduicheria",
  dessert_shop: "Confeitaria",
  confectionery: "Doceria",
  candy_store: "Loja de doces",
  chocolate_shop: "Chocolateria",
  tea_house: "Casa de chá",
  steak_house: "Churrascaria",
  barbecue_restaurant: "Churrascaria",
  brazilian_restaurant: "Restaurante brasileiro",
  italian_restaurant: "Restaurante italiano",
  japanese_restaurant: "Restaurante japonês",
  sushi_restaurant: "Restaurante de sushi",

  general_hospital: "Hospital geral",
  hospital: "Hospital",
  pharmacy: "Farmácia",
  drugstore: "Drogaria",
  hotel: "Hotel",
  inn: "Pousada",
  hostel: "Hostel",
  lodging: "Hospedagem",
  park: "Parque",
  plaza: "Praça",
  tourist_attraction: "Atração turística",
  home: "Ponto inicial",
};

const CATEGORY_FALLBACK_SUBCATEGORY_LABELS = {
  [ALLOWED_CATEGORIES.NATURAL_FEATURES]: "Bosque",
  [ALLOWED_CATEGORIES.TRANSPORTATION]: "Terminal de transporte",
  [ALLOWED_CATEGORIES.CULTURE]: "Espaço cultural",
  [ALLOWED_CATEGORIES.SPORTS]: "Centro esportivo",
  [ALLOWED_CATEGORIES.SERVICES]: "Estabelecimento de serviços",
  [ALLOWED_CATEGORIES.SHOPPING]: "Loja de equipamentos",
  [ALLOWED_CATEGORIES.FOOD_AND_DRINK]: "Loja de consumíveis",
  [ALLOWED_CATEGORIES.HEALTH_AND_WELLNESS]: "Centro de saúde",
  [ALLOWED_CATEGORIES.LODGING]: "Hospedagem",
  [ALLOWED_CATEGORIES.ENTERTAINMENT]: "Arena",
};

export function getTranslatedSubcategory(subcategory, category = null) {
  const key = typeof subcategory === "string" ? subcategory.trim().toLowerCase() : "";
  if (key && SUBCATEGORY_TRANSLATIONS[key]) {
    return SUBCATEGORY_TRANSLATIONS[key];
  }
  if (category && CATEGORY_FALLBACK_SUBCATEGORY_LABELS[category]) {
    return CATEGORY_FALLBACK_SUBCATEGORY_LABELS[category];
  }
  return "Local";
}

export function getNaturalFeatureFlavorText(subcategory) {
  const key = typeof subcategory === "string" ? subcategory.trim().toLowerCase() : "";
  return (
    NATURAL_FEATURE_FLAVOR_TEXTS[key] ||
    NATURAL_FEATURE_FLAVOR_TEXTS.woods
  );
}

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
    placeFunction: PLACE_FUNCTIONS.CULTURE,
    interactionHint: "Espaço cultural que concede um aprimoramento aleatório gratuito ao visitante.",
    actionLabel: "RECEBER BUFF",
    subcategories: [
      "art_gallery", "art_studio", "auditorium", "cultural_landmark", "historical_place",
      "monument", "museum", "performing_arts_theater", "sculpture",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.FOOD_AND_DRINK,
    key: "food_and_drink",
    color: "#EAB308",
    placeFunction: PLACE_FUNCTIONS.SHOP,
    interactionHint: "Loja de consumíveis. Confira os espaços de produtos e seu inventário de consumíveis.",
    actionLabel: "LOJA",
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
    color: "#4ADE80",
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
    color: "#F97316",
    placeFunction: PLACE_FUNCTIONS.SHOP,
    interactionHint: "Loja de equipamentos. Confira os espaços de produtos e seu inventário de equipamentos.",
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
    color: "#A855F7",
    placeFunction: PLACE_FUNCTIONS.SPORTS,
    interactionHint: "Local esportivo que permite escolher uma melhoria permanente de atributo.",
    actionLabel: "TREINAR",
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
    color: "#15803D",
    placeFunction: PLACE_FUNCTIONS.EXPLORATION,
    interactionHint: "Vasculhe o local em busca de descobertas deixadas pela natureza.",
    actionLabel: "VASCULHAR LOCAL",
    subcategories: [
      "beach", "island", "lake", "mountain_peak", "nature_preserve",
      "river", "scenic_spot", "woods", "natural_feature",
    ],
  },
  {
    category: ALLOWED_CATEGORIES.LODGING,
    key: "lodging",
    color: "#92400E",
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
    placeFunction: PLACE_FUNCTIONS.TRANSPORT,
    interactionHint: "Ponto de transporte que conecta terminais do mesmo tipo na região.",
    actionLabel: "VER LOCALIZAÇÕES PRÓXIMAS",
    subcategories: ORDERED_TRANSPORTATION_SUBCATEGORIES,
  },
  {
    category: ALLOWED_CATEGORIES.SERVICES,
    key: "services",
    color: "#94A3B8",
    placeFunction: PLACE_FUNCTIONS.SHOP,
    interactionHint: "Estabelecimento de serviços que oferece um aprimoramento temporário por 50g.",
    actionLabel: "COMPRAR BUFF (50g)",
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

function resolveSpecificSubcategory(rule, candidateSubcategory, normalizedTypes = []) {
  if (!rule) return candidateSubcategory;

  if (rule.category === ALLOWED_CATEGORIES.NATURAL_FEATURES) {
    if (!candidateSubcategory || candidateSubcategory === "natural_feature") {
      const specific = SPECIFIC_NATURAL_SUBCATEGORIES.find((s) =>
        normalizedTypes.includes(s),
      );
      return specific || "woods";
    }
    return candidateSubcategory;
  }

  if (rule.category === ALLOWED_CATEGORIES.TRANSPORTATION) {
    if (
      candidateSubcategory &&
      ALLOWED_TRANSPORTATION_SUBCATEGORIES.has(candidateSubcategory)
    ) {
      return candidateSubcategory;
    }
    const matched = ORDERED_TRANSPORTATION_SUBCATEGORIES.find((s) =>
      normalizedTypes.includes(s),
    );
    return matched || "bus_station";
  }

  return candidateSubcategory;
}

function buildClassification(rule, subcategory, normalizedTypes = []) {
  const resolvedSub = resolveSpecificSubcategory(rule, subcategory, normalizedTypes);

  if (resolvedSub === SPECIAL_BOSS_SUBCATEGORY) {
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

  const interactionHint =
    rule.category === ALLOWED_CATEGORIES.NATURAL_FEATURES
      ? getNaturalFeatureFlavorText(resolvedSub)
      : rule.interactionHint;

  return {
    key: rule.key,
    category: rule.category,
    subcategory: resolvedSub,
    rawType: resolvedSub,
    placeFunction: rule.placeFunction,
    isBossSpecial: false,
    color: rule.color,
    interactionHint,
    actionLabel: rule.actionLabel,
  };
}

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

  if (
    normalizedPrimary === SPECIAL_BOSS_SUBCATEGORY ||
    normalizedTypes.includes(SPECIAL_BOSS_SUBCATEGORY)
  ) {
    const shoppingRule = ORDERED_CATEGORY_RULES.find(
      (r) => r.category === ALLOWED_CATEGORIES.SHOPPING,
    );
    return buildClassification(shoppingRule, SPECIAL_BOSS_SUBCATEGORY, normalizedTypes);
  }

  if (
    normalizedPrimary === SPECIAL_HOSPITAL_SUBCATEGORY ||
    normalizedTypes.includes(SPECIAL_HOSPITAL_SUBCATEGORY)
  ) {
    const healthRule = ORDERED_CATEGORY_RULES.find(
      (r) => r.category === ALLOWED_CATEGORIES.HEALTH_AND_WELLNESS,
    );
    return buildClassification(healthRule, SPECIAL_HOSPITAL_SUBCATEGORY, normalizedTypes);
  }

  if (normalizedPrimary) {
    const primaryRule = findRuleForSubcategory(normalizedPrimary);
    if (primaryRule) {
      return buildClassification(primaryRule, normalizedPrimary, normalizedTypes);
    }
  }

  for (const rule of ORDERED_CATEGORY_RULES) {
    const matched =
      rule.category === ALLOWED_CATEGORIES.TRANSPORTATION
        ? ORDERED_TRANSPORTATION_SUBCATEGORIES.find((s) =>
            normalizedTypes.includes(s),
          )
        : normalizedTypes.find(
            (t) =>
              t !== "store" &&
              t !== "natural_feature" &&
              rule.subcategories.includes(t),
          );
    if (matched) {
      return buildClassification(rule, matched, normalizedTypes);
    }
  }

  if (normalizedTypes.includes("natural_feature")) {
    const naturalRule = ORDERED_CATEGORY_RULES.find(
      (r) => r.category === ALLOWED_CATEGORIES.NATURAL_FEATURES,
    );
    return buildClassification(naturalRule, "natural_feature", normalizedTypes);
  }

  if (normalizedTypes.includes("store")) {
    const shoppingRule = ORDERED_CATEGORY_RULES.find(
      (r) => r.category === ALLOWED_CATEGORIES.SHOPPING,
    );
    return buildClassification(shoppingRule, "store", normalizedTypes);
  }

  if (typeof explicitCategory === "string" && explicitCategory.trim().length > 0) {
    const ruleByCategoryName = ORDERED_CATEGORY_RULES.find(
      (r) => r.category.toLowerCase() === explicitCategory.trim().toLowerCase(),
    );
    if (ruleByCategoryName) {
      const sub = normalizedTypes[0] || ruleByCategoryName.subcategories[0];
      return buildClassification(ruleByCategoryName, sub, normalizedTypes);
    }
  }

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
    subcategoryLabel: "Ponto inicial",
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
        : typeof rawPlace.displayName?.text === "string" && rawPlace.displayName.text.trim().length > 0
          ? rawPlace.displayName.text.trim()
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
    subcategoryLabel: getTranslatedSubcategory(
      categoryInfo.subcategory,
      categoryInfo.category,
    ),
    rawType: categoryInfo.rawType,
    primaryType: primaryType ? String(primaryType).trim().toLowerCase() : categoryInfo.subcategory,
    types: rawTypes,
    placeFunction: categoryInfo.placeFunction,
    isBossSpecial: categoryInfo.isBossSpecial,
    color: categoryInfo.color,
    interactionHint: categoryInfo.interactionHint,
    actionLabel: categoryInfo.actionLabel,
    address: rawPlace.vicinity || rawPlace.address || rawPlace.formattedAddress || null,
  };
}
