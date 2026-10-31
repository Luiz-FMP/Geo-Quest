using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Data;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MissoesConcluidasController : ControllerBase
    {
        private readonly GeoQuestDbContext _context;

        public MissoesConcluidasController(GeoQuestDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MissaoConcluida>>> GetMissoesConcluidas()
        {
            return await _context.MissoesConcluidas
                .Include(m => m.Jogador)
                .Include(m => m.Categoria)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MissaoConcluida>> GetMissaoConcluida(int id)
        {
            var missaoConcluida = await _context.MissoesConcluidas
                .Include(m => m.Jogador)
                .Include(m => m.Categoria)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (missaoConcluida == null)
            {
                return NotFound(new { mensagem = "Registro de missão concluída não encontrado!" });
            }

            return missaoConcluida;
        }

        [HttpGet("jogador/{jogadorId}")]
        public async Task<ActionResult<IEnumerable<MissaoConcluida>>> GetMissoesPorJogador(int jogadorId)
        {
            var missoes = await _context.MissoesConcluidas
                .Include(m => m.Categoria)
                .Where(m => m.JogadorId == jogadorId)
                .OrderByDescending(m => m.DataConclusao)
                .ToListAsync();

            return missoes;
        }

        [HttpPost]
        public async Task<ActionResult<MissaoConcluida>> PostMissaoConcluida(MissaoConcluida missaoConcluida)
        {
            var jogadorExiste = await _context.Jogadores.AnyAsync(j => j.Id == missaoConcluida.JogadorId);
            if (!jogadorExiste)
            {
                return BadRequest(new { mensagem = "Jogador informado não existe!" });
            }

            var categoriaExiste = await _context.Categorias.AnyAsync(c => c.Id == missaoConcluida.CategoriaId);
            if (!categoriaExiste)
            {
                return BadRequest(new { mensagem = "Categoria informada não existe!" });
            }

            var jaConcluida = await _context.MissoesConcluidas.AnyAsync(m =>
                m.JogadorId == missaoConcluida.JogadorId &&
                m.GooglePlaceId == missaoConcluida.GooglePlaceId);

            if (jaConcluida)
            {
                return Conflict(new { mensagem = "Este local já foi registrado como concluído por este jogador!" });
            }

            if (missaoConcluida.DataConclusao == default)
            {
                missaoConcluida.DataConclusao = DateTime.UtcNow;
            }

            missaoConcluida.Jogador = null;
            missaoConcluida.Categoria = null;

            _context.MissoesConcluidas.Add(missaoConcluida);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMissaoConcluida), new { id = missaoConcluida.Id }, missaoConcluida);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMissaoConcluida(int id, MissaoConcluida missaoConcluida)
        {
            if (id != missaoConcluida.Id)
            {
                return BadRequest(new { mensagem = "O ID da missão concluída não corresponde à URL." });
            }

            _context.Entry(missaoConcluida).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MissaoConcluidaExists(id))
                {
                    return NotFound(new { mensagem = "Registro de missão concluída não encontrado!" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMissaoConcluida(int id)
        {
            var missaoConcluida = await _context.MissoesConcluidas.FindAsync(id);

            if (missaoConcluida == null)
            {
                return NotFound(new { mensagem = "Registro de missão concluída não encontrado!" });
            }

            _context.MissoesConcluidas.Remove(missaoConcluida);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MissaoConcluidaExists(int id)
        {
            return _context.MissoesConcluidas.Any(e => e.Id == id);
        }
    }
}