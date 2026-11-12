using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Data;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonagensController : ControllerBase
{
    private readonly GeoQuestDbContext _context;

    public PersonagensController(GeoQuestDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Personagem>>> GetAll()
    {
        var personagens = await _context.Personagens
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .ToListAsync();
        return Ok(personagens);
    }
}
