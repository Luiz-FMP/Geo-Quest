using GeoQuest.Api.Data;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoQuest.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PersonagensController : ControllerBase
{
    private readonly GeoQuestDbContext _context;

    public PersonagensController(GeoQuestDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PersonagemResumoDto>>> GetPersonagens(CancellationToken cancellationToken)
    {
        var personagens = await _context.Personagens
            .OrderBy(p => p.Id)
            .Select(p => new PersonagemResumoDto(
                p.Id,
                p.Nome,
                p.Descricao,
                p.Vantagem,
                p.Disponivel,
                string.IsNullOrWhiteSpace(p.PlaceholderKey) ? $"char_{p.Id}" : p.PlaceholderKey
            ))
            .ToListAsync(cancellationToken);

        return Ok(personagens);
    }

    [HttpGet("slots")]
    public async Task<ActionResult<IEnumerable<CharacterSlotDto>>> GetSlots(CancellationToken cancellationToken)
    {
        var personagens = await _context.Personagens
            .OrderBy(p => p.Id)
            .ToListAsync(cancellationToken);

        if (personagens.Count == 0)
        {
            var fallbackSlots = new List<CharacterSlotDto>
            {
                new(1, "Explorador #1", true, "Disponível"),
                new(2, "Cartógrafo #2", true, "Disponível"),
                new(3, "Guardião #3", true, "Disponível")
            };
            return Ok(fallbackSlots);
        }

        var slots = personagens.Select(p => new CharacterSlotDto(
            p.Id,
            p.Nome,
            p.Disponivel,
            p.Disponivel ? (string.IsNullOrWhiteSpace(p.Vantagem) ? "Disponível" : p.Vantagem) : "Bloqueado"
        ));

        return Ok(slots);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Personagem>> GetPersonagem(int id, CancellationToken cancellationToken)
    {
        var personagem = await _context.Personagens.FindAsync([id], cancellationToken);

        if (personagem == null)
        {
            return NotFound(new { mensagem = "Personagem não encontrado!" });
        }

        return personagem;
    }
}
