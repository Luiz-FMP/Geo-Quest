namespace GeoQuest.Api.Services;

public class PlaceCategoryMapper
{
    public (string Category, string RawType, string InteractionHint) MapTypes(IEnumerable<string>? types)
    {
        var typeList = types?
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim().ToLowerInvariant())
            .ToList() ?? new List<string>();

        var primaryRaw = typeList.FirstOrDefault() ?? "point_of_interest";

        if (HasAny(typeList, "hospital", "doctor", "Clinic", "pharmacy", "health", "dentist", "physiotherapist"))
        {
            return ("Hospital / Saúde", primaryRaw, "Interação futura: Cura e recuperação");
        }

        if (HasAny(typeList, "restaurant", "food", "cafe", "bakery", "meal_takeaway", "meal_delivery", "bar"))
        {
            return ("Restaurante / Alimentação", primaryRaw, "Interação futura: Alimentação e energia");
        }

        if (HasAny(typeList, "school", "university", "primary_school", "secondary_school", "library", "book_store"))
        {
            return ("Escola / Educação", primaryRaw, "Interação futura: Estudo e conhecimento");
        }

        if (HasAny(typeList, "park", "natural_feature", "campground", "zoo", "aquarium"))
        {
            return ("Parque / Natureza", primaryRaw, "Interação futura: Exploração ao ar livre");
        }

        if (HasAny(typeList, "museum", "art_gallery", "tourist_attraction", "church", "place_of_worship", "town_square", "landmark"))
        {
            return ("Cultura / Histórico", primaryRaw, "Interação futura: Missão cultural");
        }

        if (HasAny(typeList, "store", "shopping_mall", "supermarket", "convenience_store", "clothing_store"))
        {
            return ("Comércio", primaryRaw, "Interação futura: Suprimentos");
        }

        return (FormatFallbackType(primaryRaw), primaryRaw, "Interação futura: Exploração do local");
    }

    private static bool HasAny(List<string> types, params string[] candidates)
    {
        return types.Any(t => candidates.Any(c => string.Equals(t, c, StringComparison.OrdinalIgnoreCase)));
    }

    private static string FormatFallbackType(string rawType)
    {
        if (string.IsNullOrWhiteSpace(rawType) || rawType == "point_of_interest" || rawType == "establishment")
        {
            return "Ponto de Interesse";
        }

        var formatted = rawType.Replace('_', ' ');
        return char.ToUpperInvariant(formatted[0]) + formatted[1..];
    }
}

