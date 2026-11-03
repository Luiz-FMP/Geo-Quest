namespace GeoQuest.Api.Services;

public record PlaceClassificationResult(
    string Category,
    string Subcategory,
    string PlaceFunction,
    bool IsBossSpecial,
    string InteractionHint,
    string? ActionLabel
);

/// <summary>
/// Centraliza a conversão dos tipos retornados pelo Google Places (Tabela A)
/// nas 10 categorias internas permitidas pelo Geo Quest.
/// Locais que não se enquadram nas 10 categorias (ou que possuem apenas tipos da Tabela B) são descartados (retornam null).
/// </summary>
public class PlaceCategoryMapper
{
    public const string CategoryCulture = "Culture";
    public const string CategoryEntertainment = "Entertainment and Recreation";
    public const string CategoryFoodAndDrink = "Food and Drink";
    public const string CategoryHealthAndWellness = "Health and Wellness";
    public const string CategoryLodging = "Lodging";
    public const string CategoryNaturalFeatures = "Natural Features";
    public const string CategoryServices = "Services";
    public const string CategoryShopping = "Shopping";
    public const string CategorySports = "Sports";
    public const string CategoryTransportation = "Transportation";

    public const string SpecialBossSubcategory = "shopping_mall";
    public const string SpecialHospitalSubcategory = "general_hospital";

    public const string FunctionArena = "arena";
    public const string FunctionShop = "shop";
    public const string FunctionBoss = "boss";
    public const string FunctionHospital = "hospital";
    public const string FunctionLodging = "lodging";
    public const string FunctionHome = "home";
    public const string FunctionWip = "wip";

