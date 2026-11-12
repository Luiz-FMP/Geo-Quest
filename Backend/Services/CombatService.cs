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

    public async Task<SessaoCombateDto> IniciarCombateAsync(string tipoCombate, string nomeLocal)
    {
        var tipo = (tipoCombate ?? "random").ToLowerInvariant();
        var normais = await _context.Inimigos.Where(i => i.Tier == "Normal").ToListAsync();
        var miniBosses = await _context.Inimigos.Where(i => i.Tier == "MiniBoss").ToListAsync();
        var bosses = await _context.Bosses.ToListAsync();

        var sessao = new SessaoCombateDto
        {
            TipoCombate = tipo,
            NomeLocal = string.IsNullOrWhiteSpace(nomeLocal) ? "Zona Urbana" : nomeLocal,
            PermiteFuga = tipo == "random"
        };

        if (tipo == "boss")
        {
            var boss = bosses.OrderBy(_ => _rng.Next()).First();
            var lacaio = normais.OrderBy(_ => _rng.Next()).First();
            sessao.Rondas.Add([MapInimigo(lacaio, " #1"), MapBoss(boss)]);
        }
        else if (tipo == "arena")
        {
            sessao.Rondas.Add(SortearGrupoNormal(normais, 2));
            sessao.Rondas.Add(SortearGrupoNormal(normais, _rng.Next(2, 4)));
            var mini = miniBosses.OrderBy(_ => _rng.Next()).First();
            var guarda = normais.OrderBy(_ => _rng.Next()).First();
            sessao.Rondas.Add([MapInimigo(guarda, " #1"), MapInimigo(mini, "")]);
        }
        else
        {
            sessao.Rondas.Add(SortearGrupoNormal(normais, _rng.Next(1, 3)));
        }

        return sessao;
    }

    private List<InimigoCombateDto> SortearGrupoNormal(List<Inimigo> pool, int qtd)
    {
        var lista = new List<InimigoCombateDto>();
        for (int i = 0; i < qtd; i++)
        {
            var escolhido = pool[_rng.Next(pool.Count)];
            lista.Add(MapInimigo(escolhido, qtd > 1 ? $" #{i + 1}" : ""));
        }
        return lista;
    }

    private static InimigoCombateDto MapInimigo(Inimigo i, string sufixo) => new()
    {
        Nome = $"{i.Nome}{sufixo}",
        VidaMaxima = i.Vida,
        VidaAtual = i.Vida,
        Ataque = i.Ataque,
        Defesa = i.Defesa,
        Velocidade = i.Velocidade,
        RecompensaXP = i.RecompensaXP,
        Tier = i.Tier
    };

    private static InimigoCombateDto MapBoss(Boss b) => new()
    {
        Nome = b.Nome,
        VidaMaxima = b.Vida,
        VidaAtual = b.Vida,
        Ataque = b.Ataque,
        Defesa = b.Defesa,
        Velocidade = b.Velocidade,
        RecompensaXP = b.RecompensaXP,
        Tier = "Boss"
    };
}
