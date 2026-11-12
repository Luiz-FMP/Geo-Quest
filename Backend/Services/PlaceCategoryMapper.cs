namespace GeoQuest.Api.Services;

public sealed record PlaceCategoryClassification(
    string Category,
    string Subcategory,
    string Color,
    bool IsBossSpecial
);

public static class PlaceCategoryMapper
{
    public const string Shopping = "Shopping";
    public const string FoodAndDrink = "Food and Drink";
    public const string Services = "Services";
    public const string HealthAndWellness = "Health and Wellness";
    public const string Lodging = "Lodging";
    public const string EntertainmentAndRecreation = "Entertainment and Recreation";
    public const string Culture = "Culture";
    public const string NaturalFeatures = "Natural Features";
    public const string Sports = "Sports";
    public const string Transportation = "Transportation";

    public const string BossSubcategory = "shopping_mall";

    private static readonly Dictionary<string, string> CategoryColors = new(StringComparer.Ordinal)
    {
        [Shopping] = "#EC4899",
        [FoodAndDrink] = "#F97316",
        [Services] = "#6366F1",
        [HealthAndWellness] = "#10B981",
        [Lodging] = "#EAB308",
        [EntertainmentAndRecreation] = "#A855F7",
        [Culture] = "#06B6D4",
        [NaturalFeatures] = "#22C55E",
        [Sports] = "#EF4444",
        [Transportation] = "#3B82F6"
    };

