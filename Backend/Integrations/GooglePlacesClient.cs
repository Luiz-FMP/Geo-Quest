using System.Collections.Concurrent;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Services;

namespace GeoQuest.Api.Integrations;

public class GooglePlacesClient : IGooglePlacesClient
{
    private const string PlacesNearbyUrl = "https://places.googleapis.com/v1/places:searchNearby";
    private const string FieldMask = "places.id,places.displayName,places.location,places.types,places.primaryType";

    private static readonly ConcurrentDictionary<string, (DateTime ExpiresAtUtc, List<GamePoiDto> Places)> NearbyCache = new();
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(3);

    private static readonly string[][] SearchBatches =
    [
        [
            "shopping_mall", "supermarket", "book_store", "clothing_store", "electronics_store", "department_store",
            "restaurant", "cafe", "bakery", "bar", "fast_food_restaurant", "ice_cream_shop", "coffee_shop",
            "hospital",
            "hotel", "hostel", "inn", "motel", "resort_hotel",
            "park", "city_park", "plaza", "movie_theater", "tourist_attraction", "botanical_garden",
            "museum", "art_gallery", "cultural_landmark", "historical_place", "monument"
        ],
        [
            "barber_shop", "beauty_salon", "laundry", "veterinary_care", "florist",
            "beach", "scenic_spot", "woods", "nature_preserve", "natural_feature",
            "gym", "fitness_center", "stadium", "sports_complex", "swimming_pool",
            "bus_station", "subway_station", "train_station", "transit_station", "airport", "ferry_terminal", "bus_stop"
        ]
    ];

