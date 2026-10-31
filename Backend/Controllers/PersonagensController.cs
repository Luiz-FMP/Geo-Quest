using GeoQuest.Api.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonagensController : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<CharacterSlotDto>> GetSlots()
    {
        var slots = new List<CharacterSlotDto>
        {
            new(1, "Explorador Urbano", true, "Disponível"),
            new(2, "Personagem 2", false, "Bloqueado (Em breve)"),
            new(3, "Personagem 3", false, "Bloqueado (Em breve)")
        };

        return Ok(slots);
    }
}

