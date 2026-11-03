using GeoQuest.Api.DTOs;
using GeoQuest.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CombateController : ControllerBase
{
    private readonly CombatService _combatService;

    public CombateController(CombatService combatService)
    {
        _combatService = combatService;
    }

    [HttpPost("iniciar")]
    public async Task<ActionResult<SessaoCombateDto>> IniciarCombate([FromBody] IniciarCombateRequest request)
    {
        var sessao = await _combatService.GerarCombateAsync(request);
        return Ok(sessao);
    }
}