    private static readonly (string Category, string[] Types)[] CategoryDefinitions =
    [
        (HealthAndWellness, ["hospital"]),
        (NaturalFeatures, ["beach", "island", "K", "mountain_peak", "nature_preserve", "river", "scenic_spot", "woods", "natural_feature"]),
        (Lodging, ["bed_and_breakfast", "budget_japanese_inn", "campground", "camping_cabin", "cottage", "extended_stay_hotel", "farmstay", "guest_house", "hostel", "hotel", "inn", "japanese_inn", "lodging", "mobile_home_park", "motel", "private_guest_room", "resort_hotel", "rv_park"]),
        (Transportation, ["airport", "airstrip", "bus_station", "bus_stop", "ferry_service", "ferry_terminal", "heliport", "international_airport", "light_rail_station", "park_and_ride", "public_transit_station", "rest_stop", "subway_station", "taxi_service", "taxi_stand", "toll_station", "train_station", "train_ticket_office", "K_depot", "transit_station", "transit_stop", "truck_stop", "valet_parking", "weigh_station"]),
        (Culture, ["art_gallery", "art_museum", "art_studio", "auditorium", "castle", "cultural_landmark", "fountain", "historical_place", "history_museum", "monument", "museum", "performing_arts_theater", "sculpture", "stage"]),
        (EntertainmentAndRecreation, ["adventure_sports_center", "amphitheatre", "amusement_center", "amusement_park", "aquarium", "banquet_hall", "barbecue_area", "botanical_garden", "bowling_alley", "casino", "childrens_camp", "city_park", "comedy_club", "community_center", "concert_hall", "convention_center", "cultural_center", "cycling_park", "dance_hall", "dog_park", "event_venue", "ferris_wheel", "garden", "go_karting_venue", "hiking_area", "historical_landmark", "indoor_playground", "internet_cafe", "karaoke", "live_music_venue", "marina", "miniature_golf_course", "movie_rental", "movie_theater", "national_park", "night_club", "observation_deck", "off_roading_area", "opera_house", "paintball_center", "park", "philharmonic_hall", "picnic_ground", "planetarium", "plaza", "roller_coaster", "skateboard_park", "state_park", "tourist_attraction", "video_arcade", "visitor_center", "water_park", "wedding_venue", "wildlife_park", "wildlife_refuge", "zoo"]),
        (Sports, ["arena", "athletic_field", "fishing_charter", "fishing_pier", "fishing_pond", "fitness_center", "golf_course", "gym", "ice_skating_rink", "indoor_golf_course", "playground", "race_course", "ski_resort", "sports_activity_location", "sports_club", "sports_coaching", "sports_complex", "sports_school", "stadium", "swimming_pool", "tennis_court"]),
        (FoodAndDrink, ["acai_shop", "afghani_restaurant", "african_restaurant", "american_restaurant", "argentinian_restaurant", "asian_fusion_restaurant", "asian_restaurant", "australian_restaurant", "austrian_restaurant", "bagel_shop", "bakery", "bangladeshi_restaurant", "bar", "bar_and_grill", "barbecue_restaurant", "basque_restaurant", "bavarian_restaurant", "beer_garden", "belgian_restaurant", "bistro", "brazilian_restaurant", "breakfast_restaurant", "brewery", "brewpub", "british_restaurant", "brunch_restaurant", "buffet_restaurant", "burmese_restaurant", "burrito_restaurant", "cafe", "cafeteria", "cajun_restaurant", "cake_shop", "californian_restaurant", "cambodian_restaurant", "candy_store", "cantonese_restaurant", "caribbean_restaurant", "cat_cafe", "chicken_restaurant", "chicken_wings_restaurant", "chilean_restaurant", "chinese_noodle_restaurant", "chinese_restaurant", "chocolate_factory", "chocolate_shop", "cocktail_bar", "coffee_roastery", "coffee_shop", "coffee_stand", "colombian_restaurant", "confectionery", "croatian_restaurant", "cuban_restaurant", "cupcake_shop", "cyprus_restaurant", "czech_restaurant", "danish_restaurant", "deli", "dessert_restaurant", "dessert_shop", "dim_sum_restaurant", "diner", "dog_cafe", "donut_shop", "dumpling_restaurant", "dutch_restaurant", "eastern_european_restaurant", "ecuadorian_restaurant", "egyptian_restaurant", "empanada_restaurant", "english_restaurant", "ethiopian_restaurant", "european_restaurant", "falafel_restaurant", "family_restaurant", "fancy_restaurant", "fast_food_restaurant", "filipino_restaurant", "fine_dining_restaurant", "fish_and_chips_restaurant", "fondue_restaurant", "food_court", "french_restaurant", "fusion_restaurant", "gastropub", "georgian_restaurant", "german_restaurant", "greek_restaurant", "gyro_restaurant", "halal_restaurant", "hamburger_restaurant", "hawaiian_restaurant", "hookah_bar", "hot_dog_restaurant", "hot_dog_stand", "hot_pot_restaurant", "hungarian_restaurant", "ice_cream_shop", "indian_restaurant", "indonesian_restaurant", "irish_pub", "irish_restaurant", "israeli_restaurant", "italian_restaurant", "japanese_curry_restaurant", "japanese_izakaya_restaurant", "japanese_restaurant", "juice_shop", "kebab_restaurant", "korean_barbecue_restaurant", "korean_restaurant", "kosher_restaurant", "latin_american_restaurant", "lebanese_restaurant", "lounge_bar", "malaysian_restaurant", "meat_dish_restaurant", "mediterranean_restaurant", "mexican_restaurant", "middle_eastern_restaurant", "mongolian_barbecue_restaurant", "moroccan_restaurant", "neapolitan_pizza_restaurant", "nepalese_restaurant", "noodle_shop", "north_indian_restaurant", "oyster_bar_restaurant", "pakistani_restaurant", "pastry_shop", "persian_restaurant", "peruvian_restaurant", "pie_shop", "pizza_delivery", "pizza_restaurant", "polish_restaurant", " polynesian_restaurant", "polynesian_restaurant", "fondant_cake_shop", "popcorn_store", "portuguese_restaurant", "pub", "ramen_restaurant", "restaurant", "romanian_restaurant", "russian_restaurant", "salad_shop", "salvadoran_restaurant", "sandwich_shop", "scandinavian_restaurant", "seafood_restaurant", "shawarma_restaurant", "snack_bar", "soul_food_restaurant", "soup_restaurant", "south_american_restaurant", "south_indian_restaurant", "southwestern_us_restaurant", "spanish_restaurant", "sports_bar", "sri_lankan_restaurant", "steak_house", "sushi_restaurant", "swiss_restaurant", "syrian_restaurant", "taco_restaurant", "taiwanese_restaurant", "tapas_restaurant", "tea_house", "tex_mex_restaurant", "thai_restaurant", "tibetan_restaurant", "tonkatsu_restaurant", "traditional_us_restaurant", "turkish_restaurant", "ukrainian_restaurant", "uzbek_restaurant", "vegan_restaurant", "vegetarian_restaurant", "venezuelan_restaurant", "vietnamese_restaurant", "western_restaurant", "wine_bar", "winery", "wings_joint", "wok_restaurant", "yakitori_restaurant", "yakiniku_restaurant"]),
        (Shopping, ["asian_grocery_store", "auto_parts_store", "bicycle_store", "book_store", "butcher_shop", "cell_phone_store", "clothing_store", "convenience_store", "cosmetics_store", "department_store", "discount_store", "Discount_supermarket", "discount_supermarket", "electronics_store", "farmers_market", "flea_market", "food_store", "furniture_store", "garden_center", "general_store", "gift_shop", "grocery_store", "hardware_store", "health_food_store", "home_goods_store", "home_improvement_store", "hypermarket", "jewelry_store", "liquor_store", "market", "mens_clothing_store", "pet_store", "shoe_store", "shopping_mall", " sporting_goods_store", "sporting_goods_store", "sportswear_store", "store", "supermarket", "tea_store", "thrift_store", "toy_store", "warehouse_store", "wholesale_grocer", "womens_clothing_store"]),
        (Services, ["astrologer", "barber_shop", "beautician", "beauty_salon", "body_art_service", "catering_service", "cemetery", "chauffeur_service", "child_care_agency", "consultant", "courier_service", "craniosacral_therapy", "custom_tailor", "delivery_service", "electrician", "employment_agency", "florist", "food_delivery", "foot_care", "funeral_home", "hair_care", "hair_salon", "house_cleaning_service", "insurance_agency", "laundry", "lawyer", "locksmith", "makeup_artist", "moving_company", "nail_salon", "non_profit_organization", "painter", "pet_boarding_service", "pet_care", "plumber", " psychic", "psychic", "real_estate_agency", "roofing_contractor", "janitorial_service", "shipping_service", "storage", "summer_camp_organizer", "tailor", "tattoo_and_piercing_shop", "telecommunications_service_provider", "tour_agency", "tourist_information_center", "translation_service", "travel_agency", "veterinary_care"])
    ];

