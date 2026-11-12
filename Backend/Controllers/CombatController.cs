using GeoQuest.Api.DTOs;
using GeoQuest.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CombatController : ControllerBase
{
    private readonly CombatService _combatService;

    public CombatController(CombatService combatService)
    {
        _combatService = combatService;
    }

    [HttpGet("iniciar")]
    public async Task<ActionResult<SessaoCombateDto>> IniciarCombate(
        [FromQuery] string tipo = "random",
        [FromQuery] string local = "Zona Urbana")
    {
        var sessao = await _combatService.IniciarCombateAsync(tipo, local);
        return Ok(sessao);
    }
}
