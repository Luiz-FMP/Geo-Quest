using Microsoft.Asp.NetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Data;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Controllers{
    [Route("api/[controller]")]
    [ApiController]
    public class PersonagensController : ControllerBase
    {
        private readonly GeoQuestDbContext _context;

        public PersonagensController(GeoQuestDbContext context){
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Personagem>>> GetPersonagens(){
            return await _context.Personagens.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Personagem>> GetPersonagens(int id){
            var personagem = await _context.Personagens.FindAsync(id);

            if(personagem == null){
                return NotFound(new { mensagem = "Personagem não encontrado!" });
            }

            return personagem;
        }

        [HttpPost]
        public async Task<ActionResult<Personagem>> PostPersonagem(Personagem personagem){
            _context.Personagens.Add(personagem);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPersonagem), new { id = personagem.Id }, personagem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPersonagem(int id, Personagem personagem){
            if(id != personagem.Id){
                return BadRequest(new { mensagem = "O ID do personagem não corresponde a URL." });
            }

            _context.Entry(personagem).State = EntityState.Modified;

            tyr{
                await _context.SaveChangesAsync();
            }
            catch(DbUpdateConcurrencyException){
                if(!PersonagemExists(id)){
                    return NotFound(new { mensagem = "Personagem não encontrado!" });
                }
                else{
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete ("{id}")]
        public async Task<IActionResult> DeletePersonagem(int id){
            var personagem = await _context.Personagens.FindAsync(id);
            
            if(personagem == null){
                return NotFound(new { mensagem = "Personagem não encontrado!" });
            }

            _context.Personagens.Remove(personagem);
            await _context.SaveChangesAsync;

            return NoContent();
        }

        private bool PersonagemExists(int id){
            return _context.Personagens.Any(e => e.Id == id);
        }
    }
}