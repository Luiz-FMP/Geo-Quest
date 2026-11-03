using System.Globalization;
using System.Text.Json;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Services;

namespace GeoQuest.Api.Integrations;

public class GooglePlacesClient : IGooglePlacesClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly PlaceCategoryMapper _categoryMapper;
    private readonly ILogger<GooglePlacesClient> _logger;

    public GooglePlacesClient(
        HttpClient httpClient,
        IConfiguration configuration,
        PlaceCategoryMapper categoryMapper,
        ILogger<GooglePlacesClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _categoryMapper = categoryMapper;
        _logger = logger;
    }

    public async Task<PlacesLookupResult> GetNearbyPlacesAsync(
        double latitude,
        double longitude,
        int radiusMeters,
        CancellationToken cancellationToken = default)
    {
        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return new PlacesLookupResult(
                false,
                Array.Empty<GamePoiDto>(),
                "MISSING_API_KEY",
                "Chave da Google Places API não configurada no servidor."
            );
        }

        var latStr = latitude.ToString(CultureInfo.InvariantCulture);
        var lngStr = longitude.ToString(CultureInfo.InvariantCulture);
        var url = $"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={latStr},{lngStr}&radius={radiusMeters}&language=pt-BR&key={Uri.EscapeDataString(apiKey)}";

        try
        {
            using var response = await _httpClient.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Google Places API returned HTTP {StatusCode}", (int)response.StatusCode);
                return new PlacesLookupResult(
                    false,
                    Array.Empty<GamePoiDto>(),
                    "UPSTREAM_HTTP_ERROR",
                    "Falha ao consultar o serviço Google Places."
                );
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = doc.RootElement;

            var status = root.TryGetProperty("status", out var statusProp)
                ? statusProp.GetString()
                : "UNKNOWN_ERROR";

            if (status == "ZERO_RESULTS")
            {
                return new PlacesLookupResult(true, Array.Empty<GamePoiDto>());
            }

            if (status != "OK")
            {
                _logger.LogWarning("Google Places API returned status {Status}", status);
                return new PlacesLookupResult(
                    false,
                    Array.Empty<GamePoiDto>(),
                    status ?? "PLACES_ERROR",
                    $"A Google Places API retornou o status: {status}."
                );
            }

            var places = new List<GamePoiDto>();
            if (root.TryGetProperty("results", out var resultsProp) && resultsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in resultsProp.EnumerateArray())
                {
                    var parsed = ParsePlaceItem(item);
                    if (parsed is not null)
                    {
                        places.Add(parsed);
                    }
                }
            }

            return new PlacesLookupResult(true, places);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new PlacesLookupResult(
                false,
                Array.Empty<GamePoiDto>(),
                "TIMEOUT",
                "Tempo limite esgotado ao buscar pontos de interesse."
            );
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Network error while calling Google Places API.");
            return new PlacesLookupResult(
                false,
                Array.Empty<GamePoiDto>(),
                "NETWORK_ERROR",
                "Erro de rede ao consultar pontos de interesse."
            );
        }
    }

    private GamePoiDto? ParsePlaceItem(JsonElement item)
    {
        if (!item.TryGetProperty("geometry", out var geometry) ||
            !geometry.TryGetProperty("location", out var location))
        {
            return null;
        }

        if (!location.TryGetProperty("lat", out var latEl) ||
            !location.TryGetProperty("lng", out var lngEl) ||
            !latEl.TryGetDouble(out var lat) ||
            !lngEl.TryGetDouble(out var lng))
        {
            return null;
        }

        var id = item.TryGetProperty("place_id", out var idEl) && !string.IsNullOrWhiteSpace(idEl.GetString())
            ? idEl.GetString()!
            : $"{lat.ToString(CultureInfo.InvariantCulture)},{lng.ToString(CultureInfo.InvariantCulture)}";

        var name = item.TryGetProperty("name", out var nameEl) && !string.IsNullOrWhiteSpace(nameEl.GetString())
            ? nameEl.GetString()!
            : "Local sem nome";

        var rawTypes = new List<string>();
        if (item.TryGetProperty("types", out var typesEl) && typesEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var t in typesEl.EnumerateArray())
            {
                var str = t.GetString();
                if (!string.IsNullOrWhiteSpace(str))
                {
                    rawTypes.Add(str);
                }
            }
        }

        string? primaryType = null;
        if (item.TryGetProperty("primaryType", out var primaryTypeEl) && primaryTypeEl.ValueKind == JsonValueKind.String)
        {
            primaryType = primaryTypeEl.GetString();
        }
        else if (item.TryGetProperty("primary_type", out var primaryTypeSnakeEl) && primaryTypeSnakeEl.ValueKind == JsonValueKind.String)
        {
            primaryType = primaryTypeSnakeEl.GetString();
        }

        var classification = _categoryMapper.ClassifyPlace(primaryType, rawTypes);
        if (classification is null)
        {
            return null;
        }

        var address = item.TryGetProperty("vicinity", out var vicinityEl) ? vicinityEl.GetString() : null;

        return new GamePoiDto(
            id,
            name,
            lat,
            lng,
            classification.Category,
            classification.Subcategory,
            classification.Subcategory,
            classification.PlaceFunction,
            classification.IsBossSpecial,
            classification.InteractionHint,
            classification.ActionLabel,
            address,
            rawTypes
        );
    }

    private string? ResolveApiKey()
    {
        var configured = _configuration["GoogleMaps:ApiKey"]
            ?? Environment.GetEnvironmentVariable("GOOGLE_MAPS_API_KEY")
            ?? Environment.GetEnvironmentVariable("VITE_GOOGLE_MAPS_API_KEY");

        return string.IsNullOrWhiteSpace(configured) ? null : configured.Trim();
    }
}

