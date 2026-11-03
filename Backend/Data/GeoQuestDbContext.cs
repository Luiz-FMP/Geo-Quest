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
    public DbSet<ItemDefinicao> ItensDefinicao { get; set; }
    public DbSet<ItemInventario> ItensInventario { get; set; }
    public DbSet<BuffJogador> BuffsJogador { get; set; }
    public DbSet<EstatisticaJogador> EstatisticasJogador { get; set; }
    public DbSet<Categoria> Categorias { get; set; }
    public DbSet<MissaoConcluida> MissoesConcluidas { get; set; }
    public DbSet<Cidade> Cidades { get; set; }
    public DbSet<Boss> Bosses { get; set; }
    public DbSet<Inimigo> Inimigos { get; set; }
    public DbSet<EstadoPermanentePlace> EstadosPlaces { get; set; }
    public DbSet<HistoricoVisitaPlace> HistoricoVisitas { get; set; }

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
                Vantagem = "Resistência a dano",
                Disponivel = true,
                PlaceholderKey = "char_1"
            },
            new Personagem
            {
                Id = 2,
                Nome = "Amélia",
                Descricao = "Frágil, mas causa muito dano.",
                Vida = 70,
                Ataque = 30,
                Defesa = 3,
                Vantagem = "Ataques únicos que causam muito dano.",
                Disponivel = true,
                PlaceholderKey = "char_2"
            },
            new Personagem
            {
                Id = 3,
                Nome = "Benjamin",
                Descricao = "Resistente e ágil, consegue disparar varios golpes.",
                Vida = 100,
                Ataque = 10,
                Defesa = 7,
                Vantagem = "Múltiplos ataques.",
                Disponivel = true,
                PlaceholderKey = "char_3"
            },
            new Personagem
            {
                Id = 4,
                Nome = "Z",
                Descricao = "Controle de área, explosões em área.",
                Vida = 75,
                Ataque = 20,
                Defesa = 5,
                Vantagem = "Dano em área.",
                Disponivel = true,
                PlaceholderKey = "char_4"
            }
        );

        modelBuilder.Entity<Jogador>(entity =>
        {
            entity.HasOne(j => j.Personagem)
                .WithMany(p => p.Jogadores)
                .HasForeignKey(j => j.PersonagemId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(j => j.Estatisticas)
                .WithOne(e => e.Jogador)
                .HasForeignKey<EstatisticaJogador>(e => e.JogadorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ItemInventario>(entity =>
        {
            entity.HasOne(i => i.Jogador)
                .WithMany(j => j.ItensInventario)
                .HasForeignKey(i => i.JogadorId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.ItemDefinicao)
                .WithMany()
                .HasForeignKey(i => i.ItemDefinicaoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BuffJogador>(entity =>
        {
            entity.HasOne(b => b.Jogador)
                .WithMany(j => j.Buffs)
                .HasForeignKey(b => b.JogadorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EstadoPermanentePlace>(entity =>
        {
            entity.HasIndex(e => new { e.JogadorId, e.PlaceId })
                .IsUnique();

            entity.HasOne(e => e.Jogador)
                .WithMany(j => j.EstadosPlaces)
                .HasForeignKey(e => e.JogadorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HistoricoVisitaPlace>(entity =>
        {
            entity.HasIndex(h => new { h.JogadorId, h.Categoria, h.DataVisitaUtc });

            entity.HasOne(h => h.Jogador)
                .WithMany(j => j.HistoricoVisitas)
                .HasForeignKey(h => h.JogadorId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
