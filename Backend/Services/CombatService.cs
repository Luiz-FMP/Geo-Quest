using GeoQuest.Api.Data;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GeoQuest.Api.Services;

public class CombatService
{
    private readonly GeoQuestDbContext _context;
    private readonly Random _rng = new();

    public CombatService(GeoQuestDbContext context)
    {
        _context = context;
    }

    public async Task<SessaoCombateDto> GerarCombateAsync(IniciarCombateRequest req)
    {
        var inimigosBanco = await _context.Set<Inimigo>().ToListAsync();
        if (!inimigosBanco.Any())
        {
            inimigosBanco.Add(new Inimigo { Id = 1, Nome = "Sombra Errante", Vida = 35, Ataque = 10, Defesa = 4, Velocidade = 10 });
            inimigosBanco.Add(new Inimigo { Id = 2, Nome = "Golem Urbano", Vida = 55, Ataque = 12, Defesa = 8, Velocidade = 6 });
        }

        // Busca os Bosses da cidade atual (ou todos, caso CidadeId não seja enviado)
        var queryBoss = _context.Set<Boss>().Include(b => b.Cidade).AsQueryable();
        if (req.CidadeId.HasValue)
        {
            queryBoss = queryBoss.Where(b => b.CidadeId == req.CidadeId.Value);
        }
        var bossesBanco = await queryBoss.ToListAsync();

        var sessao = new SessaoCombateDto
        {
            TipoCombate = req.TipoCombate,
            NomeLocal = req.NomeLocal,
            PermiteFuga = req.TipoCombate == "Emboscada" // Não permite fugir em Arena ou Boss de Shopping
        };

        if (req.TipoCombate == "Emboscada")
        {
            int qtd = _rng.Next(1, 4); // 1 a 3 inimigos comuns na rua
            sessao.Rondas.Add(CriarGrupoInimigos(inimigosBanco, qtd, 1.0, "Comum"));
        }
        else if (req.TipoCombate == "Arena")
        {
            // Ronda 1 e 2: Grupos de Inimigos Comuns
            sessao.Rondas.Add(CriarGrupoInimigos(inimigosBanco, 2, 1.0, "Comum"));
            sessao.Rondas.Add(CriarGrupoInimigos(inimigosBanco, 3, 1.15, "Comum"));

            // Ronda 3 (Final do Parque): 1 Mini-Boss + 1 Inimigo Comum
            var rondaFinal = new List<CombatenteInimigoDto>();
            if (bossesBanco.Any())
            {
                // Usa um Boss da cidade com 65% de força como Mini-Boss do parque
                var bossEscolhido = bossesBanco[_rng.Next(bossesBanco.Count)];
                rondaFinal.Add(ConverterBossParaCombatente(bossEscolhido, 0.65, "MiniBoss", "Emissário: "));
            }
            else
            {
                rondaFinal.AddRange(CriarGrupoInimigos(inimigosBanco, 1, 1.8, "MiniBoss"));
            }
            rondaFinal.AddRange(CriarGrupoInimigos(inimigosBanco, 1, 1.0, "Comum"));
            sessao.Rondas.Add(rondaFinal);
        }
        else if (req.TipoCombate == "Boss")
        {
            // Luta de Shopping: O Boss verdadeiro da Cidade (100% dos status do Boss.cs)
            var rondaBoss = new List<CombatenteInimigoDto>();
            if (bossesBanco.Any())
            {
                var bossCidade = bossesBanco[_rng.Next(bossesBanco.Count)];
                rondaBoss.Add(ConverterBossParaCombatente(bossCidade, 1.0, "Boss", "[BOSS] "));
            }
            else
            {
                // Fallback caso ainda não haja Boss cadastrado para aquela cidade no banco
                rondaBoss.AddRange(CriarGrupoInimigos(inimigosBanco, 1, 3.0, "Boss"));
            }
            sessao.Rondas.Add(rondaBoss);
        }

        return sessao;
    }

