namespace GeoQuest.Api.DTOs;

public record GamePoiDto(
    string Id,
    string Name,
    double Latitude,
    double Longitude,
    string Category,
    string RawType,
    string InteractionHint,
    string? Address
);

public record CharacterSlotDto(
    int Id,
    string Name,
    bool IsAvailable,
    string StatusLabel
);

