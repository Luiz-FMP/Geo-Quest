using GeoQuest.Api.DTOs;

namespace GeoQuest.Api.Integrations;

public interface IGooglePlacesClient
{
    Task<IReadOnlyList<GamePoiDto>> SearchNearbyGamePoisAsync(
        double latitude,
        double longitude,
        double radiusMeters = 1200,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<GamePoiDto> Places, double RadiusUsedMeters)> SearchTransportationDestinationsAsync(
        double latitude,
        double longitude,
        string transportSubcategory,
        string? excludePlaceId = null,
        CancellationToken cancellationToken = default);
}
