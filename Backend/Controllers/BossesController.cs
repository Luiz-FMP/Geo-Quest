using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Data;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BossesController : ControllerBase
    {
        private readonly GeoQuestDbContext _context;

        public BossesController(GeoQuestDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Boss>>> GetBosses()
        {
            return await _context.Bosses.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Boss>> GetBoss(int id)
        {
            var boss = await _context.Bosses.FindAsync(id);

            if (boss == null)
            {
                return NotFound(new { mensagem = "Boss não encontrado!" });
            }

            return boss;
        }

        [HttpPost]
        public async Task<ActionResult<Boss>> PostBoss(Boss boss)
        {
            _context.Bosses.Add(boss);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBoss), new { id = boss.Id }, boss);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutBoss(int id, Boss boss)
        {
            if (id != boss.Id)
            {
                return BadRequest(new { mensagem = "O ID do boss não corresponde à URL." });
            }

            _context.Entry(boss).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BossExists(id))
                {
                    return NotFound(new { mensagem = "Boss não encontrado!" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBoss(int id)
        {
            var boss = await _context.Bosses.FindAsync(id);

            if (boss == null)
            {
                return NotFound(new { mensagem = "Boss não encontrado!" });
            }

            _context.Bosses.Remove(boss);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BossExists(int id)
        {
            return _context.Bosses.Any(e => e.Id == id);
        }
    }
}