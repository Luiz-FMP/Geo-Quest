using Microsoft.AspNetCore.Mvc;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Integrations;
using GeoQuest.Api.Services;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlacesController : ControllerBase
{
    private readonly IGooglePlacesClient _googlePlacesClient;
    private readonly ILogger<PlacesController> _logger;

    public PlacesController(
        IGooglePlacesClient googlePlacesClient,
        ILogger<PlacesController> logger)
    {
        _googlePlacesClient = googlePlacesClient;
        _logger = logger;
    }

    [HttpGet("nearby")]
    public async Task<ActionResult<IReadOnlyList<GamePoiDto>>> GetNearby(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] double radius = 1200,
        CancellationToken cancellationToken = default)
    {
        if (double.IsNaN(lat) || double.IsNaN(lng) || lat is < -90 or > 90 || lng is < -180 or > 180)
        {
            return BadRequest(new { message = "Coordenadas inválidas. Informe valores válidos para lat e lng." });
        }

        try
        {
            var places = await _googlePlacesClient.SearchNearbyGamePoisAsync(lat, lng, radius, cancellationToken);
            return Ok(places);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar POIs próximos na Google Places API.");
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                message = "Falha ao consultar lugares próximos na Google Places API.",
                detail = ex.Message
            });
        }
    }

    [HttpGet("transportation")]
    public async Task<IActionResult> GetTransportationDestinations(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] string type,
        [FromQuery] string? excludePlaceId = null,
        CancellationToken cancellationToken = default)
    {
        if (double.IsNaN(lat) || double.IsNaN(lng) || lat is < -90 or > 90 || lng is < -180 or > 180)
        {
            return BadRequest(new { message = "Coordenadas inválidas. Informe valores válidos para lat e lng." });
        }

        if (!PlaceCategoryMapper.IsTransportationSubcategory(type))
        {
            return BadRequest(new { message = $"Subcategoria de transporte não suportada: '{type}'." });
        }

        try
        {
            var (places, radiusUsedMeters) = await _googlePlacesClient.SearchTransportationDestinationsAsync(
                lat, lng, type, excludePlaceId, cancellationToken);

            return Ok(new
            {
                transportType = type.Trim().ToLowerInvariant(),
                radiusUsedMeters,
                places
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar destinos de transporte ({Type}) na Google Places API.", type);
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                message = "Falha ao consultar destinos de transporte na Google Places API.",
                detail = ex.Message
            });
        }
    }
}
