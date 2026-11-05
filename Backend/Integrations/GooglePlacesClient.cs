using System.Globalization;
using System.Text;
using System.Text.Json;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Services;

namespace GeoQuest.Api.Integrations;

public class GooglePlacesClient : IGooglePlacesClient
{
    private static readonly int[] ProgressiveTransportRadiiMeters = [5000, 15000, 30000, 50000];
    public const int AdequateTransportDestinationsCount = 5;
    public const int MaxTransportDestinations = 10;
    public const int MaxPlacesNewQueryCount = 20;
    public const int MaxAllowedRadiusMeters = 50000;

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

    /// <summary>
    /// Busca progressiva híbrida de destinos de transporte do mesmo tipo (airport ou bus_station)
    /// utilizando a Google Places API Nearby Search (New):
    /// 1. Inicia com o raio padrão (1200m) e amplia progressivamente até o limite máximo de 50.000m (50 km).
    /// 2. Filtra exclusivamente pelo tipo atual (airport ou bus_station).
    /// 3. Ordena por distância (rankPreference = DISTANCE) e solicita até 20 resultados por consulta.
    /// 4. Remove o próprio Place de origem e duplicados por ID.
    /// 5. Encerra assim que atingir 10 destinos válidos ou chegar a 50 km, retornando até os 10 mais próximos.
    /// </summary>
    public async Task<TransportDestinationsLookupResult> SearchTransportDestinationsAsync(
        double latitude,
        double longitude,
        string transportType,
        string? excludePlaceId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedType = (transportType ?? string.Empty).Trim().ToLowerInvariant();
        if (!PlaceCategoryMapper.IsAllowedTransportationSubcategory(normalizedType))
        {
            return new TransportDestinationsLookupResult(
                false,
                normalizedType,
                0,
                Array.Empty<TransportDestinationDto>(),
                "INVALID_TRANSPORT_TYPE",
                $"Subcategoria de transporte inválida ('{normalizedType}'). Utilize uma das 24 subcategorias oficiais de Transportation."
            );
        }

        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return new TransportDestinationsLookupResult(
                false,
                normalizedType,
                0,
                Array.Empty<TransportDestinationDto>(),
                "MISSING_API_KEY",
                "Chave da Google Places API não configurada no servidor."
            );
        }

        var collectedById = new Dictionary<string, TransportDestinationDto>(StringComparer.OrdinalIgnoreCase);
        int lastRadiusUsed = ProgressiveTransportRadiiMeters[0];
        string? lastErrorCode = null;
        string? lastErrorMessage = null;
        bool anySuccessfulResponse = false;

        foreach (var rawRadius in ProgressiveTransportRadiiMeters)
        {
            int radiusMeters = Math.Clamp(rawRadius, 100, MaxAllowedRadiusMeters);
            lastRadiusUsed = radiusMeters;

            var stepResult = await QueryNearbyTransportPlacesNewAsync(
                latitude,
                longitude,
                radiusMeters,
                normalizedType,
                apiKey,
                cancellationToken);

            if (!stepResult.Success)
            {
                // Fallback compatível para a API legada caso a chave não tenha Places API (New) habilitada
                stepResult = await QueryNearbyTransportPlacesLegacyAsync(
                    latitude,
                    longitude,
                    radiusMeters,
                    normalizedType,
                    apiKey,
                    cancellationToken);
            }

            if (stepResult.Success)
            {
                anySuccessfulResponse = true;
                foreach (var candidate in stepResult.Candidates)
                {
                    if (IsSameOriginPlace(candidate.Id, candidate.Latitude, candidate.Longitude, excludePlaceId, latitude, longitude))
                    {
                        continue;
                    }

                    if (!MatchesTransportType(candidate.Subcategory, candidate.Types, normalizedType))
                    {
                        continue;
                    }

                    double distKm = Math.Round(
                        CalculateHaversineKm(latitude, longitude, candidate.Latitude, candidate.Longitude),
                        3);

                    if (distKm <= 0.015)
                    {
                        continue;
                    }

                    int costCoins = CalculateTransportCostCoins(distKm);

                    collectedById[candidate.Id] = new TransportDestinationDto(
                        Id: candidate.Id,
                        Name: candidate.Name,
                        Latitude: candidate.Latitude,
                        Longitude: candidate.Longitude,
                        Category: PlaceCategoryMapper.CategoryTransportation,
                        Subcategory: normalizedType,
                        DistanceKm: distKm,
                        TravelCostCoins: costCoins,
                        Address: candidate.Address
                    );
                }

                if (collectedById.Count >= AdequateTransportDestinationsCount)
                {
                    break;
                }
            }
            else
            {
                lastErrorCode = stepResult.ErrorCode;
                lastErrorMessage = stepResult.ErrorMessage;
            }
        }

