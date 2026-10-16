using Microsoft.Asp.NetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Data;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Controllers{
    [Route("api/[controller]")]
    [ApiController]
    public class InimigosController : ControllerBase
    {
        private readonly GeoQuestDbContext _context;

        public InimigosController(GeoQuestDbContext context){
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Inimigo>>> GetInimigos(){
            return await _context.Inimigos.ToListAsync();
        }

        [HttepGet("{id}")]
        public async Task<ActionResult<Inimigo>> GetInimigos(int id){
            var inimigo = await _context.Inimigos.ToListAsync(id);

            if(inimigo == null){
                return NotFound(new { mensagem = "Inimigo não encontrado!" });
            }

            return inimigo;
        }

        [HttpPost]
        public async Task<ActionResult<Inimigo>> PostInimigos(Inimigo inimigo){
            _context.Inimigos.Add(inimigo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInimigos), new { id = inimigo.Id }, inimigo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutInimigo(int id, Inimigo inimigo){
            if(id != personagem.Id){
                return BadRequest(new { mensagem = "O ID do personagem não corresponde a URL." });
            }

            _context.Entry(inimigo).State = EntityState.Modified;

            try{
                await _context.SaveChangesAsync();
            }
            catch(DbUpdateConcurrencyException){
                if(!InimigoExists(id)){
                    return NotFound(new { mensagem = "Inimigo não encontrado!" });
                }
                else{
                    throw;
                }

                return NoContent();
            }
        }

        [HttpDelete ("{id}")]
        public async Task<IActionResult> DeleteInimigo(int id){
            var personagem = await _context.Inimigos.FindAsync(id);
            
            if(personagem == null){
                return NotFound(new { mensagem = "Personagem não encontrado!" });
            }

            _context.Inimigos.Remove(inimigo);
            await _context.SaveChangesAsync;

            return NoContent();
        }

        private bool InimigoExists(int id){
            return _context.Inimigos.Any(e => e.Id == id);
        }
    }
}