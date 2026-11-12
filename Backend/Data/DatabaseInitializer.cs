using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Data;

public static class DatabaseInitializer
{
    public static Personagem[] GetDefaultPersonagens() =>
    [
        new Personagem
        {
            Id = 1,
            Nome = "Miguel",
            Descricao = "Especialista em trilhas urbanas",
            Vantagem = "Dano Crítico Único",
            PlaceholderKey = "char_1",
            Disponivel = true,
            VidaBase = 120,
            EnergiaBase = 100,
            AtaqueBase = 18,
            DefesaBase = 10,
            VelocidadeBase = 14
        },
        new Personagem
        {
            Id = 2,
            Nome = "Amélia",
            Descricao = "Cartógrafa de rotas históricas",
            Vantagem = "Ataque Veloz e Preciso",
            PlaceholderKey = "char_2",
            Disponivel = true,
            VidaBase = 100,
            EnergiaBase = 120,
            AtaqueBase = 15,
            DefesaBase = 8,
            VelocidadeBase = 18
        },
        new Personagem
        {
            Id = 3,
            Nome = "Benjamin",
            Descricao = "Caçador de marcos culturais",
            Vantagem = "Postura de Ferro",
            PlaceholderKey = "char_3",
            Disponivel = true,
            VidaBase = 150,
            EnergiaBase = 80,
            AtaqueBase = 20,
            DefesaBase = 16,
            VelocidadeBase = 8
        },
        new Personagem
        {
            Id = 4,
            Nome = "Z",
            Descricao = "Viajante de fronteiras naturais",
            Vantagem = "Dano em Área (Todos os Inimigos)",
            PlaceholderKey = "char_4",
            Disponivel = true,
            VidaBase = 95,
            EnergiaBase = 150,
            AtaqueBase = 24,
            DefesaBase = 7,
            VelocidadeBase = 12
        }
    ];

    public static ItemDefinicao CreateDebugSwordDefinition() => new()
    {
        Codigo = "debug_espada_ferro",
        Nome = "Espada de Ferro (Debug)",
        Descricao = "Item inicial de teste criado para validar a mochila 5x10, persistência no SQLite e descarte na lixeira.",
        Categoria = "Equipavel",
        Raridade = "Comum",
        SlotEquipamentoCompativel = "Arma",
        PlaceholderKey = "item_debug_sword",
        BonusVida = 0,
        BonusEnergia = 0,
        BonusDano = 5,
        BonusDefesa = 0,
        BonusVelocidade = 0,
        ValorCompra = 10
    };

