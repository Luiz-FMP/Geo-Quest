using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Data;

public class GeoQuestDbContext : DbContext
{
    public GeoQuestDbContext(DbContextOptions<GeoQuestDbContext> options) : base(options)
    {
    }

    public DbSet<Jogador> Jogadores => Set<Jogador>();
    public DbSet<Personagem> Personagens => Set<Personagem>();
    public DbSet<Cidade> Cidades => Set<Cidade>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<MissaoConcluida> MissoesConcluidas => Set<MissaoConcluida>();
    public DbSet<Inimigo> Inimigos => Set<Inimigo>();
    public DbSet<Boss> Bosses => Set<Boss>();
    public DbSet<ItemDefinicao> ItensDefinicoes => Set<ItemDefinicao>();
    public DbSet<ItemInventario> ItensInventario => Set<ItemInventario>();
    public DbSet<EstatisticaJogador> EstatisticasJogadores => Set<EstatisticaJogador>();
    public DbSet<BuffJogador> BuffsJogadores => Set<BuffJogador>();
    public DbSet<HistoricoVisitaPlace> HistoricoVisitasPlaces => Set<HistoricoVisitaPlace>();
    public DbSet<EstadoPermanentePlace> EstadosPermanentesPlaces => Set<EstadoPermanentePlace>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Personagem>().HasData(DatabaseInitializer.GetDefaultPersonagens());

        modelBuilder.Entity<Jogador>()
            .HasOne(j => j.Cidade)
            .WithMany(c => c.Jogadores)
            .HasForeignKey(j => j.CidadeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Jogador>()
            .HasOne(j => j.Personagem)
            .WithMany(p => p.Jogadores)
            .HasForeignKey(j => j.PersonagemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Jogador>()
            .HasOne(j => j.Estatistica)
            .WithOne(e => e.Jogador)
            .HasForeignKey<EstatisticaJogador>(e => e.JogadorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ItemInventario>()
            .HasOne(i => i.Jogador)
            .WithMany(j => j.Inventario)
            .HasForeignKey(i => i.JogadorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ItemInventario>()
            .HasOne(i => i.ItemDefinicao)
            .WithMany(d => d.ItensInventario)
            .HasForeignKey(i => i.ItemDefinicaoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BuffJogador>()
            .HasOne(b => b.Jogador)
            .WithMany(j => j.Buffs)
            .HasForeignKey(b => b.JogadorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HistoricoVisitaPlace>()
            .HasOne(h => h.Jogador)
            .WithMany(j => j.HistoricoVisitas)
            .HasForeignKey(h => h.JogadorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EstadoPermanentePlace>()
            .HasOne(e => e.Jogador)
            .WithMany(j => j.EstadosPermanentesPlaces)
            .HasForeignKey(e => e.JogadorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MissaoConcluida>()
            .HasOne(m => m.Jogador)
            .WithMany(j => j.MissoesConcluidas)
            .HasForeignKey(m => m.JogadorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MissaoConcluida>()
            .HasOne(m => m.Cidade)
            .WithMany(c => c.MissoesConcluidas)
            .HasForeignKey(m => m.CidadeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MissaoConcluida>()
            .HasOne(m => m.Categoria)
            .WithMany(cat => cat.MissoesConcluidas)
            .HasForeignKey(m => m.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