    private CombatenteInimigoDto ConverterBossParaCombatente(Boss boss, double multiplicador, string tier, string prefixo)
    {
        int vidaFinal = (int)Math.Round(boss.Vida * multiplicador);
        return new CombatenteInimigoDto
        {
            OrigemId = boss.Id,
            Nome = $"{prefixo}{boss.Nome}",
            Tier = tier,
            VidaMaxima = vidaFinal,
            VidaAtual = vidaFinal,
            Ataque = (int)Math.Round(boss.Ataque * multiplicador),
            Defesa = (int)Math.Round(boss.Defesa * multiplicador),
            Velocidade = boss.Velocidade
        };
    }

    private List<CombatenteInimigoDto> CriarGrupoInimigos(List<Inimigo> pool, int quantidade, double multiplicador, string tier)
    {
        var grupo = new List<CombatenteInimigoDto>();
        for (int i = 0; i < quantidade; i++)
        {
            var baseInimigo = pool[_rng.Next(pool.Count)];
            int vidaTotal = (int)Math.Round(baseInimigo.Vida * multiplicador);

            grupo.Add(new CombatenteInimigoDto
            {
                OrigemId = baseInimigo.Id,
                Nome = $"{baseInimigo.Nome} {(quantidade > 1 ? (char)('A' + i) : "")}".Trim(),
                Tier = tier,
                VidaMaxima = vidaTotal,
                VidaAtual = vidaTotal,
                Ataque = (int)Math.Round(baseInimigo.Ataque * multiplicador),
                Defesa = (int)Math.Round(baseInimigo.Defesa * multiplicador),
                Velocidade = baseInimigo.Velocidade
            });
        }
        return grupo;
    }

    public async Task<ResultadoRecompensaDto> FinalizarCombateAsync(int jogadorId, string tipoCombate, bool vitoria, List<CombatenteInimigoDto> todosInimigosDerrotados)
    {
        if (!vitoria)
        {
            return new ResultadoRecompensaDto { Vitoria = false };
        }

        int totalMoedas = 0;
        foreach (var ini in todosInimigosDerrotados)
        {
            if (ini.Tier == "Boss")
            {
                totalMoedas += _rng.Next(60, 81); // 60 a 80 moedas para Bosses
            }
            else if (ini.Tier == "MiniBoss")
            {
                totalMoedas += _rng.Next(20, 31); // 20 a 30 moedas para Mini Bosses
            }
            else
            {
                // Inimigos normais (com bônus se for em Arena ou grupo)
                int baseNormal = 5;
                int bonusArena = tipoCombate == "Arena" ? 3 : 0; 
                totalMoedas += (baseNormal + bonusArena);
            }
        }

        // Drop de Item Aleatório: Certeza se for Arena (tipoCombate == "Arena"), 
        // caso contrário, 40% de chance para Emboscada/Boss
        bool ganhaItemCerteza = tipoCombate == "Arena";
        bool ganhouItem = ganhaItemCerteza || (_rng.NextDouble() <= 0.40);

        string? itemDropadoNome = null;
        if (ganhouItem)
        {
            var itensPool = new[] { "Poção de Vida Menor", "Cristal Energético", "Fragmento de Mapa", "Elixir de Velocidade" };
            itemDropadoNome = itensPool[_rng.Next(itensPool.Length)];
        }

        // Atualiza as moedas do Jogador no Banco de Dados
        var jogador = await _context.Set<Jogador>().Include(j => j.ItensInventario).FirstOrDefaultAsync(j => j.Id == jogadorId);
        if (jogador != null)
        {
            jogador.Moedas += totalMoedas;
            
            // Aqui futuramente você adicionará o item ganho na tabela ItemInventario.cs
            // Ex: if (ganhouItem) { _context.ItemInventarios.Add(new ItemInventario { JogadorId = jogador.Id, ... }); }

            await _context.SaveChangesAsync();
        }

        return new ResultadoRecompensaDto
        {
            Vitoria = true,
            MoedasGanhas = totalMoedas,
            GanhouItem = ganhouItem,
            ItemNome = itemDropadoNome
        };
    }
}