    private static readonly Dictionary<string, string> SubcategoryToCategoryMap = BuildSubcategoryMap();

    public static readonly IReadOnlyList<string> NearbySearchTypes =
    [
        "shopping_mall", "supermarket", "book_store", "clothing_store", "electronics_store", "department_store",
        "restaurant", "cafe", "bakery", "bar", "fast_food_restaurant", "ice_cream_shop", "coffee_shop",
        "barber_shop", "beauty_salon", "laundry", "veterinary_care", "florist",
        "hospital",
        "hotel", "hostel", "inn", "motel", "resort_hotel",
        "park", "city_park", "plaza", "movie_theater", "tourist_attraction", "botanical_garden",
        "museum", "art_gallery", "cultural_landmark", "historical_place", "monument",
        "beach", "scenic_spot", "woods", "nature_preserve", "natural_feature",
        "gym", "fitness_center", "stadium", "sports_complex", "swimming_pool",
        "bus_station", "subway_station", "train_station", "transit_station", "airport", "ferry_terminal", "bus_stop"
    ];

    private static Dictionary<string, string> BuildSubcategoryMap()
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (category, types) in CategoryDefinitions)
        {
            foreach (var rawType in types)
            {
                var trimmed = rawType.Trim();
                if (!string.IsNullOrEmpty(trimmed) && !map.ContainsKey(trimmed))
                {
                    map[trimmed] = category;
                }
            }
        }
        return map;
    }

    public static PlaceCategoryClassification? ClassifyPlace(string? primaryType, IEnumerable<string>? types)
    {
        var allCandidates = new List<string>();

        if (!string.IsNullOrWhiteSpace(primaryType))
            allCandidates.Add(primaryType.Trim());

        if (types != null)
        {
            foreach (var t in types)
            {
                if (!string.IsNullOrWhiteSpace(t))
                {
                    var trimmed = t.Trim();
                    if (!allCandidates.Contains(trimmed, StringComparer.OrdinalIgnoreCase))
                        allCandidates.Add(trimmed);
                }
            }
        }

        if (allCandidates.Contains(BossSubcategory, StringComparer.OrdinalIgnoreCase))
        {
            return new PlaceCategoryClassification(Shopping, BossSubcategory, CategoryColors[Shopping], true);
        }

        if (!string.IsNullOrWhiteSpace(primaryType) &&
            SubcategoryToCategoryMap.TryGetValue(primaryType.Trim(), out var primaryCategory))
        {
            var sub = primaryType.Trim();
            return new PlaceCategoryClassification(
                primaryCategory,
                sub,
                CategoryColors[primaryCategory],
                string.Equals(sub, BossSubcategory, StringComparison.OrdinalIgnoreCase)
            );
        }

        foreach (var (category, allowedTypes) in CategoryDefinitions)
        {
            var matchedSub = allCandidates.FirstOrDefault(c =>
                allowedTypes.Any(a => string.Equals(a.Trim(), c, StringComparison.OrdinalIgnoreCase)));

            if (matchedSub != null)
            {
                return new PlaceCategoryClassification(
                    category,
                    matchedSub,
                    CategoryColors[category],
                    string.Equals(matchedSub, BossSubcategory, StringComparison.OrdinalIgnoreCase)
                );
            }
        }

        return null;
    }

    public static bool IsTransportationSubcategory(string? subcategory)
    {
        if (string.IsNullOrWhiteSpace(subcategory))
            return false;
        return SubcategoryToCategoryMap.TryGetValue(subcategory.Trim(), out var category)
            && string.Equals(category, Transportation, StringComparison.Ordinal);
    }
}
