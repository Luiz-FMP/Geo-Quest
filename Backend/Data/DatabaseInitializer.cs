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
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN Moedas INTEGER NOT NULL DEFAULT 0;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN HomeLatitude REAL NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN HomeLongitude REAL NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN PosicaoAtualLatitude REAL NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN PosicaoAtualLongitude REAL NULL;");

            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointVidaPlaceId TEXT NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointVidaNome TEXT NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointVidaCategoria TEXT NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointVidaSubcategoria TEXT NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointVidaLatitude REAL NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointVidaLongitude REAL NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointVidaDataUtc TEXT NULL;");

            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointEnergiaPlaceId TEXT NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointEnergiaNome TEXT NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointEnergiaCategoria TEXT NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointEnergiaSubcategoria TEXT NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointEnergiaLatitude REAL NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointEnergiaLongitude REAL NULL;");
            await EnsureColumnAsync(context, "ALTER TABLE Jogadores ADD COLUMN CheckpointEnergiaDataUtc TEXT NULL;");

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS EstadosPlaces (
                    Id INTEGER NOT NULL CONSTRAINT PK_EstadosPlaces PRIMARY KEY AUTOINCREMENT,
                    JogadorId INTEGER NOT NULL,
                    PlaceId TEXT NOT NULL,
                    Nome TEXT NOT NULL,
                    Categoria TEXT NOT NULL,
                    Subcategoria TEXT NOT NULL,
                    Latitude REAL NOT NULL DEFAULT 0,
                    Longitude REAL NOT NULL DEFAULT 0,
                    Concluido INTEGER NOT NULL DEFAULT 0,
                    CuraGratuitaUtilizada INTEGER NOT NULL DEFAULT 0,
                    LojaEsgotada INTEGER NOT NULL DEFAULT 0,
                    EstoqueJson TEXT NULL,
                    PrimeiraVisitaUtc TEXT NOT NULL,
                    UltimaAtualizacaoUtc TEXT NOT NULL,
                    CONSTRAINT FK_EstadosPlaces_Jogadores_JogadorId FOREIGN KEY (JogadorId) REFERENCES Jogadores (Id) ON DELETE CASCADE
                );
            ");

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE UNIQUE INDEX IF NOT EXISTS IX_EstadosPlaces_JogadorId_PlaceId
                ON EstadosPlaces (JogadorId, PlaceId);
            ");

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS HistoricoVisitas (
                    Id INTEGER NOT NULL CONSTRAINT PK_HistoricoVisitas PRIMARY KEY AUTOINCREMENT,
                    JogadorId INTEGER NOT NULL,
                    PlaceId TEXT NOT NULL,
                    Nome TEXT NOT NULL,
                    Categoria TEXT NOT NULL,
                    Subcategoria TEXT NOT NULL,
                    Latitude REAL NOT NULL DEFAULT 0,
                    Longitude REAL NOT NULL DEFAULT 0,
                    DataVisitaUtc TEXT NOT NULL,
                    EstadoInteracao TEXT NOT NULL,
                    Concluido INTEGER NOT NULL DEFAULT 0,
                    BeneficioGratuitoResgatado INTEGER NOT NULL DEFAULT 0,
                    CONSTRAINT FK_HistoricoVisitas_Jogadores_JogadorId FOREIGN KEY (JogadorId) REFERENCES Jogadores (Id) ON DELETE CASCADE
                );
            ");

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE INDEX IF NOT EXISTS IX_HistoricoVisitas_JogadorId_Categoria_DataVisitaUtc
                ON HistoricoVisitas (JogadorId, Categoria, DataVisitaUtc);
            ");

            // Verifica se todas as tabelas/colunas estão presentes no arquivo SQLite
            _ = await context.ItensDefinicao.AnyAsync();
            _ = await context.ItensInventario.AnyAsync();
            _ = await context.BuffsJogador.AnyAsync();
            _ = await context.EstatisticasJogador.AnyAsync();
            _ = await context.Jogadores.OrderBy(j => j.Id).Select(j => j.HomeLatitude).FirstOrDefaultAsync();
            _ = await context.Jogadores.OrderBy(j => j.Id).Select(j => j.CheckpointVidaPlaceId).FirstOrDefaultAsync();
            _ = await context.Jogadores.OrderBy(j => j.Id).Select(j => j.CheckpointEnergiaPlaceId).FirstOrDefaultAsync();
            _ = await context.Personagens.OrderBy(p => p.Id).Select(p => p.PlaceholderKey).FirstOrDefaultAsync();
            _ = await context.Personagens.OrderBy(p => p.Id).Select(p => p.Velocidade).FirstOrDefaultAsync();
            _ = await context.Personagens.OrderBy(p => p.Id).Select(p => p.Energia).FirstOrDefaultAsync();
            _ = await context.Inimigos.OrderBy(i => i.Id).Select(i => i.Velocidade).FirstOrDefaultAsync();
            _ = await context.Bosses.OrderBy(b => b.Id).Select(b => b.Velocidade).FirstOrDefaultAsync();
            _ = await context.EstadosPlaces.AnyAsync();
            _ = await context.HistoricoVisitas.AnyAsync();
        }
        catch
        {
            await context.Database.EnsureDeletedAsync();
            await context.Database.EnsureCreatedAsync();
        }
    }

    private static async Task EnsureColumnAsync(
        GeoQuestDbContext context,
        string alterSql)
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync(alterSql);
        }
        catch
        {
            // Coluna já existe
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
                    Velocidade = 12,
                    Energia = 100,
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
                    Velocidade = 14,
                    Energia = 100,
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
                    Velocidade = 10,
                    Energia = 100,
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
                        Velocidade = 14,
                        Energia = 100,
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
                        Velocidade = 10,
                        Energia = 100,
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

        if (!await context.Inimigos.AnyAsync())
        {
            context.Inimigos.AddRange(
                new Inimigo
                {
                    Nome = "Batedor Urbano",
                    Descricao = "Oponente encontrado durante o deslocamento pelas rotas da cidade.",
                    Vida = 30,
                    Ataque = 6,
                    Defesa = 1,
                    Velocidade = 10
                },
                new Inimigo
                {
                    Nome = "Desafiante da Arena",
                    Descricao = "Combatente preparado para disputas em locais de entretenimento e recreação.",
                    Vida = 40,
                    Ataque = 8,
                    Defesa = 2,
                    Velocidade = 12
                },
                new Inimigo
                {
                    Nome = "Vigia das Ruas",
                    Descricao = "Inimigo ágil que patrulha trajetos movimentados.",
                    Vida = 35,
                    Ataque = 7,
                    Defesa = 1,
                    Velocidade = 14
                }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.Cidades.AnyAsync())
        {
            context.Cidades.Add(new Cidade
            {
                Id = 1,
                Nome = "Curitiba",
                Estado = "PR",
                Pais = "Brasil"
            });
            await context.SaveChangesAsync();
        }

        if (!await context.Bosses.AnyAsync())
        {
            var cidadePadrao = await context.Cidades.OrderBy(c => c.Id).FirstAsync();
            context.Bosses.Add(new Boss
            {
                Nome = "Guardião do Shopping",
                Vida = 60,
                Ataque = 9,
                Defesa = 2,
                Velocidade = 9,
                CidadeId = cidadePadrao.Id
            });
            await context.SaveChangesAsync();
        }

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
                VelocidadeBase = 0,
                Moedas = 0
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
