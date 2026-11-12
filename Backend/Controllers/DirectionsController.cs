using System.Globalization;
using System.Text;
using System.Text.Json;
using GeoQuest.Api.Integrations;
using Microsoft.AspNetCore.Mvc;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DirectionsController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DirectionsController> _logger;

    public DirectionsController(
        IConfiguration configuration,
        ILogger<DirectionsController> logger)
    {
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoute(
        [FromQuery] double originLat,
        [FromQuery] double originLng,
        [FromQuery] double destLat,
        [FromQuery] double destLng,
        [FromQuery] string mode = "walking",
        CancellationToken cancellationToken = default)
    {
        if (double.IsNaN(originLat) || double.IsNaN(originLng) ||
            double.IsNaN(destLat) || double.IsNaN(destLng))
        {
            return BadRequest(new { message = "Coordenadas de origem ou destino inválidas." });
        }

        var apiKey = GooglePlacesClient.ResolveGoogleApiKey(
            _configuration,
            ["GoogleDirections:ApiKey", "GooglePlaces:ApiKey", "GoogleMaps:ApiKey"],
            ["GOOGLE_DIRECTIONS_API_KEY", "GOOGLE_PLACES_API_KEY", "GOOGLE_MAPS_API_KEY", "VITE_GOOGLE_DIRECTIONS_API_KEY", "VITE_GOOGLE_MAPS_API_KEY"]);

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            var routesV2 = await TryComputeRoutesV2Async(apiKey, originLat, originLng, destLat, destLng, mode, cancellationToken);
            if (routesV2.Points.Count > 0)
            {
                return Ok(new
                {
                    source = "google_routes_v2",
                    distanceKm = routesV2.DistanceKm,
                    points = routesV2.Points
                });
            }

            var directionsV1 = await TryLegacyDirectionsAsync(apiKey, originLat, originLng, destLat, destLng, mode, cancellationToken);
            if (directionsV1.Points.Count > 0)
            {
                return Ok(new
                {
                    source = "google_directions_v1",
                    distanceKm = directionsV1.DistanceKm,
                    points = directionsV1.Points
                });
            }
        }

        var directDistKm = Math.Max(0.01, Math.Round(GooglePlacesClient.CalculateHaversineKm(originLat, originLng, destLat, destLng), 3));
        return Ok(new
        {
            source = "direct_fallback",
            distanceKm = directDistKm,
            points = new[]
            {
                new RouteLatLng(originLat, originLng),
                new RouteLatLng(destLat, destLng)
            }
        });
    }

    private async Task<(List<RouteLatLng> Points, double DistanceKm)> TryComputeRoutesV2Async(
        string apiKey,
        double originLat,
        double originLng,
        double destLat,
        double destLng,
        string mode,
        CancellationToken cancellationToken)
    {
        try
        {
            var travelMode = string.Equals(mode, "driving", StringComparison.OrdinalIgnoreCase) ? "DRIVE" : "WALK";
            var payload = new
            {
                origin = new { location = new { latLng = new { latitude = originLat, longitude = originLng } } },
                destination = new { location = new { latLng = new { latitude = destLat, longitude = destLng } } },
                travelMode
            };

            using var req = new HttpRequestMessage(HttpMethod.Post, "https://routes.googleapis.com/directions/v2:computeRoutes");
            req.Headers.Add("X-Goog-Api-Key", apiKey);
            req.Headers.Add("X-Goog-FieldMask", "routes.distanceMeters,routes.polyline.encodedPolyline");
            req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            using var resp = await _httpClient.SendAsync(req, cancellationToken);
            if (!resp.IsSuccessStatusCode)
                return ([], 0);

            var raw = await resp.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(raw);
            if (!doc.RootElement.TryGetProperty("routes", out var routes) || routes.GetArrayLength() == 0)
                return ([], 0);

            var first = routes[0];
            var distanceMeters = first.TryGetProperty("distanceMeters", out var dm) ? dm.GetDouble() : 0;
            var encoded = first.TryGetProperty("polyline", out var poly) && poly.TryGetProperty("encodedPolyline", out var enc)
                ? enc.GetString()
                : null;

            if (string.IsNullOrWhiteSpace(encoded))
                return ([], 0);

            var decoded = DecodePolyline(encoded);
            var distKm = distanceMeters > 0
                ? Math.Round(distanceMeters / 1000.0, 3)
                : Math.Round(GooglePlacesClient.CalculateHaversineKm(originLat, originLng, destLat, destLng), 3);

            return (decoded, distKm);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Falha ao consultar Google Routes API v2.");
            return ([], 0);
        }
    }

    private async Task<(List<RouteLatLng> Points, double DistanceKm)> TryLegacyDirectionsAsync(
        string apiKey,
        double originLat,
        double originLng,
        double destLat,
        double destLng,
        string mode,
        CancellationToken cancellationToken)
    {
        try
        {
            var travelMode = string.Equals(mode, "driving", StringComparison.OrdinalIgnoreCase) ? "driving" : "walking";
            var url = string.Format(
                CultureInfo.InvariantCulture,
                "https://maps.googleapis.com/maps/api/directions/json?origin={0},{1}&destination={2},{3}&mode={4}&key={5}",
                originLat, originLng, destLat, destLng, travelMode, apiKey);

            using var resp = await _httpClient.GetAsync(url, cancellationToken);
            if (!resp.IsSuccessStatusCode)
                return ([], 0);

            var raw = await resp.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(raw);
            if (!doc.RootElement.TryGetProperty("routes", out var routes) || routes.GetArrayLength() == 0)
                return ([], 0);

            var first = routes[0];
            double distanceMeters = 0;
            if (first.TryGetProperty("legs", out var legs) && legs.GetArrayLength() > 0 &&
                legs[0].TryGetProperty("distance", out var distObj) &&
                distObj.TryGetProperty("value", out var distVal))
            {
                distanceMeters = distVal.GetDouble();
            }

            var encoded = first.TryGetProperty("overview_polyline", out var poly) && poly.TryGetProperty("points", out var pts)
                ? pts.GetString()
                : null;

            if (string.IsNullOrWhiteSpace(encoded))
                return ([], 0);

            var decoded = DecodePolyline(encoded);
            var distKm = distanceMeters > 0
                ? Math.Round(distanceMeters / 1000.0, 3)
                : Math.Round(GooglePlacesClient.CalculateHaversineKm(originLat, originLng, destLat, destLng), 3);

            return (decoded, distKm);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Falha ao consultar Google Directions API v1.");
            return ([], 0);
        }
    }

    private static List<RouteLatLng> DecodePolyline(string encoded)
    {
        var poly = new List<RouteLatLng>();
        int index = 0, len = encoded.Length, lat = 0, lng = 0;

        while (index < len)
        {
            int b, shift = 0, result = 0;
            do
            {
                b = encoded[index++] - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20 && index < len);

            int dlat = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            lat += dlat;

            shift = 0;
            result = 0;
            do
            {
                if (index >= len) break;
                b = encoded[index++] - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20 && index < len);

            int dlng = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            lng += dlng;

            poly.Add(new RouteLatLng(lat / 1E5, lng / 1E5));
        }

        return poly;
    }

    public sealed record RouteLatLng(double Lat, double Lng);
}
