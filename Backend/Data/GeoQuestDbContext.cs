using GeoQuest.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GeoQuest.Api.Data;

public class GeoQuestDbContext : DbContext
{
    public GeoQuestDbContext(DbContextOptions<GeoQuestDbContext> options)
        : base(options)
    {
    }

    public DbSet<Jogador> Jogadores { get; set; }
    public DbSet<Personagem> Personagens { get; set; }
    public DbSet<Categoria> Categorias { get; set; }
    public DbSet<MissaoConcluida> MissoesConcluidas { get; set; }
    public DbSet<Cidade> Cidades { get; set; }
    public DbSet<Boss> Bosses { get; set; }
    public DbSet<Inimigo> Inimigos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Personagem>().HasData(
            new Personagem
            {
                Id = 1,
                Nome = "Miguel",
                Descricao = "Forte e resistente, aguenta vários combates.",
                Vida = 120,
                Ataque = 15,
                Defesa = 10,
                Vantagem = "Resistência a dano"
            },
            new Personagem
            {
                Id = 2,
                Nome = "Amélia",
                Descricao = "Frágil, mas causa muito dano.",
                Vida = 70,
                Ataque = 30,
                Defesa = 3,
                Vantagem = "Ataques únicos que causam muito dano."
            },
            new Personagem
            {
                Id = 3,
                Nome = "Benjamin",
                Descricao = "Resistente e ágil, consegue disparar varios golpes.",
                Vida = 100,
                Ataque = 10,
                Defesa = 7,
                Vantagem = "Múltiplos ataques."
            },
            new Personagem
            {
                Id = 4,
                Nome = "Z",
                Descricao = "Controle de área, explosões em área.",
                Vida = 75,
                Ataque = 20,
                Defesa = 5,
                Vantagem = "Dano em área."
            } 
        );
    }
}