        if (!anySuccessfulResponse && collectedById.Count == 0)
        {
            return new TransportDestinationsLookupResult(
                false,
                normalizedType,
                lastRadiusUsed,
                Array.Empty<TransportDestinationDto>(),
                lastErrorCode ?? "PLACES_ERROR",
                lastErrorMessage ?? "Não foi possível consultar destinos de transporte."
            );
        }

        var ordered = collectedById.Values
            .OrderBy(d => d.DistanceKm)
            .Take(MaxTransportDestinations)
            .ToList();

        return new TransportDestinationsLookupResult(
            true,
            normalizedType,
            lastRadiusUsed,
            ordered
        );
    }

    public static int CalculateTransportCostCoins(double distanceKm)
    {
        if (distanceKm <= 0 || double.IsNaN(distanceKm) || double.IsInfinity(distanceKm))
        {
            return 0;
        }

        // Regra 5.5: distancia_km * 10 convertido em moedas (g), sem modificador de velocidade.
        // Convenção de arredondamento documentada: Math.Round(valor, MidpointRounding.AwayFromZero), mínimo de 1g para viagens > 0 km.
        return Math.Max(1, (int)Math.Round(distanceKm * 10.0, MidpointRounding.AwayFromZero));
    }

    public static double CalculateHaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        double dLat = (lat2 - lat1) * Math.PI / 180.0;
        double dLon = (lon2 - lon1) * Math.PI / 180.0;
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private async Task<(bool Success, List<GamePoiDto> Candidates, string? ErrorCode, string? ErrorMessage)>
        QueryNearbyTransportPlacesNewAsync(
            double latitude,
            double longitude,
            int radiusMeters,
            string transportType,
            string apiKey,
            CancellationToken cancellationToken)
    {
        const string url = "https://places.googleapis.com/v1/places:searchNearby";
        var payload = new
        {
            includedTypes = new[] { transportType },
            maxResultCount = MaxPlacesNewQueryCount,
            rankPreference = "DISTANCE",
            languageCode = "pt-BR",
            locationRestriction = new
            {
                circle = new
                {
                    center = new
                    {
                        latitude,
                        longitude
                    },
                    radius = (double)Math.Clamp(radiusMeters, 100, MaxAllowedRadiusMeters)
                }
            }
        };

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.TryAddWithoutValidation("X-Goog-Api-Key", apiKey);
            request.Headers.TryAddWithoutValidation(
                "X-Goog-FieldMask",
                "places.id,places.displayName,places.location,places.primaryType,places.types,places.formattedAddress"
            );

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return (false, new List<GamePoiDto>(), $"HTTP_{(int)response.StatusCode}", "Places API (New) indisponível.");
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = doc.RootElement;

            var list = new List<GamePoiDto>();
            if (root.TryGetProperty("places", out var placesEl) && placesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in placesEl.EnumerateArray())
                {
                    var parsed = ParsePlaceNewItem(item, transportType);
                    if (parsed is not null)
                    {
                        list.Add(parsed);
                    }
                }
            }

            return (true, list, null, null);
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            _logger.LogDebug(ex, "Places API (New) fallback acionado.");
            return (false, new List<GamePoiDto>(), "PLACES_NEW_ERROR", ex.Message);
        }
    }

    private async Task<(bool Success, List<GamePoiDto> Candidates, string? ErrorCode, string? ErrorMessage)>
        QueryNearbyTransportPlacesLegacyAsync(
            double latitude,
            double longitude,
            int radiusMeters,
            string transportType,
            string apiKey,
            CancellationToken cancellationToken)
    {
        var latStr = latitude.ToString(CultureInfo.InvariantCulture);
        var lngStr = longitude.ToString(CultureInfo.InvariantCulture);
        var clampedRadius = Math.Clamp(radiusMeters, 100, MaxAllowedRadiusMeters);
        var url = $"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={latStr},{lngStr}&radius={clampedRadius}&type={Uri.EscapeDataString(transportType)}&language=pt-BR&key={Uri.EscapeDataString(apiKey)}";

        try
        {
            using var response = await _httpClient.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return (false, new List<GamePoiDto>(), "UPSTREAM_HTTP_ERROR", "Falha ao consultar Google Places.");
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = doc.RootElement;

            var status = root.TryGetProperty("status", out var statusProp)
                ? statusProp.GetString()
                : "UNKNOWN_ERROR";

            if (status == "ZERO_RESULTS")
            {
                return (true, new List<GamePoiDto>(), null, null);
            }

            if (status != "OK")
            {
                return (false, new List<GamePoiDto>(), status, $"Google Places retornou status: {status}");
            }

            var list = new List<GamePoiDto>();
            if (root.TryGetProperty("results", out var resultsProp) && resultsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in resultsProp.EnumerateArray())
                {
                    var parsed = ParsePlaceItem(item);
                    if (parsed is not null)
                    {
                        list.Add(parsed);
                    }
                }
            }

            return (true, list, null, null);
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            return (false, new List<GamePoiDto>(), "NETWORK_ERROR", ex.Message);
        }
    }

    private GamePoiDto? ParsePlaceNewItem(JsonElement item, string expectedTransportType)
    {
        if (!item.TryGetProperty("location", out var location) ||
            !location.TryGetProperty("latitude", out var latEl) ||
            !location.TryGetProperty("longitude", out var lngEl) ||
            !latEl.TryGetDouble(out var lat) ||
            !lngEl.TryGetDouble(out var lng))
        {
            return null;
        }

        var id = item.TryGetProperty("id", out var idEl) && !string.IsNullOrWhiteSpace(idEl.GetString())
            ? idEl.GetString()!
            : $"{lat.ToString(CultureInfo.InvariantCulture)},{lng.ToString(CultureInfo.InvariantCulture)}";

        string name = "Terminal de Transporte";
        if (item.TryGetProperty("displayName", out var displayNameEl))
        {
            if (displayNameEl.ValueKind == JsonValueKind.Object &&
                displayNameEl.TryGetProperty("text", out var textEl) &&
                !string.IsNullOrWhiteSpace(textEl.GetString()))
            {
                name = textEl.GetString()!;
            }
            else if (displayNameEl.ValueKind == JsonValueKind.String &&
                     !string.IsNullOrWhiteSpace(displayNameEl.GetString()))
            {
                name = displayNameEl.GetString()!;
            }
        }

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

        string? primaryType = item.TryGetProperty("primaryType", out var ptEl) && ptEl.ValueKind == JsonValueKind.String
            ? ptEl.GetString()
            : null;

        var classification = _categoryMapper.ClassifyPlace(primaryType, rawTypes);
        if (classification is null ||
            !string.Equals(classification.Category, PlaceCategoryMapper.CategoryTransportation, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(classification.Subcategory, expectedTransportType, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var address = item.TryGetProperty("formattedAddress", out var addrEl) ? addrEl.GetString() : null;

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

    private static bool IsSameOriginPlace(
        string candidateId,
        double candidateLat,
        double candidateLng,
        string? excludePlaceId,
        double originLat,
        double originLng)
    {
        if (!string.IsNullOrWhiteSpace(excludePlaceId) &&
            string.Equals(candidateId, excludePlaceId.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return CalculateHaversineKm(originLat, originLng, candidateLat, candidateLng) < 0.015;
    }

    private static bool MatchesTransportType(
        string subcategory,
        IReadOnlyList<string>? rawTypes,
        string expectedTransportType)
    {
        return string.Equals(subcategory, expectedTransportType, StringComparison.OrdinalIgnoreCase);
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
            ?? Environment.GetEnvironmentVariable("VITE_GOOGLE_MAPS_API_KEY")
            ?? TryReadKeyFromFrontendDotEnv("VITE_GOOGLE_MAPS_API_KEY");

        return string.IsNullOrWhiteSpace(configured) ? null : configured.Trim();
    }

    private static string? TryReadKeyFromFrontendDotEnv(string variableName)
    {
        var candidatePaths = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", ".env"),
            Path.Combine(Directory.GetCurrentDirectory(), "Frontend", ".env"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Frontend", ".env")
        };

        foreach (var path in candidatePaths)
        {
            if (!File.Exists(path)) continue;

            foreach (var rawLine in File.ReadAllLines(path))
            {
                var line = rawLine.Trim();
                if (string.IsNullOrEmpty(line) || line.StartsWith('#')) continue;

                var sepIndex = line.IndexOf('=');
                if (sepIndex <= 0) continue;

                var key = line[..sepIndex].Trim();
                var value = line[(sepIndex + 1)..].Trim().Trim('"', '\'');

                if (string.Equals(key, variableName, StringComparison.Ordinal) &&
                    !string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }
        }

        return null;
    }
}
