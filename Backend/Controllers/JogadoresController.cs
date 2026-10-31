using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Data;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JogadoresController : ControllerBase
    {
        private readonly GeoQuestDbContext _context;

        public JogadoresController(GeoQuestDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Jogador>>> GetJogadores()
        {
            return await _context.Jogadores.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Jogador>> GetJogador(int id)
        {
            var jogador = await _context.Jogadores.FindAsync(id);

            if (jogador == null)
            {
                return NotFound(new { mensagem = "Jogador não encontrado!" });
            }

            return jogador;
        }

        [HttpPost]
        public async Task<ActionResult<Jogador>> PostJogador(Jogador jogador)
        {
            _context.Jogadores.Add(jogador);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJogador), new { id = jogador.Id }, jogador);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutJogador(int id, Jogador jogador)
        {
            if (id != jogador.Id)
            {
                return BadRequest(new { mensagem = "O ID do jogador não corresponde à URL." });
            }

            _context.Entry(jogador).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!JogadorExists(id))
                {
                    return NotFound(new { mensagem = "Jogador não encontrado!" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJogador(int id)
        {
            var jogador = await _context.Jogadores.FindAsync(id);

            if (jogador == null)
            {
                return NotFound(new { mensagem = "Jogador não encontrado!" });
            }

            _context.Jogadores.Remove(jogador);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool JogadorExists(int id)
        {
            return _context.Jogadores.Any(e => e.Id == id);
        }
    }
}