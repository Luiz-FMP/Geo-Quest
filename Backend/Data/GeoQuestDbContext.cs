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
}
