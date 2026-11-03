using GeoQuest.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GeoQuest.Api.Data;

public static class DatabaseInitializer
{
    public const string CodigoItemDebug = "debug_item_01";

    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GeoQuestDbContext>();

        await EnsureDatabaseSchemaAsync(context);
        await SeedDataAsync(context);
    }

    private static async Task EnsureDatabaseSchemaAsync(GeoQuestDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        try
        {
            // Verifica se as novas tabelas/colunas estão presentes no arquivo SQLite existente
            _ = await context.ItensDefinicao.AnyAsync();
            _ = await context.ItensInventario.AnyAsync();
            _ = await context.BuffsJogador.AnyAsync();
            _ = await context.EstatisticasJogador.AnyAsync();
            _ = await context.Jogadores.OrderBy(j => j.Id).Select(j => j.VidaBase).FirstOrDefaultAsync();
            _ = await context.Personagens.OrderBy(p => p.Id).Select(p => p.PlaceholderKey).FirstOrDefaultAsync();
        }
        catch
        {
            // Caso exista um banco antigo de etapa anterior sem as tabelas do sistema de jogador, recria o schema
            await context.Database.EnsureDeletedAsync();
            await context.Database.EnsureCreatedAsync();
        }
    }

    private static async Task SeedDataAsync(GeoQuestDbContext context)
    {
        if (!await context.Personagens.AnyAsync())
        {
            var personagens = new List<Personagem>
            {
                new()
                {
                    Id = 1,
                    Nome = "Explorador #1",
                    Descricao = "Especialista em trilhas urbanas e reconhecimento de rotas.",
                    Vida = 50,
                    Ataque = 10,
                    Defesa = 0,
                    Vantagem = "Equilibrado",
                    Disponivel = true,
                    PlaceholderKey = "char_1"
                },
                new()
                {
                    Id = 2,
                    Nome = "Cartógrafo #2",
                    Descricao = "Focado em mapeamento tático de pontos históricos e culturais.",
                    Vida = 50,
                    Ataque = 10,
                    Defesa = 0,
                    Vantagem = "Reconhecimento",
                    Disponivel = true,
                    PlaceholderKey = "char_2"
                },
                new()
                {
                    Id = 3,
                    Nome = "Guardião #3",
                    Descricao = "Preparado para expedições longas e defesa de territórios.",
                    Vida = 50,
                    Ataque = 10,
                    Defesa = 0,
                    Vantagem = "Resistência",
                    Disponivel = true,
                    PlaceholderKey = "char_3"
                }
            };

            context.Personagens.AddRange(personagens);
            await context.SaveChangesAsync();
        }
        else
        {
            // Garante que todos os 3 personagens iniciais estejam disponíveis para seleção/troca
            var existentes = await context.Personagens.ToListAsync();
            bool alterou = false;
            foreach (var p in existentes)
            {
                if (!p.Disponivel)
                {
                    p.Disponivel = true;
                    alterou = true;
                }
                if (string.IsNullOrWhiteSpace(p.PlaceholderKey))
                {
                    p.PlaceholderKey = $"char_{p.Id}";
                    alterou = true;
                }
            }

            if (existentes.Count < 3)
            {
                if (existentes.All(p => p.Id != 2))
                {
                    context.Personagens.Add(new Personagem
                    {
                        Id = 2,
                        Nome = "Cartógrafo #2",
                        Descricao = "Focado em mapeamento tático de pontos históricos e culturais.",
                        Vida = 50,
                        Ataque = 10,
                        Defesa = 0,
                        Vantagem = "Reconhecimento",
                        Disponivel = true,
                        PlaceholderKey = "char_2"
                    });
                    alterou = true;
                }
                if (existentes.All(p => p.Id != 3))
                {
                    context.Personagens.Add(new Personagem
                    {
                        Id = 3,
                        Nome = "Guardião #3",
                        Descricao = "Preparado para expedições longas e defesa de territórios.",
                        Vida = 50,
                        Ataque = 10,
                        Defesa = 0,
                        Vantagem = "Resistência",
                        Disponivel = true,
                        PlaceholderKey = "char_3"
                    });
                    alterou = true;
                }
            }

            if (alterou)
            {
                await context.SaveChangesAsync();
            }
        }

        // Garante que a definição do Item de Debug exista
        var itemDebugDef = await context.ItensDefinicao
            .FirstOrDefaultAsync(i => i.Codigo == CodigoItemDebug);

        if (itemDebugDef is null)
        {
            itemDebugDef = new ItemDefinicao
            {
                Codigo = CodigoItemDebug,
                Nome = "Item de Debug",
                Descricao = "Item temporário de teste para validar movimentação nos slots e descarte na lixeira.",
                Categoria = CategoriasItem.Equipavel,
                Raridade = RaridadesItem.Raro,
                Equipavel = false,
                SlotEquipamentoCompativel = null,
                BonusVida = 0,
                BonusEnergia = 0,
                BonusDano = 0,
                BonusDefesa = 0,
                BonusVelocidade = 0,
                PlaceholderKey = "item_debug"
            };

            context.ItensDefinicao.Add(itemDebugDef);
            await context.SaveChangesAsync();
        }

        // Garante que o jogador local exista
        var jogadorLocal = await context.Jogadores
            .Include(j => j.Estatisticas)
            .Include(j => j.ItensInventario)
            .OrderBy(j => j.Id)
            .FirstOrDefaultAsync();

        if (jogadorLocal is null)
        {
            jogadorLocal = new Jogador
            {
                Nome = "Explorador",
                PersonagemId = 1,
                DataCriacao = DateTime.UtcNow,
                VidaBase = 50,
                VidaAtual = 50,
                EnergiaBase = 100.0,
                EnergiaAtual = 100.0,
                DanoBase = 10,
                DefesaBase = 0,
                VelocidadeBase = 0
            };

            context.Jogadores.Add(jogadorLocal);
            await context.SaveChangesAsync();

            var estatisticas = new EstatisticaJogador
            {
                JogadorId = jogadorLocal.Id,
                DistanciaPercorridaKm = 0.0,
                PlacesVisitados = 0,
                MissoesConcluidas = 0,
                ItensObtidos = 1,
                ItensDescartados = 0,
                UltimaAtualizacaoUtc = DateTime.UtcNow
            };

            var itemInicial = new ItemInventario
            {
                JogadorId = jogadorLocal.Id,
                ItemDefinicaoId = itemDebugDef.Id,
                CategoriaAba = itemDebugDef.Categoria,
                SlotIndice = 0,
                Equipado = false,
                SlotEquipado = null,
                Quantidade = 1,
                DataObtencaoUtc = DateTime.UtcNow
            };

            context.EstatisticasJogador.Add(estatisticas);
            context.ItensInventario.Add(itemInicial);
            await context.SaveChangesAsync();
        }
        else if (jogadorLocal.Estatisticas is null)
        {
            context.EstatisticasJogador.Add(new EstatisticaJogador
            {
                JogadorId = jogadorLocal.Id,
                DistanciaPercorridaKm = 0.0,
                PlacesVisitados = 0,
                MissoesConcluidas = 0,
                ItensObtidos = jogadorLocal.ItensInventario.Count,
                ItensDescartados = 0,
                UltimaAtualizacaoUtc = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }
    }
}