    private static readonly Dictionary<string, (string[] ApiTypes, string[] NameKeywords)> TransportSearchProfiles =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["bus_station"] = (["bus_station", "transit_station", "transit_depot"], ["rodoviaria", "rodoviária", "terminal", "estacao", "estação", "onibus", "ônibus", "bus"]),
            ["bus_stop"] = (["bus_stop", "transit_station"], ["ponto de onibus", "ponto de ônibus", "parada", "tubo", "estacao tubo", "estação tubo", "onibus", "ônibus", "bus"]),
            ["subway_station"] = (["subway_station", "light_rail_station", "train_station", "transit_station"], ["metro", "metrô", "estacao", "estação", "subway", "cptm", "trem"]),
            ["train_station"] = (["train_station", "light_rail_station", "subway_station", "transit_station"], ["trem", "estacao", "estação", "ferroviaria", "ferroviária", "train", "cptm"]),
            ["light_rail_station"] = (["light_rail_station", "subway_station", "train_station", "transit_station"], ["vlt", "bonde", "estacao", "estação", "trem", "metro", "metrô"]),
            ["transit_station"] = (["transit_station", "bus_station", "subway_station", "train_station", "bus_stop"], ["terminal", "estacao", "estação", "transporte", "integracao", "integração"]),
            ["public_transit_station"] = (["transit_station", "bus_station", "subway_station", "train_station"], ["terminal", "estacao", "estação", "transporte"]),
            ["transit_stop"] = (["bus_stop", "transit_station"], ["parada", "ponto", "estacao", "estação"]),
            ["transit_depot"] = (["transit_depot", "bus_station", "transit_station"], ["garagem", "terminal", "deposito", "depósito"]),
            ["K_depot"] = (["transit_depot", "bus_station", "transit_station"], ["garagem", "terminal", "deposito", "depósito"]),
            ["airport"] = (["airport", "international_airport", "airstrip", "heliport"], ["aeroporto", "airport", "aerodromo", "aeródromo"]),
            ["international_airport"] = (["international_airport", "airport"], ["aeroporto", "airport", "internacional"]),
            ["airstrip"] = (["airstrip", "airport", "heliport"], ["pista", "aerodromo", "aeródromo", "aeroporto"]),
            ["heliport"] = (["heliport", "airport"], ["heliporto", "heliponto", "heliport"]),
            ["ferry_terminal"] = (["ferry_terminal", "marina", "transit_station"], ["balsa", "ferry", "barca", "terminal hidroviario", "terminal marítimo", "porto", "pier"]),
            ["ferry_service"] = (["ferry_terminal", "marina", "transit_station"], ["balsa", "ferry", "barca", "travessia"]),
            ["taxi_stand"] = (["taxi_stand", "transit_station"], ["taxi", "táxi", "ponto de taxi", "ponto de táxi"]),
            ["taxi_service"] = (["taxi_stand", "transit_station"], ["taxi", "táxi", "cooperativa", "radio taxi"]),
            ["park_and_ride"] = (["park_and_ride", "parking", "transit_station"], ["estacionamento", "park", "integracao", "integração"]),
            ["rest_stop"] = (["rest_stop", "gas_station"], ["parada", "descanso", "posto", "rodovia"]),
            ["toll_station"] = (["transit_station"], ["pedagio", "pedágio"]),
            ["train_ticket_office"] = (["train_station", "transit_station"], ["bilheteria", "passagem", "estacao", "estação", "trem"]),
            ["truck_stop"] = (["rest_stop", "gas_station"], ["caminhao", "caminhão", "posto", "parada"]),
            ["valet_parking"] = (["parking"], ["valet", "manobrista", "estacionamento"]),
            ["weigh_station"] = (["transit_station"], ["balanca", "balança", "pesagem"])
        };

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GooglePlacesClient> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public GooglePlacesClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GooglePlacesClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<IReadOnlyList<GamePoiDto>> SearchNearbyGamePoisAsync(
        double latitude,
        double longitude,
        double radiusMeters = 1200,
        CancellationToken cancellationToken = default)
    {
        var clampedRadius = Math.Clamp(radiusMeters, 100, 50000);
        var cacheKey = string.Format(
            CultureInfo.InvariantCulture,
            "{0:F3}:{1:F3}:{2:F0}",
            latitude,
            longitude,
            clampedRadius);

        if (NearbyCache.TryGetValue(cacheKey, out var cached) && cached.ExpiresAtUtc > DateTime.UtcNow)
            return cached.Places;

        var apiKey = ResolveGoogleApiKey(_configuration, ["GooglePlaces:ApiKey", "GoogleMaps:ApiKey"], ["GOOGLE_PLACES_API_KEY", "GOOGLE_MAPS_API_KEY", "VITE_GOOGLE_MAPS_API_KEY"]);
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Chave da API Google Places não configurada.");
            return [];
        }

        var mergedById = new Dictionary<string, GamePoiDto>(StringComparer.Ordinal);
        bool anyBatchSucceeded = false;

        foreach (var batch in SearchBatches)
        {
            try
            {
                var places = await ExecuteNearbyBatchAsync(apiKey, latitude, longitude, clampedRadius, batch, cancellationToken);
                anyBatchSucceeded = true;

                foreach (var p in places)
                {
                    if (string.IsNullOrWhiteSpace(p.Id) || p.Location == null)
                        continue;

                    var classification = PlaceCategoryMapper.ClassifyPlace(p.PrimaryType, p.Types);
                    if (classification == null)
                        continue;

                    mergedById[p.Id] = new GamePoiDto
                    {
                        Id = p.Id,
                        Name = string.IsNullOrWhiteSpace(p.DisplayName?.Text) ? "Local sem nome" : p.DisplayName!.Text!,
                        Lat = p.Location.Latitude,
                        Lng = p.Location.Longitude,
                        Category = classification.Category,
                        Subcategory = classification.Subcategory,
                        Color = classification.Color,
                        IsBossSpecial = classification.IsBossSpecial
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao consultar lote da Google Places API (New).");
            }
        }

        if (mergedById.Count == 0)
        {
            try
            {
                var unrestrictedPlaces = await ExecuteNearbyBatchAsync(apiKey, latitude, longitude, clampedRadius, null, cancellationToken);
                anyBatchSucceeded = true;

                foreach (var p in unrestrictedPlaces)
                {
                    if (string.IsNullOrWhiteSpace(p.Id) || p.Location == null)
                        continue;

                    var classification = PlaceCategoryMapper.ClassifyPlace(p.PrimaryType, p.Types);
                    if (classification == null)
                        continue;

                    mergedById[p.Id] = new GamePoiDto
                    {
                        Id = p.Id,
                        Name = string.IsNullOrWhiteSpace(p.DisplayName?.Text) ? "Local sem nome" : p.DisplayName!.Text!,
                        Lat = p.Location.Latitude,
                        Lng = p.Location.Longitude,
                        Category = classification.Category,
                        Subcategory = classification.Subcategory,
                        Color = classification.Color,
                        IsBossSpecial = classification.IsBossSpecial
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao consultar fallback geral da Google Places API (New).");
            }
        }

        if (!anyBatchSucceeded)
        {
            throw new InvalidOperationException("Não foi possível consultar a Google Places API. Verifique se a Places API (New) está ativada e se a chave possui permissão.");
        }

        var resultList = mergedById.Values
            .OrderByDescending(x => x.IsBossSpecial)
            .ThenBy(x => x.Name)
            .ToList();

        NearbyCache[cacheKey] = (DateTime.UtcNow.Add(CacheDuration), resultList);
        return resultList;
    }

    public async Task<(IReadOnlyList<GamePoiDto> Places, double RadiusUsedMeters)> SearchTransportationDestinationsAsync(
        double latitude,
        double longitude,
        string transportSubcategory,
        string? excludePlaceId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedType = (transportSubcategory ?? string.Empty).Trim().ToLowerInvariant();
        if (!PlaceCategoryMapper.IsTransportationSubcategory(normalizedType))
        {
            throw new ArgumentException($"Subcategoria de transporte inválida: '{transportSubcategory}'.", nameof(transportSubcategory));
        }

        var apiKey = ResolveGoogleApiKey(_configuration, ["GooglePlaces:ApiKey", "GoogleMaps:ApiKey"], ["GOOGLE_PLACES_API_KEY", "GOOGLE_MAPS_API_KEY", "VITE_GOOGLE_MAPS_API_KEY"]);
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Chave da API Google Places não configurada.");
        }

        double[] progressiveRadiiMeters = [5000, 15000, 30000, 50000];
        var mergedById = new Dictionary<string, GamePoiDto>(StringComparer.Ordinal);
        double lastRadiusUsed = progressiveRadiiMeters[0];

        var profile = TransportSearchProfiles.TryGetValue(normalizedType, out var customProfile)
            ? customProfile
            : (ApiTypes: [normalizedType], NameKeywords: [normalizedType.Replace('_', ' ')]);

        foreach (var radius in progressiveRadiiMeters)
        {
            lastRadiusUsed = radius;
            var batchCandidates = new List<GooglePlaceItem>();

            try
            {
                var exactPlaces = await ExecuteNearbyBatchAsync(apiKey, latitude, longitude, radius, [normalizedType], cancellationToken, rankPreference: "DISTANCE");
                batchCandidates.AddRange(exactPlaces);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Busca exata de transporte ({Subcategory}) falhou no raio {Radius}m.", normalizedType, radius);
            }

            foreach (var candidate in batchCandidates)
            {
                if (string.IsNullOrWhiteSpace(candidate.Id) || candidate.Location == null)
                    continue;

                if (!string.IsNullOrWhiteSpace(excludePlaceId) &&
                    string.Equals(candidate.Id, excludePlaceId, StringComparison.Ordinal))
                    continue;

                if (CalculateHaversineKm(latitude, longitude, candidate.Location.Latitude, candidate.Location.Longitude) < 0.03)
                    continue;

                if (!MatchesExactTransportationSubcategory(candidate, normalizedType))
                    continue;

                mergedById[candidate.Id] = new GamePoiDto
                {
                    Id = candidate.Id,
                    Name = string.IsNullOrWhiteSpace(candidate.DisplayName?.Text) ? "Ponto de Transporte" : candidate.DisplayName!.Text!,
                    Lat = candidate.Location.Latitude,
                    Lng = candidate.Location.Longitude,
                    Category = PlaceCategoryMapper.Transportation,
                    Subcategory = normalizedType,
                    Color = "#3B82F6",
                    IsBossSpecial = false
                };
            }

            if (mergedById.Count == 0 && profile.ApiTypes.Length > 1)
            {
                try
                {
                    var relatedPlaces = await ExecuteNearbyBatchAsync(apiKey, latitude, longitude, radius, profile.ApiTypes, cancellationToken, rankPreference: "DISTANCE");
                    foreach (var candidate in relatedPlaces)
                    {
                        if (string.IsNullOrWhiteSpace(candidate.Id) || candidate.Location == null)
                            continue;

                        if (!string.IsNullOrWhiteSpace(excludePlaceId) &&
                            string.Equals(candidate.Id, excludePlaceId, StringComparison.Ordinal))
                            continue;

                        if (CalculateHaversineKm(latitude, longitude, candidate.Location.Latitude, candidate.Location.Longitude) < 0.03)
                            continue;

                        if (!MatchesExactTransportationSubcategory(candidate, normalizedType))
                            continue;

                        mergedById[candidate.Id] = new GamePoiDto
                        {
                            Id = candidate.Id,
                            Name = string.IsNullOrWhiteSpace(candidate.DisplayName?.Text) ? "Ponto de Transporte" : candidate.DisplayName!.Text!,
                            Lat = candidate.Location.Latitude,
                            Lng = candidate.Location.Longitude,
                            Category = PlaceCategoryMapper.Transportation,
                            Subcategory = normalizedType,
                            Color = "#3B82F6",
                            IsBossSpecial = false
                        };
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Busca de tipos relacionados para transporte ({Subcategory}) falhou no raio {Radius}m.", normalizedType, radius);
                }
            }

            if (mergedById.Count == 0)
            {
                try
                {
                    var legacyPlaces = await ExecuteLegacyNearbyTransportSearchAsync(
                        apiKey,
                        latitude,
                        longitude,
                        radius,
                        normalizedType,
                        profile.NameKeywords.FirstOrDefault() ?? normalizedType.Replace('_', ' '),
                        cancellationToken);

                    foreach (var legacy in legacyPlaces)
                    {
                        if (string.IsNullOrWhiteSpace(legacy.Id))
                            continue;

                        if (!string.IsNullOrWhiteSpace(excludePlaceId) &&
                            string.Equals(legacy.Id, excludePlaceId, StringComparison.Ordinal))
                            continue;

                        if (CalculateHaversineKm(latitude, longitude, legacy.Lat, legacy.Lng) < 0.03)
                            continue;

                        mergedById[legacy.Id] = legacy;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Busca legada de transporte ({Subcategory}) falhou no raio {Radius}m.", normalizedType, radius);
                }
            }

            if (mergedById.Count >= 3)
                break;
        }

        var ordered = mergedById.Values
            .OrderBy(p => CalculateHaversineKm(latitude, longitude, p.Lat, p.Lng))
            .ToList();

        return (ordered, lastRadiusUsed);
    }

    private static bool MatchesExactTransportationSubcategory(GooglePlaceItem place, string targetSubcategory)
    {
        if (!string.IsNullOrWhiteSpace(place.PrimaryType) &&
            string.Equals(place.PrimaryType.Trim(), targetSubcategory, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (place.Types != null &&
            place.Types.Any(t => string.Equals(t?.Trim(), targetSubcategory, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        var classification = PlaceCategoryMapper.ClassifyPlace(place.PrimaryType, place.Types);
        return classification != null &&
            string.Equals(classification.Category, PlaceCategoryMapper.Transportation, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(classification.Subcategory, targetSubcategory, StringComparison.OrdinalIgnoreCase);
    }

    private async Task<List<GamePoiDto>> ExecuteLegacyNearbyTransportSearchAsync(
        string apiKey,
        double latitude,
        double longitude,
        double radiusMeters,
        string targetSubcategory,
        string keyword,
        CancellationToken cancellationToken)
    {
        var results = new List<GamePoiDto>();
        var url = string.Format(
            CultureInfo.InvariantCulture,
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={0},{1}&radius={2}&type={3}&keyword={4}&key={5}",
            latitude,
            longitude,
            Math.Clamp(Math.Round(radiusMeters), 100, 50000),
            Uri.EscapeDataString(targetSubcategory),
            Uri.EscapeDataString(keyword),
            Uri.EscapeDataString(apiKey));

        using var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return results;

        var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(rawJson);

        if (!doc.RootElement.TryGetProperty("results", out var resultsArray) ||
            resultsArray.ValueKind != JsonValueKind.Array)
        {
            return results;
        }

        foreach (var item in resultsArray.EnumerateArray())
        {
            var placeId = item.TryGetProperty("place_id", out var pidProp) ? pidProp.GetString() : null;
            var name = item.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;

            if (string.IsNullOrWhiteSpace(placeId))
                continue;

            if (!item.TryGetProperty("geometry", out var geom) ||
                !geom.TryGetProperty("location", out var loc))
                continue;

            var lat = loc.TryGetProperty("lat", out var latProp) ? latProp.GetDouble() : double.NaN;
            var lng = loc.TryGetProperty("lng", out var lngProp) ? lngProp.GetDouble() : double.NaN;
            if (double.IsNaN(lat) || double.IsNaN(lng))
                continue;

            var itemTypes = new List<string>();
            if (item.TryGetProperty("types", out var typesArr) && typesArr.ValueKind == JsonValueKind.Array)
            {
                foreach (var t in typesArr.EnumerateArray())
                {
                    var ts = t.GetString();
                    if (!string.IsNullOrWhiteSpace(ts))
                        itemTypes.Add(ts.Trim());
                }
            }

            if (!itemTypes.Any(t => string.Equals(t, targetSubcategory, StringComparison.OrdinalIgnoreCase)))
                continue;

            results.Add(new GamePoiDto
            {
                Id = placeId,
                Name = string.IsNullOrWhiteSpace(name) ? "Ponto de Transporte" : name!,
                Lat = lat,
                Lng = lng,
                Category = PlaceCategoryMapper.Transportation,
                Subcategory = targetSubcategory,
                Color = "#3B82F6",
                IsBossSpecial = false
            });
        }

        return results;
    }

    public static double CalculateHaversineKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double earthRadiusKm = 6371.0;
        double dLat = (lat2 - lat1) * Math.PI / 180.0;
        double dLng = (lng2 - lng1) * Math.PI / 180.0;
        double a =
            Math.Sin(dLat / 2.0) * Math.Sin(dLat / 2.0) +
            Math.Cos(lat1 * Math.PI / 180.0) *
            Math.Cos(lat2 * Math.PI / 180.0) *
            Math.Sin(dLng / 2.0) *
            Math.Sin(dLng / 2.0);
        double c = 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0 - a));
        return earthRadiusKm * c;
    }

    private async Task<List<GooglePlaceItem>> ExecuteNearbyBatchAsync(
        string apiKey,
        double latitude,
        double longitude,
        double radiusMeters,
        string[]? includedTypes,
        CancellationToken cancellationToken,
        string rankPreference = "POPULARITY")
    {
        var payload = new GoogleNearbyRequest
        {
            IncludedTypes = includedTypes is { Length: > 0 } ? includedTypes : null,
            MaxResultCount = 20,
            RankPreference = rankPreference,
            LocationRestriction = new GoogleLocationRestriction
            {
                Circle = new GoogleCircle
                {
                    Center = new GoogleLatLng { Latitude = latitude, Longitude = longitude },
                    Radius = radiusMeters
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, PlacesNearbyUrl);
        request.Headers.Add("X-Goog-Api-Key", apiKey);
        request.Headers.Add("X-Goog-FieldMask", FieldMask);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            Encoding.UTF8,
            "application/json");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var rawBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Google Places API retornou {(int)response.StatusCode}: {rawBody}");
        }

        var parsed = JsonSerializer.Deserialize<GoogleNearbyResponse>(rawBody, JsonOptions);
        return parsed?.Places ?? [];
    }

    public static string? ResolveGoogleApiKey(
        IConfiguration configuration,
        string[] configKeys,
        string[] envAndDotEnvKeys)
    {
        foreach (var ck in configKeys)
        {
            var val = configuration[ck];
            if (IsValidKey(val))
                return val!.Trim();
        }

        foreach (var ek in envAndDotEnvKeys)
        {
            var val = Environment.GetEnvironmentVariable(ek);
            if (IsValidKey(val))
                return val!.Trim();
        }

        return TryReadKeyFromFrontendDotEnv(envAndDotEnvKeys);
    }

    private static bool IsValidKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        var trimmed = value.Trim();
        return !trimmed.Contains("SUA_CHAVE", StringComparison.OrdinalIgnoreCase)
            && !trimmed.Contains("YOUR_API_KEY", StringComparison.OrdinalIgnoreCase);
    }

    private static string? TryReadKeyFromFrontendDotEnv(string[] acceptedKeys)
    {
        try
        {
            var baseDir = Directory.GetCurrentDirectory();
            var candidates = new[]
            {
                Path.Combine(baseDir, "..", "Frontend", ".env"),
                Path.Combine(baseDir, "..", "Frontend", ".env.local"),
                Path.Combine(baseDir, ".env")
            };

            foreach (var path in candidates)
            {
                if (!File.Exists(path))
                    continue;

                foreach (var line in File.ReadAllLines(path))
                {
                    var trimmed = line.Trim();
                    if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#'))
                        continue;

                    foreach (var keyName in acceptedKeys)
                    {
                        var prefix = keyName + "=";
                        if (trimmed.StartsWith(prefix, StringComparison.Ordinal))
                        {
                            var val = trimmed[prefix.Length..].Trim().Trim('"', '\'');
                            if (IsValidKey(val))
                                return val;
                        }
                    }
                }
            }
        }
        catch
        {
        }

        return null;
    }

    private sealed class GoogleNearbyRequest
    {
        public string[]? IncludedTypes { get; set; }
        public int MaxResultCount { get; set; }
        public string RankPreference { get; set; } = "POPULARITY";
        public GoogleLocationRestriction LocationRestriction { get; set; } = new();
    }

    private sealed class GoogleLocationRestriction
    {
        public GoogleCircle Circle { get; set; } = new();
    }

    private sealed class GoogleCircle
    {
        public GoogleLatLng Center { get; set; } = new();
        public double Radius { get; set; }
    }

    private sealed class GoogleLatLng
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    private sealed class GoogleNearbyResponse
    {
        public List<GooglePlaceItem>? Places { get; set; }
    }

    private sealed class GooglePlaceItem
    {
        public string? Id { get; set; }
        public GoogleDisplayName? DisplayName { get; set; }
        public GoogleLatLng? Location { get; set; }
        public List<string>? Types { get; set; }
        public string? PrimaryType { get; set; }
    }

    private sealed class GoogleDisplayName
    {
        public string? Text { get; set; }
    }
}