    public static async Task EnsureSchemaUpgradesAsync(GeoQuestDbContext context)
    {
        var tableCommands = new[]
        {
            @"CREATE TABLE IF NOT EXISTS ""ItensDefinicoes"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ItensDefinicoes"" PRIMARY KEY AUTOINCREMENT,
                ""Codigo"" TEXT NOT NULL,
                ""Nome"" TEXT NOT NULL,
                ""Descricao"" TEXT NOT NULL,
                ""Categoria"" TEXT NOT NULL,
                ""Raridade"" TEXT NOT NULL,
                ""SlotEquipamentoCompativel"" TEXT NULL,
                ""PlaceholderKey"" TEXT NOT NULL,
                ""BonusVida"" INTEGER NOT NULL DEFAULT 0,
                ""BonusEnergia"" INTEGER NOT NULL DEFAULT 0,
                ""BonusDano"" INTEGER NOT NULL DEFAULT 0,
                ""BonusDefesa"" INTEGER NOT NULL DEFAULT 0,
                ""BonusVelocidade"" INTEGER NOT NULL DEFAULT 0,
                ""ValorCompra"" INTEGER NOT NULL DEFAULT 0
            );",
            @"CREATE TABLE IF NOT EXISTS ""ItensInventario"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ItensInventario"" PRIMARY KEY AUTOINCREMENT,
                ""JogadorId"" INTEGER NOT NULL,
                ""ItemDefinicaoId"" INTEGER NOT NULL,
                ""Quantidade"" INTEGER NOT NULL DEFAULT 1,
                ""SlotIndice"" INTEGER NOT NULL DEFAULT 0,
                ""CategoriaAba"" TEXT NOT NULL DEFAULT 'Equipavel',
                ""Equipado"" INTEGER NOT NULL DEFAULT 0,
                ""SlotEquipado"" TEXT NULL,
                ""ObtidoEmUtc"" TEXT NOT NULL
            );",
            @"CREATE TABLE IF NOT EXISTS ""EstatisticasJogadores"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_EstatisticasJogadores"" PRIMARY KEY AUTOINCREMENT,
                ""JogadorId"" INTEGER NOT NULL UNIQUE,
                ""DistanciaPercorridaKm"" REAL NOT NULL DEFAULT 0,
                ""PlacesVisitados"" INTEGER NOT NULL DEFAULT 0,
                ""MissoesConcluidasCount"" INTEGER NOT NULL DEFAULT 0,
                ""ItensObtidos"" INTEGER NOT NULL DEFAULT 0,
                ""ItensDescartados"" INTEGER NOT NULL DEFAULT 0,
                ""UltimaAtualizacaoUtc"" TEXT NOT NULL
            );",
            @"CREATE TABLE IF NOT EXISTS ""BuffsJogadores"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_BuffsJogadores"" PRIMARY KEY AUTOINCREMENT,
                ""JogadorId"" INTEGER NOT NULL,
                ""Codigo"" TEXT NOT NULL,
                ""Nome"" TEXT NOT NULL,
                ""Descricao"" TEXT NOT NULL,
                ""PlaceholderKey"" TEXT NOT NULL,
                ""BonusVida"" INTEGER NOT NULL DEFAULT 0,
                ""BonusEnergia"" INTEGER NOT NULL DEFAULT 0,
                ""BonusDano"" INTEGER NOT NULL DEFAULT 0,
                ""BonusDefesa"" INTEGER NOT NULL DEFAULT 0,
                ""BonusVelocidade"" INTEGER NOT NULL DEFAULT 0,
                ""Ativo"" INTEGER NOT NULL DEFAULT 1,
                ""ExpiraEmUtc"" TEXT NULL
            );",
            @"CREATE TABLE IF NOT EXISTS ""HistoricoVisitasPlaces"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_HistoricoVisitasPlaces"" PRIMARY KEY AUTOINCREMENT,
                ""JogadorId"" INTEGER NOT NULL,
                ""PlaceId"" TEXT NOT NULL,
                ""Nome"" TEXT NOT NULL,
                ""Categoria"" TEXT NOT NULL,
                ""Subcategoria"" TEXT NOT NULL,
                ""Latitude"" REAL NOT NULL DEFAULT 0,
                ""Longitude"" REAL NOT NULL DEFAULT 0,
                ""EstadoInteracao"" TEXT NOT NULL DEFAULT 'Visitado',
                ""Concluido"" INTEGER NOT NULL DEFAULT 0,
                ""BeneficioGratuitoResgatado"" INTEGER NOT NULL DEFAULT 0,
                ""VisitadoEmUtc"" TEXT NOT NULL
            );",
            @"CREATE TABLE IF NOT EXISTS ""EstadosPermanentesPlaces"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_EstadosPermanentesPlaces"" PRIMARY KEY AUTOINCREMENT,
                ""JogadorId"" INTEGER NOT NULL,
                ""PlaceId"" TEXT NOT NULL,
                ""Nome"" TEXT NOT NULL,
                ""Categoria"" TEXT NOT NULL,
                ""Subcategoria"" TEXT NOT NULL,
                ""Latitude"" REAL NOT NULL DEFAULT 0,
                ""Longitude"" REAL NOT NULL DEFAULT 0,
                ""Concluido"" INTEGER NOT NULL DEFAULT 0,
                ""BeneficioGratuitoResgatado"" INTEGER NOT NULL DEFAULT 0,
                ""AtributoBuffFixo"" TEXT NULL,
                ""AtualizadoEmUtc"" TEXT NOT NULL
            );"
        };

        foreach (var cmd in tableCommands)
        {
            await context.Database.ExecuteSqlRawAsync(cmd);
        }

        var alterColumnCommands = new[]
        {
            @"ALTER TABLE ""Personagens"" ADD COLUMN ""Descricao"" TEXT NOT NULL DEFAULT '';",
            @"ALTER TABLE ""Personagens"" ADD COLUMN ""PlaceholderKey"" TEXT NOT NULL DEFAULT 'char_1';",
            @"ALTER TABLE ""Personagens"" ADD COLUMN ""Disponivel"" INTEGER NOT NULL DEFAULT 1;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""VidaBase"" INTEGER NOT NULL DEFAULT 50;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""VidaAtual"" INTEGER NOT NULL DEFAULT 50;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""EnergiaBase"" INTEGER NOT NULL DEFAULT 100;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""EnergiaAtual"" REAL NOT NULL DEFAULT 100;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""DanoBase"" INTEGER NOT NULL DEFAULT 10;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""DefesaBase"" INTEGER NOT NULL DEFAULT 0;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""VelocidadeBase"" INTEGER NOT NULL DEFAULT 0;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""PersonagemId"" INTEGER NOT NULL DEFAULT 1;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""HomeLatitude"" REAL NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""HomeLongitude"" REAL NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointVidaPlaceId"" TEXT NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointVidaNome"" TEXT NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointVidaSubcategoria"" TEXT NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointVidaLatitude"" REAL NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointVidaLongitude"" REAL NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointEnergiaPlaceId"" TEXT NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointEnergiaNome"" TEXT NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointEnergiaSubcategoria"" TEXT NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointEnergiaLatitude"" REAL NULL;",
            @"ALTER TABLE ""Jogadores"" ADD COLUMN ""CheckpointEnergiaLongitude"" REAL NULL;",
            @"ALTER TABLE ""EstadosPermanentesPlaces"" ADD COLUMN ""AtributoBuffFixo"" TEXT NULL;"
        };

        foreach (var alterSql in alterColumnCommands)
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(alterSql);
            }
            catch
            {
            }
        }
    }

    public static async Task SeedDataAsync(GeoQuestDbContext context)
    {
        await EnsureSchemaUpgradesAsync(context);

        foreach (var def in GetDefaultPersonagens())
        {
            var existing = await context.Personagens.FirstOrDefaultAsync(p => p.Id == def.Id);
            if (existing == null)
            {
                context.Personagens.Add(def);
            }
            else
            {
                existing.Nome = def.Nome;
                existing.Descricao = def.Descricao;
                existing.Vantagem = def.Vantagem;
                existing.PlaceholderKey = def.PlaceholderKey;
                existing.Disponivel = true;
            }
        }
        await context.SaveChangesAsync();

        Cidade? cidadePadrao = await context.Cidades.FirstOrDefaultAsync();
        if (cidadePadrao == null)
        {
            cidadePadrao = new Cidade
            {
                Nome = "Curitiba",
                Estado = "PR",
                Pais = "Brasil"
            };
            context.Cidades.Add(cidadePadrao);
            await context.SaveChangesAsync();
        }

        if (!await context.Categorias.AnyAsync())
        {
            context.Categorias.AddRange(
                new Categoria { Nome = "Arena (Parques e Praças)", Descricao = "Combates em 3 rondas com Mini-Boss" },
                new Categoria { Nome = "Shopping (Malls)", Descricao = "Batalhas contra Bosses soberanos" },
                new Categoria { Nome = "Restaurantes e Cafés", Descricao = "Pontos de recuperação e missões urbanas" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.Inimigos.AnyAsync())
        {
            context.Inimigos.AddRange(
                new Inimigo { Nome = "Rato de Bueiro", Vida = 35, Energia = 20, Ataque = 8, Defesa = 3, Velocidade = 14, RecompensaXP = 20, CategoriaPlace = "Rua", Tier = "Normal" },
                new Inimigo { Nome = "Pombo Mutante", Vida = 40, Energia = 30, Ataque = 10, Defesa = 4, Velocidade = 16, RecompensaXP = 25, CategoriaPlace = "Parque", Tier = "Normal" },
                new Inimigo { Nome = "Drone Desgovernado", Vida = 50, Energia = 50, Ataque = 13, Defesa = 6, Velocidade = 12, RecompensaXP = 30, CategoriaPlace = "Urbano", Tier = "Normal" },
                new Inimigo { Nome = "Cão de Guarda Mecânico", Vida = 58, Energia = 40, Ataque = 15, Defesa = 8, Velocidade = 11, RecompensaXP = 35, CategoriaPlace = "Parque", Tier = "Normal" },
                new Inimigo { Nome = "Guardião do Bosque", Vida = 115, Energia = 70, Ataque = 21, Defesa = 12, Velocidade = 10, RecompensaXP = 85, CategoriaPlace = "Parque", Tier = "MiniBoss" },
                new Inimigo { Nome = "Golem de Calçada", Vida = 130, Energia = 60, Ataque = 23, Defesa = 15, Velocidade = 7, RecompensaXP = 95, CategoriaPlace = "Praça", Tier = "MiniBoss" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.Bosses.AnyAsync())
        {
            context.Bosses.AddRange(
                new Boss { Nome = "Titã do Shopping", Vida = 240, Energia = 120, Ataque = 28, Defesa = 16, Velocidade = 9, RecompensaXP = 250, TipoPlace = "Shopping Mall", Tier = "Boss" },
                new Boss { Nome = "Soberano do Consumo", Vida = 270, Energia = 150, Ataque = 32, Defesa = 18, Velocidade = 11, RecompensaXP = 300, TipoPlace = "Shopping Mall", Tier = "Boss" }
            );
            await context.SaveChangesAsync();
        }

        ItemDefinicao? itemDebug = await context.ItensDefinicoes
            .FirstOrDefaultAsync(i => i.Codigo == "debug_espada_ferro");

        if (itemDebug == null)
        {
            itemDebug = CreateDebugSwordDefinition();
            context.ItensDefinicoes.Add(itemDebug);
            await context.SaveChangesAsync();
        }

        Jogador? jogadorPadrao = await context.Jogadores
            .Include(j => j.Estatistica)
            .Include(j => j.Inventario)
            .FirstOrDefaultAsync();

        if (jogadorPadrao == null)
        {
            jogadorPadrao = new Jogador
            {
                Nome = "Explorador",
                Nivel = 1,
                XP = 0,
                Moedas = 0,
                VidaBase = 50,
                VidaAtual = 50,
                EnergiaBase = 100,
                EnergiaAtual = 100,
                DanoBase = 10,
                DefesaBase = 0,
                VelocidadeBase = 0,
                CidadeId = cidadePadrao.Id,
                PersonagemId = 1
            };
            context.Jogadores.Add(jogadorPadrao);
            await context.SaveChangesAsync();
        }

        if (jogadorPadrao.Estatistica == null)
        {
            context.EstatisticasJogadores.Add(new EstatisticaJogador
            {
                JogadorId = jogadorPadrao.Id,
                DistanciaPercorridaKm = 0,
                PlacesVisitados = 0,
                MissoesConcluidasCount = 0,
                ItensObtidos = 1,
                ItensDescartados = 0,
                UltimaAtualizacaoUtc = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        bool jaTemItemNoInventario = await context.ItensInventario
            .AnyAsync(i => i.JogadorId == jogadorPadrao.Id);

        bool jaDescartouItens = jogadorPadrao.Estatistica != null && jogadorPadrao.Estatistica.ItensDescartados > 0;

        if (!jaTemItemNoInventario && !jaDescartouItens)
        {
            context.ItensInventario.Add(new ItemInventario
            {
                JogadorId = jogadorPadrao.Id,
                ItemDefinicaoId = itemDebug.Id,
                Quantidade = 1,
                SlotIndice = 0,
                CategoriaAba = itemDebug.Categoria,
                Equipado = false,
                SlotEquipado = null,
                ObtidoEmUtc = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }
    }
}
