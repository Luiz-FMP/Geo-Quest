using Microsoft.AspNetCore.Mvc;
using GeoQuest.Api.Data;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusController : ControllerBase
{
    private readonly GeoQuestDbContext _context;

    public StatusController(GeoQuestDbContext context){
        _context = context;
    }

    [HttpGet]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            status = "Online",
            service = "GeoQuest.Api",
            timestamp = DateTime.UtcNow
        });
    }
}
