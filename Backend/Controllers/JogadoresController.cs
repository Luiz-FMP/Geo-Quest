using GeoQuest.Api.Data;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Models;
using GeoQuest.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoQuest.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class JogadoresController : ControllerBase
{
    private readonly GeoQuestDbContext _context;
    private readonly PlayerStatsCalculator _statsCalculator;

    public JogadoresController(GeoQuestDbContext context, PlayerStatsCalculator statsCalculator)
    {
        _context = context;
        _statsCalculator = statsCalculator;
    }

    [HttpGet("atual")]
    public async Task<ActionResult<JogadorEstadoDto>> GetJogadorAtual(CancellationToken cancellationToken)
    {
        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPut("atual/nome")]
    public async Task<ActionResult<JogadorEstadoDto>> AtualizarNome(
        [FromBody] AtualizarNomeJogadorRequest request,
        CancellationToken cancellationToken)
    {
        var novoNome = request?.Nome?.Trim();
        if (string.IsNullOrWhiteSpace(novoNome))
        {
            return BadRequest(new { mensagem = "O nome do usuário não pode ser vazio." });
        }

        if (novoNome.Length > 40)
        {
            return BadRequest(new { mensagem = "O nome do usuário deve ter no máximo 40 caracteres." });
        }

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        jogador.Nome = novoNome;

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPut("atual/personagem")]
    public async Task<ActionResult<JogadorEstadoDto>> AlterarPersonagem(
        [FromBody] AlterarPersonagemRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || request.PersonagemId <= 0)
        {
            return BadRequest(new { mensagem = "Personagem inválido." });
        }

        var personagem = await _context.Personagens
            .FirstOrDefaultAsync(p => p.Id == request.PersonagemId, cancellationToken);

        if (personagem is null)
        {
            return NotFound(new { mensagem = "Personagem selecionado não encontrado." });
        }

        if (!personagem.Disponivel)
        {
            return BadRequest(new { mensagem = "Este personagem ainda não está disponível." });
        }

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        jogador.PersonagemId = personagem.Id;
        jogador.Personagem = personagem;

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpGet("atual/atributos")]
    public async Task<ActionResult<AtributosDetalhadosDto>> GetAtributos(CancellationToken cancellationToken)
    {
        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        return Ok(_statsCalculator.CalcularAtributos(jogador));
    }

    [HttpGet("atual/inventario")]
    public async Task<ActionResult<object>> GetInventario(CancellationToken cancellationToken)
    {
        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(new
        {
            totalSlotsMochila = estado.TotalSlotsMochila,
            mochila = estado.Mochila,
            equipamentos = estado.Equipamentos
        });
    }

    [HttpPut("atual/inventario/mover")]
    public async Task<ActionResult<JogadorEstadoDto>> MoverItemInventario(
        [FromBody] MoverItemInventarioRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null ||
            request.NovoSlotIndice < 0 ||
            request.NovoSlotIndice >= PlayerStatsCalculator.TotalSlotsMochila)
        {
            return BadRequest(new
            {
                mensagem = $"O índice do slot deve estar entre 0 e {PlayerStatsCalculator.TotalSlotsMochila - 1}."
            });
        }

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var item = jogador.ItensInventario.FirstOrDefault(i => i.Id == request.InventarioId);

        if (item is null)
        {
            return NotFound(new { mensagem = "Item não encontrado no inventário do jogador." });
        }

        string abaItem = string.IsNullOrWhiteSpace(item.CategoriaAba)
            ? (item.ItemDefinicao?.Categoria ?? CategoriasItem.Equipavel)
            : item.CategoriaAba;

        int? slotAnterior = item.SlotIndice;

        // Verifica se já existe outro item no slot de destino na mesma aba da mochila
        var itemNoDestino = jogador.ItensInventario.FirstOrDefault(i =>
            i.Id != item.Id &&
            !i.Equipado &&
            i.SlotIndice == request.NovoSlotIndice &&
            string.Equals(
                string.IsNullOrWhiteSpace(i.CategoriaAba) ? i.ItemDefinicao?.Categoria : i.CategoriaAba,
                abaItem,
                StringComparison.OrdinalIgnoreCase));

        if (itemNoDestino is not null)
        {
            itemNoDestino.SlotIndice = slotAnterior;
        }

        item.Equipado = false;
        item.SlotEquipado = null;
        item.SlotIndice = request.NovoSlotIndice;
        item.CategoriaAba = abaItem;

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpDelete("atual/inventario/{inventarioId:int}")]
    public async Task<ActionResult<JogadorEstadoDto>> RemoverItemInventario(
        int inventarioId,
        CancellationToken cancellationToken)
    {
        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var item = jogador.ItensInventario.FirstOrDefault(i => i.Id == inventarioId);

        if (item is null)
        {
            return NotFound(new { mensagem = "Item não encontrado no inventário." });
        }

        _context.ItensInventario.Remove(item);
        jogador.ItensInventario.Remove(item);

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.ItensDescartados += 1;
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPost("atual/inventario/debug-item")]
    public async Task<ActionResult<JogadorEstadoDto>> GerarItemDebug(CancellationToken cancellationToken)
    {
        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);

        var itemDebugDef = await _context.ItensDefinicao
            .FirstOrDefaultAsync(i => i.Codigo == DatabaseInitializer.CodigoItemDebug, cancellationToken);

        if (itemDebugDef is null)
        {
            itemDebugDef = new ItemDefinicao
            {
                Codigo = DatabaseInitializer.CodigoItemDebug,
                Nome = "Item de Debug",
                Descricao = "Item temporário de teste para validar movimentação nos slots e descarte na lixeira.",
                Categoria = CategoriasItem.Equipavel,
                Raridade = RaridadesItem.Raro,
                Equipavel = false,
                SlotEquipamentoCompativel = null,
                PlaceholderKey = "item_debug"
            };
            _context.ItensDefinicao.Add(itemDebugDef);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var slotsOcupados = jogador.ItensInventario
            .Where(i => !i.Equipado &&
                        string.Equals(i.CategoriaAba, itemDebugDef.Categoria, StringComparison.OrdinalIgnoreCase) &&
                        i.SlotIndice.HasValue)
            .Select(i => i.SlotIndice!.Value)
            .ToHashSet();

        int? primeiroSlotLivre = null;
        for (int s = 0; s < PlayerStatsCalculator.TotalSlotsMochila; s++)
        {
            if (!slotsOcupados.Contains(s))
            {
                primeiroSlotLivre = s;
                break;
            }
        }

        if (primeiroSlotLivre is null)
        {
            return BadRequest(new { mensagem = "A mochila está cheia (50/50 slots ocupados)." });
        }

        var novoItem = new ItemInventario
        {
            JogadorId = jogador.Id,
            ItemDefinicaoId = itemDebugDef.Id,
            ItemDefinicao = itemDebugDef,
            CategoriaAba = itemDebugDef.Categoria,
            SlotIndice = primeiroSlotLivre.Value,
            Equipado = false,
            SlotEquipado = null,
            Quantidade = 1,
            DataObtencaoUtc = DateTime.UtcNow
        };

        _context.ItensInventario.Add(novoItem);
        jogador.ItensInventario.Add(novoItem);

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.ItensObtidos += 1;
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpGet("atual/equipamentos")]
    public async Task<ActionResult<IEnumerable<SlotEquipamentoDto>>> GetEquipamentos(CancellationToken cancellationToken)
    {
        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado.Equipamentos);
    }

    [HttpPost("atual/equipamentos/equipar")]
    public async Task<ActionResult<JogadorEstadoDto>> EquiparItem(
        [FromBody] EquiparItemRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.SlotEquipamento))
        {
            return BadRequest(new { mensagem = "Slot de equipamento inválido." });
        }

        var slotAlvo = SlotsEquipamento.Todos.FirstOrDefault(
            s => string.Equals(s, request.SlotEquipamento, StringComparison.OrdinalIgnoreCase));

        if (slotAlvo is null)
        {
            return BadRequest(new { mensagem = "Slot de equipamento desconhecido." });
        }

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var item = jogador.ItensInventario.FirstOrDefault(i => i.Id == request.InventarioId);

        if (item is null || item.ItemDefinicao is null)
        {
            return NotFound(new { mensagem = "Item não encontrado no inventário." });
        }

        if (!item.ItemDefinicao.Equipavel || string.IsNullOrWhiteSpace(item.ItemDefinicao.SlotEquipamentoCompativel))
        {
            return BadRequest(new
            {
                mensagem = $"O item '{item.ItemDefinicao.Nome}' não é um equipamento vestível."
            });
        }

        if (!string.Equals(item.ItemDefinicao.SlotEquipamentoCompativel, slotAlvo, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                mensagem = $"O item '{item.ItemDefinicao.Nome}' só pode ser equipado no slot '{SlotsEquipamento.ObterRotulo(item.ItemDefinicao.SlotEquipamentoCompativel)}'."
            });
        }

        var itemJaEquipadoNoSlot = jogador.ItensInventario.FirstOrDefault(
            i => i.Id != item.Id &&
                 i.Equipado &&
                 string.Equals(i.SlotEquipado, slotAlvo, StringComparison.OrdinalIgnoreCase));

        if (itemJaEquipadoNoSlot is not null)
        {
            itemJaEquipadoNoSlot.Equipado = false;
            itemJaEquipadoNoSlot.SlotEquipado = null;
            itemJaEquipadoNoSlot.SlotIndice = item.SlotIndice ?? EncontrarPrimeiroSlotLivre(jogador, itemJaEquipadoNoSlot.CategoriaAba);
        }

        item.SlotIndice = null;
        item.Equipado = true;
        item.SlotEquipado = slotAlvo;

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPost("atual/equipamentos/desequipar")]
    public async Task<ActionResult<JogadorEstadoDto>> DesequiparItem(
        [FromBody] DesequiparItemRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.SlotEquipamento))
        {
            return BadRequest(new { mensagem = "Slot de equipamento inválido." });
        }

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var itemEquipado = jogador.ItensInventario.FirstOrDefault(
            i => i.Equipado && string.Equals(i.SlotEquipado, request.SlotEquipamento, StringComparison.OrdinalIgnoreCase));

        if (itemEquipado is null)
        {
            return NotFound(new { mensagem = "Não há item equipado neste slot." });
        }

        int? slotLivre = request.SlotMochilaDestino is >= 0 and < PlayerStatsCalculator.TotalSlotsMochila
            ? request.SlotMochilaDestino
            : EncontrarPrimeiroSlotLivre(jogador, itemEquipado.CategoriaAba);

        if (slotLivre is null)
        {
            return BadRequest(new { mensagem = "Não há espaço livre na mochila para remover o equipamento." });
        }

        itemEquipado.Equipado = false;
        itemEquipado.SlotEquipado = null;
        itemEquipado.SlotIndice = slotLivre.Value;

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpGet("atual/estatisticas")]
    public async Task<ActionResult<EstatisticasJogadorDto>> GetEstatisticas(CancellationToken cancellationToken)
    {
        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado.Estatisticas);
    }

    [HttpPost("atual/percurso")]
    public async Task<ActionResult<object>> RegistrarPercurso(
        [FromBody] RegistrarPercursoRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || request.DistanciaKm < 0 || double.IsNaN(request.DistanciaKm))
        {
            return BadRequest(new { mensagem = "Distância do percurso inválida." });
        }

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var atributos = _statsCalculator.CalcularAtributos(jogador);

        double energiaConsumida = PlayerStatsCalculator.CalcularEnergiaConsumida(
            request.DistanciaKm,
            atributos.VelocidadeFinal);

        jogador.EnergiaAtual = Math.Max(0.0, Math.Round(jogador.EnergiaAtual - energiaConsumida, 2));

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.DistanciaPercorridaKm = Math.Round(
                jogador.Estatisticas.DistanciaPercorridaKm + request.DistanciaKm,
                3);
            jogador.Estatisticas.PlacesVisitados += 1;
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(new
        {
            distanciaKm = Math.Round(request.DistanciaKm, 3),
            energiaConsumida,
            jogador = estado
        });
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JogadorEstadoDto>>> GetJogadores(CancellationToken cancellationToken)
    {
        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(new[] { estado });
    }

    private async Task<Jogador> ObterOuCriarJogadorLocalAsync(CancellationToken cancellationToken)
    {
        var jogador = await _context.Jogadores
            .Include(j => j.Personagem)
            .Include(j => j.Estatisticas)
            .Include(j => j.ItensInventario)
                .ThenInclude(i => i.ItemDefinicao)
            .Include(j => j.Buffs)
            .OrderBy(j => j.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (jogador is not null)
        {
            return jogador;
        }

        await DatabaseInitializer.InitializeAsync(HttpContext.RequestServices);

        return await _context.Jogadores
            .Include(j => j.Personagem)
            .Include(j => j.Estatisticas)
            .Include(j => j.ItensInventario)
                .ThenInclude(i => i.ItemDefinicao)
            .Include(j => j.Buffs)
            .OrderBy(j => j.Id)
            .FirstAsync(cancellationToken);
    }

    private async Task<JogadorEstadoDto> ConstruirEstadoDtoAsync(
        Jogador jogador,
        CancellationToken cancellationToken)
    {
        int missoesTabela = await _context.MissoesConcluidas
            .CountAsync(m => m.JogadorId == jogador.Id, cancellationToken);

        return _statsCalculator.MapearEstadoJogador(jogador, missoesTabela);
    }

    private static int? EncontrarPrimeiroSlotLivre(Jogador jogador, string aba)
    {
        var ocupados = jogador.ItensInventario
            .Where(i => !i.Equipado &&
                        string.Equals(i.CategoriaAba, aba, StringComparison.OrdinalIgnoreCase) &&
                        i.SlotIndice.HasValue)
            .Select(i => i.SlotIndice!.Value)
            .ToHashSet();

        for (int idx = 0; idx < PlayerStatsCalculator.TotalSlotsMochila; idx++)
        {
            if (!ocupados.Contains(idx))
            {
                return idx;
            }
        }

        return null;
    }
}
