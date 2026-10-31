using GeoQuest.Api.DTOs;

namespace GeoQuest.Api.Integrations;

public record PlacesLookupResult(
    bool IsSuccess,
    IReadOnlyList<GamePoiDto> Places,
    string? ErrorCode = null,
    string? ErrorMessage = null
);

public interface IGooglePlacesClient
{
    Task<PlacesLookupResult> GetNearbyPlacesAsync(
        double latitude,
        double longitude,
        int radiusMeters,
        CancellationToken cancellationToken = default
    );
}

