using GeoQuest.Api.DTOs;

namespace GeoQuest.Api.Integrations;

public record PlacesLookupResult(
    bool IsSuccess,
    IReadOnlyList<GamePoiDto> Places,
    string? ErrorCode = null,
    string? ErrorMessage = null
);

public record TransportDestinationsLookupResult(
    bool IsSuccess,
    string TransportType,
    int RadiusMetersUsed,
    IReadOnlyList<TransportDestinationDto> Destinations,
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

    Task<TransportDestinationsLookupResult> SearchTransportDestinationsAsync(
        double latitude,
        double longitude,
        string transportType,
        string? excludePlaceId = null,
        CancellationToken cancellationToken = default
    );
}
