using GeoQuest.Api.Data;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CombateController : ControllerBase
{
    private readonly CombatService _combatService;
    private readonly GeoQuestDbContext _context;

    public CombateController(CombatService combatService, GeoQuestDbContext context)
    {
        _combatService = combatService;
        _context = context;
    }

    [HttpPost("iniciar")]
    public async Task<ActionResult<SessaoCombateDto>> IniciarCombate(
        [FromBody] IniciarCombateRequest request,
        CancellationToken cancellationToken)
    {
        var jogador = await _context.Jogadores
            .OrderBy(j => j.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (jogador is not null && jogador.VidaAtual <= 0)
        {
            return BadRequest(new { mensagem = "Não é possível iniciar um combate com a Vida zerada. Recupere sua Vida em um hospital ou no Home." });
        }

        if (jogador is not null &&
            !string.IsNullOrWhiteSpace(request.PlaceId) &&
            (string.Equals(request.TipoCombate, "Arena", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(request.TipoCombate, "Boss", StringComparison.OrdinalIgnoreCase)))
        {
            bool jaConcluido = await _context.EstadosPlaces.AnyAsync(
                e => e.JogadorId == jogador.Id &&
                     e.PlaceId == request.PlaceId.Trim() &&
                     e.Concluido,
                cancellationToken);

            if (jaConcluido)
            {
                return BadRequest(new { mensagem = "Este local de combate já foi concluído permanentemente." });
            }
        }

        var sessao = await _combatService.GerarCombateAsync(request);
        sessao.PlaceId = request.PlaceId;
        return Ok(sessao);
    }
}
