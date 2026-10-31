using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DirectionsController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<DirectionsController> _logger;

    public DirectionsController(
        HttpClient httpClient,
        IConfiguration configuration,
        IWebHostEnvironment env,
        ILogger<DirectionsController> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _env = env;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetDirections(
        [FromQuery] double originLat,
        [FromQuery] double originLng,
        [FromQuery] double destLat,
        [FromQuery] double destLng,
        [FromQuery] string mode = "walking",
        CancellationToken cancellationToken = default)
    {
        var apiKey = ResolveDirectionsApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                error = "MISSING_DIRECTIONS_KEY",
                message = "Chave da Directions API não configurada."
            });
        }

        // 1. Try Directions API (Legacy REST)
        var legacyResult = await TryLegacyDirectionsAsync(
            originLat, originLng, destLat, destLng, mode, apiKey, cancellationToken);

        if (legacyResult.Success && legacyResult.Points is { Count: > 0 })
        {
            return Ok(new
            {
                status = "OK",
                provider = "directions_v1",
                encodedPolyline = legacyResult.EncodedPolyline,
                points = legacyResult.Points
            });
        }

        // If walking failed with ZERO_RESULTS, try driving
        if (legacyResult.Status == "ZERO_RESULTS" && !string.Equals(mode, "driving", StringComparison.OrdinalIgnoreCase))
        {
            var drivingResult = await TryLegacyDirectionsAsync(
                originLat, originLng, destLat, destLng, "driving", apiKey, cancellationToken);

            if (drivingResult.Success && drivingResult.Points is { Count: > 0 })
            {
                return Ok(new
                {
                    status = "OK",
                    provider = "directions_v1_driving",
                    encodedPolyline = drivingResult.EncodedPolyline,
                    points = drivingResult.Points
                });
            }
        }

        // 2. Try Google Routes API v2 (computeRoutes) in case the key has Routes API enabled instead of Legacy Directions API
        var routesV2Result = await TryRoutesV2Async(
            originLat, originLng, destLat, destLng, apiKey, cancellationToken);

        if (routesV2Result.Success && routesV2Result.Points is { Count: > 0 })
        {
            return Ok(new
            {
                status = "OK",
                provider = "routes_v2",
                encodedPolyline = routesV2Result.EncodedPolyline,
                points = routesV2Result.Points
            });
        }

        return BadRequest(new
        {
            error = legacyResult.Status ?? "DIRECTIONS_FAILED",
            message = legacyResult.ErrorMessage ?? routesV2Result.ErrorMessage ?? "Não foi possível calcular a rota."
        });
    }

    private async Task<(bool Success, string? Status, string? EncodedPolyline, List<CoordinatePoint>? Points, string? ErrorMessage)>
        TryLegacyDirectionsAsync(
            double originLat,
            double originLng,
            double destLat,
            double destLng,
            string mode,
            string apiKey,
            CancellationToken cancellationToken)
    {
        var originStr = $"{originLat.ToString(CultureInfo.InvariantCulture)},{originLng.ToString(CultureInfo.InvariantCulture)}";
        var destStr = $"{destLat.ToString(CultureInfo.InvariantCulture)},{destLng.ToString(CultureInfo.InvariantCulture)}";
        var url = $"https://maps.googleapis.com/maps/api/directions/json?origin={originStr}&destination={destStr}&mode={mode}&key={Uri.EscapeDataString(apiKey)}";

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            if (Request.Headers.TryGetValue("Origin", out var originHeader) && !string.IsNullOrWhiteSpace(originHeader))
            {
                request.Headers.TryAddWithoutValidation("Referer", originHeader.ToString());
            }

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = doc.RootElement;

            var status = root.TryGetProperty("status", out var statusProp)
                ? statusProp.GetString()
                : "UNKNOWN";

            if (status != "OK")
            {
                var errorMsg = root.TryGetProperty("error_message", out var errEl)
                    ? errEl.GetString()
                    : $"Directions API retornou status: {status}";
                return (false, status, null, null, errorMsg);
            }

            if (root.TryGetProperty("routes", out var routes) && routes.GetArrayLength() > 0)
            {
                var firstRoute = routes[0];
                if (firstRoute.TryGetProperty("overview_polyline", out var poly) &&
                    poly.TryGetProperty("points", out var pointsEl))
                {
                    var encoded = pointsEl.GetString();
                    if (!string.IsNullOrWhiteSpace(encoded))
                    {
                        return (true, "OK", encoded, DecodePolyline(encoded), null);
                    }
                }
            }

            return (false, "EMPTY_POLYLINE", null, null, "Rota sem geometria retornada.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao consultar Legacy Directions API.");
            return (false, "EXCEPTION", null, null, ex.Message);
        }
    }

    private async Task<(bool Success, string? EncodedPolyline, List<CoordinatePoint>? Points, string? ErrorMessage)>
        TryRoutesV2Async(
            double originLat,
            double originLng,
            double destLat,
            double destLng,
            string apiKey,
            CancellationToken cancellationToken)
    {
        const string url = "https://routes.googleapis.com/directions/v2:computeRoutes";
        var payload = new
        {
            origin = new
            {
                location = new
                {
                    latLng = new { latitude = originLat, longitude = originLng }
                }
            },
            destination = new
            {
                location = new
                {
                    latLng = new { latitude = destLat, longitude = destLng }
                }
            },
            travelMode = "WALK"
        };

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.TryAddWithoutValidation("X-Goog-Api-Key", apiKey);
            request.Headers.TryAddWithoutValidation("X-Goog-FieldMask", "routes.polyline.encodedPolyline");

            if (Request.Headers.TryGetValue("Origin", out var originHeader) && !string.IsNullOrWhiteSpace(originHeader))
            {
                request.Headers.TryAddWithoutValidation("Referer", originHeader.ToString());
            }

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = doc.RootElement;

            if (root.TryGetProperty("routes", out var routes) && routes.GetArrayLength() > 0)
            {
                var firstRoute = routes[0];
                if (firstRoute.TryGetProperty("polyline", out var poly) &&
                    poly.TryGetProperty("encodedPolyline", out var encodedEl))
                {
                    var encoded = encodedEl.GetString();
                    if (!string.IsNullOrWhiteSpace(encoded))
                    {
                        return (true, encoded, DecodePolyline(encoded), null);
                    }
                }
            }

            if (root.TryGetProperty("error", out var errObj) &&
                errObj.TryGetProperty("message", out var msgEl))
            {
                return (false, null, null, msgEl.GetString());
            }

            return (false, null, null, "Routes API v2 não retornou rota.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao consultar Routes API v2.");
            return (false, null, null, ex.Message);
        }
    }

    private string? ResolveDirectionsApiKey()
    {
        var fromConfig = _configuration["GoogleMaps:DirectionsApiKey"]
            ?? Environment.GetEnvironmentVariable("GOOGLE_DIRECTIONS_API_KEY")
            ?? Environment.GetEnvironmentVariable("VITE_GOOGLE_DIRECTIONS_API_KEY");

        if (!string.IsNullOrWhiteSpace(fromConfig))
        {
            return fromConfig.Trim();
        }

        // Em ambiente de desenvolvimento, lê também de Frontend/.env caso exista localmente
        var fromDotEnv = TryReadKeyFromFrontendDotEnv("VITE_GOOGLE_DIRECTIONS_API_KEY")
            ?? TryReadKeyFromFrontendDotEnv("VITE_GOOGLE_MAPS_API_KEY");

        if (!string.IsNullOrWhiteSpace(fromDotEnv))
        {
            return fromDotEnv.Trim();
        }

        var fallback = _configuration["GoogleMaps:ApiKey"]
            ?? Environment.GetEnvironmentVariable("VITE_GOOGLE_MAPS_API_KEY");

        return string.IsNullOrWhiteSpace(fallback) ? null : fallback.Trim();
    }

    private string? TryReadKeyFromFrontendDotEnv(string variableName)
    {
        var candidatePaths = new[]
        {
            Path.Combine(_env.ContentRootPath, "..", "Frontend", ".env"),
            Path.Combine(_env.ContentRootPath, "Frontend", ".env"),
            Path.Combine(Directory.GetCurrentDirectory(), "Frontend", ".env"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", ".env")
        };

        foreach (var path in candidatePaths)
        {
            if (!System.IO.File.Exists(path)) continue;

            foreach (var rawLine in System.IO.File.ReadAllLines(path))
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

    private static List<CoordinatePoint> DecodePolyline(string encoded)
    {
        var poly = new List<CoordinatePoint>();
        int index = 0, len = encoded.Length;
        int lat = 0, lng = 0;

        while (index < len)
        {
            int b, shift = 0, result = 0;
            do
            {
                b = encoded[index++] - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlat = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            lat += dlat;

            shift = 0;
            result = 0;
            do
            {
                b = encoded[index++] - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlng = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            lng += dlng;

            poly.Add(new CoordinatePoint(lat / 1e5, lng / 1e5));
        }

        return poly;
    }

    public record CoordinatePoint(double Lat, double Lng);
}
