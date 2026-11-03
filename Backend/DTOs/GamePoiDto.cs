namespace GeoQuest.Api.DTOs;

public record GamePoiDto(
    string Id,
    string Name,
    double Latitude,
    double Longitude,
    string Category,
    string Subcategory,
    string RawType,
    string PlaceFunction,
    bool IsBossSpecial,
    string InteractionHint,
    string? ActionLabel,
    string? Address,
    IReadOnlyList<string>? Types = null
);

public record CharacterSlotDto(
    int Id,
    string Name,
    bool IsAvailable,
    string StatusLabel
);


