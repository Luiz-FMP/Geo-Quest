using GeoQuest.Api.Integrations;
using Microsoft.AspNetCore.Mvc;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlacesController : ControllerBase
{
    private readonly IGooglePlacesClient _placesClient;

    public PlacesController(IGooglePlacesClient placesClient)
    {
        _placesClient = placesClient;
    }

    [HttpGet("nearby")]
    public async Task<IActionResult> GetNearby(
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] int radius = 1200,
        CancellationToken cancellationToken = default)
    {
        if (lat is null || lng is null || double.IsNaN(lat.Value) || double.IsNaN(lng.Value))
        {
            return BadRequest(new
            {
                error = "INVALID_COORDINATES",
                message = "Latitude e longitude são obrigatórias."
            });
        }

        if (lat.Value < -90 || lat.Value > 90 || lng.Value < -180 || lng.Value > 180)
        {
            return BadRequest(new
            {
                error = "OUT_OF_RANGE_COORDINATES",
                message = "Coordenadas fora do intervalo válido (-90..90, -180..180)."
            });
        }

        var clampedRadius = Math.Clamp(radius, 100, 5000);

        var result = await _placesClient.GetNearbyPlacesAsync(
            lat.Value,
            lng.Value,
            clampedRadius,
            cancellationToken
        );

        if (!result.IsSuccess)
        {
            var statusCode = result.ErrorCode == "MISSING_API_KEY"
                ? StatusCodes.Status503ServiceUnavailable
                : StatusCodes.Status502BadGateway;

            return StatusCode(statusCode, new
            {
                error = result.ErrorCode,
                message = result.ErrorMessage
            });
        }

        return Ok(new
        {
            count = result.Places.Count,
            places = result.Places
        });
    }
}