    /// <summary>
    /// Ordem de prioridade centralizada e documentada para desempate quando o primaryType
    /// não está disponível ou não pertence às 10 categorias permitidas.
    /// </summary>
    private static readonly (string Category, HashSet<string> Subcategories)[] OrderedCategoryRules =
    [
        (
            CategoryEntertainment,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "adventure_sports_center", "amphitheatre", "amusement_center", "amusement_park",
                "aquarium", "banquet_hall", "barbecue_area", "botanical_garden", "bowling_alley",
                "casino", "childrens_camp", "comedy_club", "community_center", "concert_hall",
                "convention_center", "cultural_center", "cycling_park", "dance_hall", "dog_park",
                "event_venue", "ferris_wheel", "garden", "hiking_area", "historical_landmark",
                "internet_cafe", "karaoke", "marina", "movie_rental", "movie_theater",
                "national_park", "night_club", "observation_deck", "off_roading_area", "opera_house",
                "park", "philharmonic_hall", "picnic_ground", "planetarium", "plaza",
                "roller_coaster", "skateboard_park", "state_park", "tourist_attraction", "video_arcade",
                "visitor_center", "water_park", "wedding_venue", "wildlife_park", "wildlife_refuge", "zoo"
            }
        ),
        (
            CategoryCulture,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "art_gallery", "art_studio", "auditorium", "cultural_landmark", "historical_place",
                "monument", "museum", "performing_arts_theater", "sculpture"
            }
        ),
        (
            CategoryFoodAndDrink,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
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
                "turkish_restaurant", "vegan_restaurant", "vegetarian_restaurant", "vietnamese_restaurant", "wine_bar"
            }
        ),
        (
            CategoryHealthAndWellness,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "chiropractor", "dental_clinic", "dentist", "doctor", "drugstore",
                "general_hospital", "hospital", "massage", "medical_lab", "pharmacy", "physiotherapist",
                "sauna", "skin_care_clinic", "spa", "tanning_studio", "wellness_center", "yoga_studio"
            }
        ),
        (
            CategoryShopping,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "asian_grocery_store", "auto_parts_store", "bicycle_store", "book_store",
                "butcher_shop", "cell_phone_store", "clothing_store", "convenience_store",
                "department_store", "discount_store", "electronics_store", "farmers_market",
                "flea_market", "food_store", "furniture_store", "gift_shop", "grocery_store",
                "hardware_store", "home_goods_store", "home_improvement_store", "jewelry_store",
                "liquor_store", "market", "pet_store", "shoe_store", "shopping_mall",
                "sporting_goods_store", "store", "supermarket", "warehouse_store", "wholesaler"
            }
        ),
        (
            CategorySports,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "arena", "athletic_field", "fishing_charter", "fishing_pond", "fitness_center",
                "golf_course", "gym", "ice_skating_rink", "playground", "ski_resort",
                "sports_activity_location", "sports_club", "sports_coaching", "sports_complex",
                "stadium", "swimming_pool"
            }
        ),
        (
            CategoryNaturalFeatures,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "beach", "island", "lake", "mountain_peak", "nature_preserve",
                "river", "scenic_spot", "woods", "natural_feature"
            }
        ),
        (
            CategoryLodging,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "bed_and_breakfast", "budget_japanese_inn", "campground", "camping_cabin",
                "cottage", "extended_stay_hotel", "farmstay", "guest_house", "hostel",
                "hotel", "inn", "japanese_inn", "lodging", "mobile_home_park",
                "motel", "private_guest_room", "resort_hotel", "rv_park"
            }
        ),
        (
            CategoryTransportation,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "airport", "airstrip", "bus_station", "bus_stop", "ferry_terminal",
                "heliport", "international_airport", "light_rail_station", "park_and_ride",
                "subway_station", "taxi_stand", "train_station", "transit_depot",
                "transit_station", "truck_stop"
            }
        ),
        (
            CategoryServices,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "astrologer", "barber_shop", "beautician", "beauty_salon", "body_art_service",
                "catering_service", "cemetery", "child_care_agency", "consultant", "courier_service",
                "electrician", "florist", "food_delivery", "foot_care", "funeral_home",
                "hair_care", "hair_salon", "insurance_agency", "laundry", "lawyer",
                "locksmith", "makeup_artist", "moving_company", "nail_salon", "painter",
                "plumber", "psychic", "real_estate_agency", "roofing_contractor", "storage",
                "summer_camp_organizer", "tailor", "telecommunications_service_provider",
                "tour_agency", "tourist_information_center", "travel_agency", "veterinary_care"
            }
        )
    ];

    public PlaceClassificationResult? ClassifyPlace(string? primaryType, IEnumerable<string>? types)
    {
        var normalizedPrimary = string.IsNullOrWhiteSpace(primaryType)
            ? null
            : primaryType.Trim().ToLowerInvariant();

        var normalizedTypes = types?
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim().ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();

        if (!string.IsNullOrEmpty(normalizedPrimary) &&
            !normalizedTypes.Contains(normalizedPrimary, StringComparer.OrdinalIgnoreCase))
        {
            normalizedTypes.Insert(0, normalizedPrimary);
        }

        // 1. Verificar se o Place possui o tipo shopping_mall (prioridade máxima -> Boss).
        if (string.Equals(normalizedPrimary, SpecialBossSubcategory, StringComparison.OrdinalIgnoreCase) ||
            normalizedTypes.Contains(SpecialBossSubcategory, StringComparer.OrdinalIgnoreCase))
        {
            return BuildResult(CategoryShopping, SpecialBossSubcategory);
        }

        // 2. Preservar general_hospital quando presente nos tipos de Health and Wellness (Seção 7.1).
        if (string.Equals(normalizedPrimary, SpecialHospitalSubcategory, StringComparison.OrdinalIgnoreCase) ||
            normalizedTypes.Contains(SpecialHospitalSubcategory, StringComparer.OrdinalIgnoreCase))
        {
            return BuildResult(CategoryHealthAndWellness, SpecialHospitalSubcategory);
        }

        // 3. Caso contrário, verificar primeiro o primaryType se pertencer a uma das 10 categorias permitidas.
        if (!string.IsNullOrEmpty(normalizedPrimary))
        {
            var primaryCategory = FindCategoryForSubcategory(normalizedPrimary);
            if (primaryCategory is not null)
            {
                return BuildResult(primaryCategory, normalizedPrimary);
            }
        }

        // 4. Caso não exista primaryType válido, buscar nos tipos da lista seguindo a prioridade centralizada.
        foreach (var (category, subcategories) in OrderedCategoryRules)
        {
            var matchedSubcategory = normalizedTypes.FirstOrDefault(
                t => !string.Equals(t, "store", StringComparison.OrdinalIgnoreCase) &&
                     subcategories.Contains(t));

            if (matchedSubcategory is not null)
            {
                return BuildResult(category, matchedSubcategory);
            }
        }

        if (normalizedTypes.Contains("store", StringComparer.OrdinalIgnoreCase))
        {
            return BuildResult(CategoryShopping, "store");
        }

        // 5. Se não for possível classificar o Place em uma das 10 categorias permitidas, descarta-o.
        return null;
    }

    private static string? FindCategoryForSubcategory(string subcategory)
    {
        foreach (var (category, subcategories) in OrderedCategoryRules)
        {
            if (subcategories.Contains(subcategory))
            {
                return category;
            }
        }

        return null;
    }

    private static PlaceClassificationResult BuildResult(string category, string subcategory)
    {
        if (string.Equals(subcategory, SpecialBossSubcategory, StringComparison.OrdinalIgnoreCase))
        {
            return new PlaceClassificationResult(
                Category: CategoryShopping,
                Subcategory: SpecialBossSubcategory,
                PlaceFunction: FunctionBoss,
                IsBossSpecial: true,
                InteractionHint: "Local especial de Boss. Enfrente o Boss deste território em combate.",
                ActionLabel: "BOSS"
            );
        }

        if (string.Equals(category, CategoryEntertainment, StringComparison.OrdinalIgnoreCase))
        {
            return new PlaceClassificationResult(
                Category: CategoryEntertainment,
                Subcategory: subcategory,
                PlaceFunction: FunctionArena,
                IsBossSpecial: false,
                InteractionHint: "Este local permite enfrentar desafios de combate em uma arena.",
                ActionLabel: "COMBATE"
            );
        }

        if (string.Equals(category, CategoryShopping, StringComparison.OrdinalIgnoreCase))
        {
            return new PlaceClassificationResult(
                Category: CategoryShopping,
                Subcategory: subcategory,
                PlaceFunction: FunctionShop,
                IsBossSpecial: false,
                InteractionHint: "Explore esta loja e confira os produtos disponíveis.",
                ActionLabel: "LOJA"
            );
        }

        if (string.Equals(category, CategoryHealthAndWellness, StringComparison.OrdinalIgnoreCase))
        {
            return new PlaceClassificationResult(
                Category: CategoryHealthAndWellness,
                Subcategory: subcategory,
                PlaceFunction: FunctionHospital,
                IsBossSpecial: false,
                InteractionHint: "Este local permite recuperar sua Vida e funciona como checkpoint caso você seja derrotado.",
                ActionLabel: "CURAR"
            );
        }

        if (string.Equals(category, CategoryLodging, StringComparison.OrdinalIgnoreCase))
        {
            return new PlaceClassificationResult(
                Category: CategoryLodging,
                Subcategory: subcategory,
                PlaceFunction: FunctionLodging,
                IsBossSpecial: false,
                InteractionHint: "Este local permite recuperar sua Energia e funciona como checkpoint caso você fique exausto.",
                ActionLabel: "DESCANSAR"
            );
        }

        return new PlaceClassificationResult(
            Category: category,
            Subcategory: subcategory,
            PlaceFunction: FunctionWip,
            IsBossSpecial: false,
            InteractionHint: "WIP — A funcionalidade desta categoria ainda está em desenvolvimento.",
            ActionLabel: null
        );
    }
}
