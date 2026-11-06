using System.Collections.Concurrent;
using GeoQuest.Api.Data;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Integrations;
using GeoQuest.Api.Models;
using GeoQuest.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoQuest.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class JogadoresController : ControllerBase
{
    public const int CustoMoedasCuraPaga = 50;
    public const int CustoMoedasDescansoLodging = 25;
    public const int CustoMoedasBuffServices = 50;
    public const int DuracaoSegundosBuffServices = 600;
    public const int DuracaoSegundosBuffCulture = 300;
    public const int RecompensaMoedasExploracaoNatural = 10;
    public const int LimiteHistoricoPorCategoria = 10;

    private static readonly SemaphoreSlim ActionConcurrencyLock = new(1, 1);
    private static readonly ConcurrentDictionary<string, VasculharNaturalFeatureResponse> ProcessedExplorations = new(StringComparer.Ordinal);
    private static readonly ConcurrentDictionary<string, TreinarSportsResponse> ProcessedSportsInteractions = new(StringComparer.Ordinal);

    private static readonly HashSet<string> CategoriasComHistorico = new(StringComparer.OrdinalIgnoreCase)
    {
        PlaceCategoryMapper.CategoryHealthAndWellness,
        PlaceCategoryMapper.CategoryLodging,
        PlaceCategoryMapper.CategoryEntertainment,
        PlaceCategoryMapper.CategoryShopping
    };

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

    [HttpPut("atual/vida")]
    public async Task<ActionResult<JogadorEstadoDto>> AtualizarVidaAtual(
        [FromBody] AtualizarVidaJogadorRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest(new { mensagem = "Dados de vida inválidos." });
        }

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var atributos = _statsCalculator.CalcularAtributos(jogador);

        jogador.VidaAtual = Math.Clamp(request.VidaAtual, 0, atributos.VidaFinal);

        if (request.EnergiaAtual.HasValue && !double.IsNaN(request.EnergiaAtual.Value))
        {
            jogador.EnergiaAtual = Math.Clamp(
                Math.Round(request.EnergiaAtual.Value, 2),
                0.0,
                atributos.EnergiaMaximaFinal
            );
        }

        if (request.Moedas.HasValue)
        {
            jogador.Moedas = Math.Max(0, request.Moedas.Value);
        }

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPost("atual/home")]
    public async Task<ActionResult<JogadorEstadoDto>> DefinirHomeInicial(
        [FromBody] DefinirHomeRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null ||
            double.IsNaN(request.Latitude) ||
            double.IsNaN(request.Longitude) ||
            request.Latitude < -90 || request.Latitude > 90 ||
            request.Longitude < -180 || request.Longitude > 180)
        {
            return BadRequest(new { mensagem = "Coordenadas de Home inválidas." });
        }

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);

        // Seção 2: A Home deve sempre representar a localização atual do usuário quando ele entra no jogo (ou quando definida via debug).
        if (!jogador.HomeLatitude.HasValue || !jogador.HomeLongitude.HasValue || request.ForcarAtualizacao)
        {
            jogador.HomeLatitude = Math.Round(request.Latitude, 6);
            jogador.HomeLongitude = Math.Round(request.Longitude, 6);
            jogador.PosicaoAtualLatitude = jogador.HomeLatitude;
            jogador.PosicaoAtualLongitude = jogador.HomeLongitude;
        }
        else if (!jogador.PosicaoAtualLatitude.HasValue || !jogador.PosicaoAtualLongitude.HasValue)
        {
            jogador.PosicaoAtualLatitude = jogador.HomeLatitude;
            jogador.PosicaoAtualLongitude = jogador.HomeLongitude;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPost("atual/visitar-place")]
    public async Task<ActionResult<JogadorEstadoDto>> RegistrarVisitaPlace(
        [FromBody] RegistrarVisitaPlaceRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.PlaceId) || string.IsNullOrWhiteSpace(request.Categoria))
        {
            return BadRequest(new { mensagem = "Dados do Place inválidos para registro de visita." });
        }

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);

        jogador.PosicaoAtualLatitude = Math.Round(request.Latitude, 6);
        jogador.PosicaoAtualLongitude = Math.Round(request.Longitude, 6);

        await RegistrarVisitaECheckpointInternoAsync(
            jogador,
            request.PlaceId.Trim(),
            string.IsNullOrWhiteSpace(request.Nome) ? "Local" : request.Nome.Trim(),
            request.Categoria.Trim(),
            string.IsNullOrWhiteSpace(request.Subcategoria) ? request.Categoria.Trim() : request.Subcategoria.Trim(),
            request.Latitude,
            request.Longitude,
            estadoInteracao: "Visitado",
            marcarConcluido: false,
            marcarCuraGratuita: false,
            cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPost("atual/hospital/curar")]
    public async Task<ActionResult<JogadorEstadoDto>> CurarEmHospital(
        [FromBody] CurarHospitalRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.PlaceId))
        {
            return BadRequest(new { mensagem = "Identificador do local de saúde inválido." });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var atributos = _statsCalculator.CalcularAtributos(jogador);

        string placeId = request.PlaceId.Trim();
        string nome = string.IsNullOrWhiteSpace(request.Nome) ? "Centro de Saúde" : request.Nome.Trim();
        string subcategoria = string.IsNullOrWhiteSpace(request.Subcategoria) ? "hospital" : request.Subcategoria.Trim().ToLowerInvariant();
        bool isGeneralHospital = string.Equals(subcategoria, PlaceCategoryMapper.SpecialHospitalSubcategory, StringComparison.OrdinalIgnoreCase);
        bool isPaga = string.Equals(request.TipoCura, "paga", StringComparison.OrdinalIgnoreCase);

        var estadoPlace = await ObterOuCriarEstadoPermanenteAsync(
            jogador,
            placeId,
            nome,
            PlaceCategoryMapper.CategoryHealthAndWellness,
            subcategoria,
            request.Latitude,
            request.Longitude,
            cancellationToken);

        if (!isPaga)
        {
            if (estadoPlace.CuraGratuitaUtilizada)
            {
                return BadRequest(new { mensagem = "Benefício gratuito já resgatado neste local." });
            }

            double percentualGratuita = isGeneralHospital ? 0.50 : 0.25;
            int vidaRecuperada = Math.Max(1, (int)Math.Round(atributos.VidaFinal * percentualGratuita, MidpointRounding.AwayFromZero));
            jogador.VidaAtual = Math.Clamp(jogador.VidaAtual + vidaRecuperada, 0, atributos.VidaFinal);
            estadoPlace.CuraGratuitaUtilizada = true;
            estadoPlace.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }
        else
        {
            if (jogador.Moedas < CustoMoedasCuraPaga)
            {
                return BadRequest(new { mensagem = $"Você não possui saldo suficiente. São necessárias {CustoMoedasCuraPaga} moedas." });
            }

            jogador.Moedas = Math.Max(0, jogador.Moedas - CustoMoedasCuraPaga);

            if (isGeneralHospital)
            {
                jogador.VidaAtual = atributos.VidaFinal;
            }
            else
            {
                int vidaRecuperada = Math.Max(1, (int)Math.Round(atributos.VidaFinal * 0.50, MidpointRounding.AwayFromZero));
                jogador.VidaAtual = Math.Clamp(jogador.VidaAtual + vidaRecuperada, 0, atributos.VidaFinal);
            }

            estadoPlace.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        jogador.PosicaoAtualLatitude = Math.Round(request.Latitude, 6);
        jogador.PosicaoAtualLongitude = Math.Round(request.Longitude, 6);

        await RegistrarVisitaECheckpointInternoAsync(
            jogador,
            placeId,
            nome,
            PlaceCategoryMapper.CategoryHealthAndWellness,
            subcategoria,
            request.Latitude,
            request.Longitude,
            estadoInteracao: isPaga ? "Cura Paga Realizada" : "Cura Gratuita Resgatada",
            marcarConcluido: false,
            marcarCuraGratuita: estadoPlace.CuraGratuitaUtilizada,
            cancellationToken);

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPost("atual/lodging/descansar")]
    public async Task<ActionResult<JogadorEstadoDto>> DescansarEmHospedagem(
        [FromBody] DescansarLodgingRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.PlaceId))
        {
            return BadRequest(new { mensagem = "Identificador da hospedagem inválido." });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var atributos = _statsCalculator.CalcularAtributos(jogador);

        if (jogador.Moedas < CustoMoedasDescansoLodging)
        {
            return BadRequest(new { mensagem = $"Você não possui saldo suficiente. São necessárias {CustoMoedasDescansoLodging} moedas." });
        }

        string placeId = request.PlaceId.Trim();
        string nome = string.IsNullOrWhiteSpace(request.Nome) ? "Hospedagem" : request.Nome.Trim();
        string subcategoria = string.IsNullOrWhiteSpace(request.Subcategoria) ? "hotel" : request.Subcategoria.Trim().ToLowerInvariant();

        jogador.Moedas = Math.Max(0, jogador.Moedas - CustoMoedasDescansoLodging);
        jogador.EnergiaAtual = atributos.EnergiaMaximaFinal;
        jogador.PosicaoAtualLatitude = Math.Round(request.Latitude, 6);
        jogador.PosicaoAtualLongitude = Math.Round(request.Longitude, 6);

        await RegistrarVisitaECheckpointInternoAsync(
            jogador,
             placeId,
            nome,
            PlaceCategoryMapper.CategoryLodging,
            subcategoria,
            request.Latitude,
            request.Longitude,
            estadoInteracao: "Descanso Realizado",
            marcarConcluido: false,
            marcarCuraGratuita: false,
            cancellationToken,
            salvarCheckpointDescanso: true);

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPost("atual/home/descansar")]
    public async Task<ActionResult<JogadorEstadoDto>> DescansarEmHome(
        [FromBody] DescansarHomeRequest? request,
        CancellationToken cancellationToken)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var atributos = _statsCalculator.CalcularAtributos(jogador);

        if (request?.Latitude is not null && request?.Longitude is not null &&
            (!jogador.HomeLatitude.HasValue || !jogador.HomeLongitude.HasValue))
        {
            jogador.HomeLatitude = Math.Round(request.Latitude.Value, 6);
            jogador.HomeLongitude = Math.Round(request.Longitude.Value, 6);
        }

        // Seção 4: O descanso na Home deve garantir pelo menos 50% da vida máxima, sem reduzir a vida caso já esteja acima desse valor.
        // Fórmula: vidaAtual = Math.max(vidaAtual, vidaMaxima * 0.5). Não alterar vida máxima, energia, moedas ou outros atributos.
        int vidaMinimaHome = (int)Math.Round(atributos.VidaFinal * 0.50, MidpointRounding.AwayFromZero);
        jogador.VidaAtual = Math.Clamp(Math.Max(jogador.VidaAtual, vidaMinimaHome), 1, atributos.VidaFinal);

        if (jogador.HomeLatitude.HasValue && jogador.HomeLongitude.HasValue)
        {
            jogador.PosicaoAtualLatitude = jogador.HomeLatitude;
            jogador.PosicaoAtualLongitude = jogador.HomeLongitude;
        }

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPost("atual/combate/concluir-local")]
    public async Task<ActionResult<JogadorEstadoDto>> ConcluirCombateEmLocal(
        [FromBody] ConcluirCombatePlaceRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest(new { mensagem = "Dados de conclusão de combate inválidos." });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var atributos = _statsCalculator.CalcularAtributos(jogador);

        if (request.HpRestante.HasValue)
        {
            jogador.VidaAtual = Math.Clamp(request.HpRestante.Value, 0, atributos.VidaFinal);
        }

        if (request.EnergiaRestante.HasValue && !double.IsNaN(request.EnergiaRestante.Value))
        {
            jogador.EnergiaAtual = Math.Clamp(
                Math.Round(request.EnergiaRestante.Value, 2),
                0.0,
                atributos.EnergiaMaximaFinal
            );
        }

        if (request.Vitoria && request.MoedasGanhas > 0)
        {
            jogador.Moedas = Math.Max(0, jogador.Moedas + request.MoedasGanhas);
        }

        if (!string.IsNullOrWhiteSpace(request.PlaceId) && !string.IsNullOrWhiteSpace(request.Categoria))
        {
            string placeId = request.PlaceId.Trim();
            string nome = string.IsNullOrWhiteSpace(request.Nome) ? "Local de Combate" : request.Nome.Trim();
            string categoria = request.Categoria.Trim();
            string subcategoria = string.IsNullOrWhiteSpace(request.Subcategoria)
                ? categoria
                : request.Subcategoria.Trim();

            var estadoPlace = await ObterOuCriarEstadoPermanenteAsync(
                jogador,
                placeId,
                nome,
                categoria,
                subcategoria,
                request.Latitude,
                request.Longitude,
                cancellationToken);

            if (request.Vitoria)
            {
                estadoPlace.Concluido = true;
                estadoPlace.UltimaAtualizacaoUtc = DateTime.UtcNow;
            }

            await RegistrarVisitaECheckpointInternoAsync(
                jogador,
                placeId,
                nome,
                categoria,
                subcategoria,
                request.Latitude,
                request.Longitude,
                estadoInteracao: estadoPlace.Concluido ? "Concluído" : "Tentativa de Combate",
                marcarConcluido: estadoPlace.Concluido,
                marcarCuraGratuita: estadoPlace.CuraGratuitaUtilizada,
                cancellationToken);
        }

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(estado);
    }

    [HttpPost("atual/retorno-checkpoint")]
    public async Task<ActionResult<object>> RetornarParaCheckpoint(
        [FromBody] RetornarCheckpointRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Motivo))
        {
            return BadRequest(new { mensagem = "Motivo de retorno inválido." });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
        var atributos = _statsCalculator.CalcularAtributos(jogador);

        bool isMorte = string.Equals(request.Motivo, "morte", StringComparison.OrdinalIgnoreCase);
        bool isEsgotamento = string.Equals(request.Motivo, "esgotamento", StringComparison.OrdinalIgnoreCase);

        if (!isMorte && !isEsgotamento)
        {
            return BadRequest(new { mensagem = "O motivo de retorno deve ser 'morte' ou 'esgotamento'." });
        }

        bool usarCheckpoint = string.Equals(request.Destino, "checkpoint", StringComparison.OrdinalIgnoreCase);

        string destinoPlaceId = "home";
        string destinoNome = "Home";
        string destinoCategoria = "Local especial";
        string destinoSubcategoria = "home";
        double destinoLat = jogador.HomeLatitude ?? jogador.PosicaoAtualLatitude ?? -25.4284;
        double destinoLng = jogador.HomeLongitude ?? jogador.PosicaoAtualLongitude ?? -49.2733;

        if (isEsgotamento)
        {
            // Seção 3.1: Quando a Energia chegar a zero -> Última hospedagem (Lodging) ou Home
            // Recuperar 50% da Vida máxima e manter a Energia em zero.
            if (usarCheckpoint &&
                !string.IsNullOrWhiteSpace(jogador.CheckpointEnergiaPlaceId) &&
                jogador.CheckpointEnergiaLatitude.HasValue &&
                jogador.CheckpointEnergiaLongitude.HasValue)
            {
                destinoPlaceId = jogador.CheckpointEnergiaPlaceId;
                destinoNome = jogador.CheckpointEnergiaNome ?? "Hospedagem";
                destinoCategoria = jogador.CheckpointEnergiaCategoria ?? PlaceCategoryMapper.CategoryLodging;
                destinoSubcategoria = jogador.CheckpointEnergiaSubcategoria ?? "lodging";
                destinoLat = jogador.CheckpointEnergiaLatitude.Value;
                destinoLng = jogador.CheckpointEnergiaLongitude.Value;
            }

            int vidaRecuperada = Math.Max(1, (int)Math.Round(atributos.VidaFinal * 0.50, MidpointRounding.AwayFromZero));
            jogador.VidaAtual = Math.Clamp(jogador.VidaAtual + vidaRecuperada, 1, atributos.VidaFinal);
            jogador.EnergiaAtual = 0.0;
        }
        else
        {
            // Quando a Vida chegar a zero:
            // - Opção 1 (Último hospital): Recupera 50% da Vida máxima para hospitais grandes (general_hospital)
            //   ou 25% da Vida máxima para os demais locais de Health and Wellness, mantendo a Energia igual.
            // - Opção 2 (Home): Recupera 50% da Vida total e 100% de Energia (mesma coisa que descansar no Home).
            if (usarCheckpoint &&
                !string.IsNullOrWhiteSpace(jogador.CheckpointVidaPlaceId) &&
                jogador.CheckpointVidaLatitude.HasValue &&
                jogador.CheckpointVidaLongitude.HasValue)
            {
                destinoPlaceId = jogador.CheckpointVidaPlaceId;
                destinoNome = jogador.CheckpointVidaNome ?? "Hospital";
                destinoCategoria = jogador.CheckpointVidaCategoria ?? PlaceCategoryMapper.CategoryHealthAndWellness;
                destinoSubcategoria = jogador.CheckpointVidaSubcategoria ?? "hospital";
                destinoLat = jogador.CheckpointVidaLatitude.Value;
                destinoLng = jogador.CheckpointVidaLongitude.Value;

                bool isHospitalGrande = string.Equals(
                    destinoSubcategoria,
                    PlaceCategoryMapper.SpecialHospitalSubcategory,
                    StringComparison.OrdinalIgnoreCase);

                double percentualVidaHospital = isHospitalGrande ? 0.50 : 0.25;
                int vidaRecuperadaHospital = Math.Max(
                    1,
                    (int)Math.Round(atributos.VidaFinal * percentualVidaHospital, MidpointRounding.AwayFromZero));

                jogador.VidaAtual = Math.Clamp(vidaRecuperadaHospital, 1, atributos.VidaFinal);
                // Mantém a Energia atual igual (sem alterar jogador.EnergiaAtual)
            }
            else
            {
                int vidaRecuperadaHome = Math.Max(1, (int)Math.Round(atributos.VidaFinal * 0.50, MidpointRounding.AwayFromZero));
                jogador.VidaAtual = Math.Clamp(vidaRecuperadaHome, 1, atributos.VidaFinal);
                jogador.EnergiaAtual = atributos.EnergiaMaximaFinal;
            }
        }

        jogador.PosicaoAtualLatitude = Math.Round(destinoLat, 6);
        jogador.PosicaoAtualLongitude = Math.Round(destinoLng, 6);

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(new
        {
            placeId = destinoPlaceId,
            destinoPlaceId,
            nomeDestino = destinoNome,
            destinoNome,
            destinoCategoria,
            destinoSubcategoria,
            latitude = destinoLat,
            longitude = destinoLng,
            jogador = estado
        });
    }

    /// <summary>
    /// Seção 4: Vasculhar locais de Natural Features.
    /// Probabilidades isoladas no backend:
    /// - 50%: Encontrar um item (Item de Debug existente, preparado para futura tabela de raridades)
    /// - 25%: Encontrar moedas (+10g)
    /// - 25%: Não encontrar nada
    /// </summary>
    [HttpPost("atual/natural-features/vasculhar")]
    public async Task<ActionResult<VasculharNaturalFeatureResponse>> VasculharNaturalFeature(
        [FromBody] VasculharNaturalFeatureRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.PlaceId))
        {
            return BadRequest(new { mensagem = "Identificador do local de exploração inválido." });
        }

        await ActionConcurrencyLock.WaitAsync(cancellationToken);
        try
        {
            string? dedupKey = string.IsNullOrWhiteSpace(request.InteracaoId)
                ? null
                : $"{request.PlaceId.Trim()}:{request.InteracaoId.Trim()}";

            if (dedupKey is not null && ProcessedExplorations.TryGetValue(dedupKey, out var cachedResponse))
            {
                return Ok(cachedResponse);
            }

            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
            string placeId = request.PlaceId.Trim();
            string nome = string.IsNullOrWhiteSpace(request.Nome) ? "Local Natural" : request.Nome.Trim();
            string subcategoria = string.IsNullOrWhiteSpace(request.Subcategoria)
                ? "woods"
                : request.Subcategoria.Trim().ToLowerInvariant();

            string tipoResultado = SortearResultadoExploracaoNatural(Random.Shared.NextDouble());
            string mensagemNarrativa;
            int moedasGanhas = 0;
            ItemInventarioDto? itemObtidoDto = null;

            if (tipoResultado == "item")
            {
                var itemAdded = await AdicionarItemRecompensaExploracaoAsync(jogador, cancellationToken);
                if (itemAdded is not null)
                {
                    itemObtidoDto = PlayerStatsCalculator.MapearItemInventario(itemAdded);
                    mensagemNarrativa = "Você investiga cuidadosamente os arredores e encontra um objeto curioso escondido na natureza!";
                }
                else
                {
                    // Caso a mochila esteja 50/50 cheia, ainda exibe o item de debug encontrado sem falhar a exploração
                    var itemDebugDef = await ObterOuCriarDefinicaoItemDebugAsync(cancellationToken);
                    itemObtidoDto = new ItemInventarioDto(
                        InventarioId: 0,
                        ItemDefinicaoId: itemDebugDef.Id,
                        Codigo: itemDebugDef.Codigo,
                        Nome: itemDebugDef.Nome,
                        Descricao: itemDebugDef.Descricao,
                        Categoria: itemDebugDef.Categoria,
                        Raridade: itemDebugDef.Raridade,
                        Equipavel: itemDebugDef.Equipavel,
                        SlotEquipamentoCompativel: itemDebugDef.SlotEquipamentoCompativel,
                        CategoriaAba: itemDebugDef.Categoria,
                        SlotIndice: null,
                        Equipado: false,
                        SlotEquipado: null,
                        Quantidade: 1,
                        BonusVida: itemDebugDef.BonusVida,
                        BonusEnergia: itemDebugDef.BonusEnergia,
                        BonusDano: itemDebugDef.BonusDano,
                        BonusDefesa: itemDebugDef.BonusDefesa,
                        BonusVelocidade: itemDebugDef.BonusVelocidade,
                        PlaceholderKey: itemDebugDef.PlaceholderKey
                    );
                    mensagemNarrativa = "Você encontra um item entre a vegetação! (Sua mochila de equipamentos já está com todos os 50 slots ocupados).";
                }
            }
            else if (tipoResultado == "moedas")
            {
                moedasGanhas = RecompensaMoedasExploracaoNatural;
                jogador.Moedas = Math.Max(0, jogador.Moedas + moedasGanhas);
                mensagemNarrativa = "Você vê algo brilhando entre as pedras. Ao investigar, encontra 10g!";
            }
            else
            {
                mensagemNarrativa = "Você procura cuidadosamente pela região, mas não encontra nada de interessante.";
            }

            if (request.Latitude != 0 || request.Longitude != 0)
            {
                jogador.PosicaoAtualLatitude = Math.Round(request.Latitude, 6);
                jogador.PosicaoAtualLongitude = Math.Round(request.Longitude, 6);
            }

            await RegistrarVisitaECheckpointInternoAsync(
                jogador,
                placeId,
                nome,
                PlaceCategoryMapper.CategoryNaturalFeatures,
                subcategoria,
                request.Latitude,
                request.Longitude,
                estadoInteracao: $"Vasculhado ({tipoResultado})",
                marcarConcluido: false,
                marcarCuraGratuita: false,
                cancellationToken);

            if (jogador.Estatisticas is not null)
            {
                jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
            var response = new VasculharNaturalFeatureResponse(
                TipoResultado: tipoResultado,
                Resultado: tipoResultado,
                Mensagem: mensagemNarrativa,
                MoedasGanhas: moedasGanhas,
                ItemEncontrado: itemObtidoDto,
                Jogador: estado
            );

            if (dedupKey is not null)
            {
                ProcessedExplorations[dedupKey] = response;
            }

            return Ok(response);
        }
        finally
        {
            ActionConcurrencyLock.Release();
        }
    }

    /// <summary>
    /// Seção 5: Execução de viagem direta entre pontos de transporte do mesmo tipo (airport -> airport ou bus_station -> bus_station).
    /// Custo = distancia_km * 10 convertido em moedas (g), sem modificador de velocidade, sem consumo de energia e sem combate.
    /// </summary>
    [HttpPost("atual/transporte/viajar")]
    public async Task<ActionResult<ViajarTransporteResponse>> ViajarPorTransporte(
        [FromBody] ViajarTransporteRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.DestinoPlaceId))
        {
            return BadRequest(new { mensagem = "Destino de transporte inválido." });
        }

        string subcategoria = (request.Subcategoria ?? request.DestinoSubcategoria ?? request.OrigemSubcategoria ?? string.Empty)
            .Trim()
            .ToLowerInvariant();
        if (!PlaceCategoryMapper.IsAllowedTransportationSubcategory(subcategoria))
        {
            return BadRequest(new { mensagem = $"Subcategoria de transporte não suportada ('{subcategoria}')." });
        }

        if (!string.IsNullOrWhiteSpace(request.OrigemSubcategoria) &&
            !string.IsNullOrWhiteSpace(request.DestinoSubcategoria) &&
            !string.Equals(
                request.OrigemSubcategoria.Trim(),
                request.DestinoSubcategoria.Trim(),
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { mensagem = "A viagem de transporte só é permitida entre Places da mesma subcategoria." });
        }

        if (double.IsNaN(request.DestinoLatitude) || double.IsNaN(request.DestinoLongitude) ||
            request.DestinoLatitude < -90 || request.DestinoLatitude > 90 ||
            request.DestinoLongitude < -180 || request.DestinoLongitude > 180)
        {
            return BadRequest(new { mensagem = "Coordenadas do destino inválidas." });
        }

        await ActionConcurrencyLock.WaitAsync(cancellationToken);
        try
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);

            double origemLat = request.OrigemLatitude != 0
                ? request.OrigemLatitude
                : (jogador.PosicaoAtualLatitude ?? request.DestinoLatitude);
            double origemLng = request.OrigemLongitude != 0
                ? request.OrigemLongitude
                : (jogador.PosicaoAtualLongitude ?? request.DestinoLongitude);

            double haversineKm = GooglePlacesClient.CalculateHaversineKm(
                origemLat,
                origemLng,
                request.DestinoLatitude,
                request.DestinoLongitude);

            double distanciaKm = request.DistanciaKm is > 0 && !double.IsNaN(request.DistanciaKm.Value)
                ? Math.Round(request.DistanciaKm.Value, 3)
                : Math.Round(haversineKm, 3);

            if (distanciaKm <= 0)
            {
                distanciaKm = Math.Max(0.05, Math.Round(haversineKm, 3));
            }

            int custoMoedas = GooglePlacesClient.CalculateTransportCostCoins(distanciaKm);

            if (jogador.Moedas < custoMoedas)
            {
                return BadRequest(new
                {
                    mensagem = $"Você não possui moedas suficientes para esta viagem. Custo: {custoMoedas}g (Saldo atual: {jogador.Moedas}g)."
                });
            }

            jogador.Moedas = Math.Max(0, jogador.Moedas - custoMoedas);
            jogador.PosicaoAtualLatitude = Math.Round(request.DestinoLatitude, 6);
            jogador.PosicaoAtualLongitude = Math.Round(request.DestinoLongitude, 6);

            string destinoId = request.DestinoPlaceId.Trim();
            string destinoNome = string.IsNullOrWhiteSpace(request.DestinoNome)
                ? (subcategoria == "airport" ? "Aeroporto" : "Estação de Ônibus")
                : request.DestinoNome.Trim();

            if (jogador.Estatisticas is not null)
            {
                jogador.Estatisticas.DistanciaPercorridaKm = Math.Round(
                    jogador.Estatisticas.DistanciaPercorridaKm + distanciaKm,
                    3);
                jogador.Estatisticas.PlacesVisitados += 1;
                jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
            }

            await RegistrarVisitaECheckpointInternoAsync(
                jogador,
                destinoId,
                destinoNome,
                PlaceCategoryMapper.CategoryTransportation,
                subcategoria,
                request.DestinoLatitude,
                request.DestinoLongitude,
                estadoInteracao: $"Viagem concluída (-{custoMoedas}g)",
                marcarConcluido: false,
                marcarCuraGratuita: false,
                cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
            return Ok(new ViajarTransporteResponse(
                DestinoPlaceId: destinoId,
                DestinoNome: destinoNome,
                Subcategoria: subcategoria,
                Latitude: jogador.PosicaoAtualLatitude.Value,
                Longitude: jogador.PosicaoAtualLongitude.Value,
                DistanciaKm: distanciaKm,
                CustoMoedas: custoMoedas,
                Jogador: estado
            ));
        }
        finally
        {
            ActionConcurrencyLock.Release();
        }
    }

    /// <summary>
    /// Seção 7: Sports — Melhorias permanentes de atributos.
    /// Opções:
    /// - "dano": +1 de dano
    /// - "vida": +5 de vida máxima (sem recuperar vida atual)
    /// - "energia": +10 de energia máxima (sem recuperar energia atual)
    /// - "velocidade": +1 de velocidade
    /// Apenas uma escolha por interação com o Place.
    /// </summary>
    [HttpPost("atual/sports/treinar")]
    public async Task<ActionResult<TreinarSportsResponse>> TreinarEmSports(
        [FromBody] TreinarSportsRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.PlaceId))
        {
            return BadRequest(new { mensagem = "Identificador do local esportivo inválido." });
        }

        string opcao = (!string.IsNullOrWhiteSpace(request.OpcaoAtributo) ? request.OpcaoAtributo : (request.Opcao ?? string.Empty))
            .Trim()
            .ToLowerInvariant();
        if (opcao is not ("dano" or "vida" or "energia" or "velocidade"))
        {
            return BadRequest(new
            {
                mensagem = "Opção de melhoria inválida. Escolha entre 'dano', 'vida', 'energia' ou 'velocidade'."
            });
        }

        await ActionConcurrencyLock.WaitAsync(cancellationToken);
        try
        {
            string? interactionKey = string.IsNullOrWhiteSpace(request.InteracaoId)
                ? null
                : $"{request.PlaceId.Trim()}:{request.InteracaoId.Trim()}";

            if (interactionKey is not null && ProcessedSportsInteractions.ContainsKey(interactionKey))
            {
                return BadRequest(new
                {
                    mensagem = "Você já escolheu uma melhoria de atributo nesta interação com o local."
                });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
            string placeId = request.PlaceId.Trim();
            string nome = string.IsNullOrWhiteSpace(request.Nome) ? "Centro Esportivo" : request.Nome.Trim();
            string subcategoria = string.IsNullOrWhiteSpace(request.Subcategoria)
                ? "gym"
                : request.Subcategoria.Trim().ToLowerInvariant();

            var estadoPlace = await ObterOuCriarEstadoPermanenteAsync(
                jogador,
                placeId,
                nome,
                PlaceCategoryMapper.CategorySports,
                subcategoria,
                request.Latitude,
                request.Longitude,
                cancellationToken);

            if (estadoPlace.Concluido)
            {
                return BadRequest(new
                {
                    mensagem = "A melhoria permanente deste local esportivo já foi adquirida. Cada Place de Sports permite apenas um aprimoramento."
                });
            }

            int incrementoAplicado;
            string mensagemMelhoria;
            string rotuloMelhoria;

            switch (opcao)
            {
                case "dano":
                    incrementoAplicado = 1;
                    rotuloMelhoria = "+1 Dano";
                    jogador.DanoBase += 1;
                    mensagemMelhoria = "Treino concluído: +1 de Dano permanente aplicado!";
                    break;
                case "vida":
                    incrementoAplicado = 5;
                    rotuloMelhoria = "+5 Vida máxima";
                    jogador.VidaBase += 5;
                    // Regra: Não recuperar 5 pontos de vida atuais.
                    mensagemMelhoria = "Treino concluído: +5 de Vida máxima permanente aplicado!";
                    break;
                case "energia":
                    incrementoAplicado = 10;
                    rotuloMelhoria = "+10 Energia máxima";
                    jogador.EnergiaBase = Math.Round(jogador.EnergiaBase + 10.0, 2);
                    // Regra: Não recuperar 10 pontos de energia atuais.
                    mensagemMelhoria = "Treino concluído: +10 de Energia máxima permanente aplicado!";
                    break;
                default: // "velocidade"
                    incrementoAplicado = 1;
                    rotuloMelhoria = "+1 Velocidade";
                    jogador.VelocidadeBase += 1;
                    mensagemMelhoria = "Treino concluído: +1 de Velocidade permanente aplicado!";
                    break;
            }

            estadoPlace.Concluido = true;
            estadoPlace.EstoqueJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                melhoria = opcao,
                incremento = incrementoAplicado,
                rotulo = rotuloMelhoria
            });
            estadoPlace.UltimaAtualizacaoUtc = DateTime.UtcNow;

            if (request.Latitude != 0 || request.Longitude != 0)
            {
                jogador.PosicaoAtualLatitude = Math.Round(request.Latitude, 6);
                jogador.PosicaoAtualLongitude = Math.Round(request.Longitude, 6);
            }

            await RegistrarVisitaECheckpointInternoAsync(
                jogador,
                placeId,
                nome,
                PlaceCategoryMapper.CategorySports,
                subcategoria,
                request.Latitude,
                request.Longitude,
                estadoInteracao: $"Concluído ({rotuloMelhoria})",
                marcarConcluido: true,
                marcarCuraGratuita: false,
                cancellationToken);

            if (jogador.Estatisticas is not null)
            {
                jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
            var response = new TreinarSportsResponse(
                OpcaoAtributo: opcao,
                Mensagem: mensagemMelhoria,
                IncrementoAplicado: incrementoAplicado,
                Jogador: estado
            );

            if (interactionKey is not null)
            {
                ProcessedSportsInteractions[interactionKey] = response;
            }

            return Ok(response);
        }
        finally
        {
            ActionConcurrencyLock.Release();
        }
    }

    /// <summary>
    /// Seção 4: Services — Ao selecionar um Place de Services, sorteia (caso ainda não tenha sido sorteado)
    /// e salva qual atributo será aprimorado naquele local específico.
    /// </summary>
    [HttpPost("atual/services/sortear-atributo")]
    public async Task<ActionResult<SortearAtributoServicesResponse>> SortearOuObterAtributoServices(
        [FromBody] SortearAtributoServicesRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.PlaceId))
        {
            return BadRequest(new { mensagem = "Identificador do estabelecimento de serviços inválido." });
        }

        await ActionConcurrencyLock.WaitAsync(cancellationToken);
        try
        {
            var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
            string placeId = request.PlaceId.Trim();
            string nome = string.IsNullOrWhiteSpace(request.Nome) ? "Serviço Urbano" : request.Nome.Trim();
            string subcategoria = string.IsNullOrWhiteSpace(request.Subcategoria)
                ? "service"
                : request.Subcategoria.Trim().ToLowerInvariant();

            var estadoPlace = await ObterOuCriarEstadoPermanenteAsync(
                jogador,
                placeId,
                nome,
                PlaceCategoryMapper.CategoryServices,
                subcategoria,
                request.Latitude,
                request.Longitude,
                cancellationToken);

            string atributo = GarantirAtributoSorteadoServicesPlace(estadoPlace);
            await _context.SaveChangesAsync(cancellationToken);

            var spec = PlayerStatsCalculator.ObterEspecificacaoBuff(atributo, "services");
            var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);

            return Ok(new SortearAtributoServicesResponse(
                PlaceId: placeId,
                Atributo: spec.Atributo,
                RotuloAtributo: spec.RotuloAtributo,
                BonusValor: spec.BonusValor,
                DuracaoSegundos: spec.DuracaoSegundos,
                CustoMoedas: CustoMoedasBuffServices,
                Jogador: estado
            ));
        }
        finally
        {
            ActionConcurrencyLock.Release();
        }
    }

    /// <summary>
    /// Seção 4: Services — Compra de aprimoramento temporário (10 min) por 50 moedas (50g).
    /// Permite comprar novamente no mesmo local quantas vezes o jogador desejar, desde que possua moedas suficientes.
    /// </summary>
    [HttpPost("atual/services/comprar-buff")]
    public async Task<ActionResult<ComprarBuffServicesResponse>> ComprarBuffEmServices(
        [FromBody] ComprarBuffServicesRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.PlaceId))
        {
            return BadRequest(new { mensagem = "Identificador do estabelecimento de serviços inválido." });
        }

        await ActionConcurrencyLock.WaitAsync(cancellationToken);
        try
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
            string placeId = request.PlaceId.Trim();
            string nome = string.IsNullOrWhiteSpace(request.Nome) ? "Serviço Urbano" : request.Nome.Trim();
            string subcategoria = string.IsNullOrWhiteSpace(request.Subcategoria)
                ? "service"
                : request.Subcategoria.Trim().ToLowerInvariant();

            var estadoPlace = await ObterOuCriarEstadoPermanenteAsync(
                jogador,
                placeId,
                nome,
                PlaceCategoryMapper.CategoryServices,
                subcategoria,
                request.Latitude,
                request.Longitude,
                cancellationToken);

            string atributo = GarantirAtributoSorteadoServicesPlace(estadoPlace);
            var spec = PlayerStatsCalculator.ObterEspecificacaoBuff(atributo, "services");

            if (jogador.Moedas < CustoMoedasBuffServices)
            {
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return BadRequest(new
                {
                    mensagem = $"Você não possui moedas o suficiente para adquirir o aprimoramento. São necessárias {CustoMoedasBuffServices} moedas (Saldo atual: {jogador.Moedas}g)."
                });
            }

            jogador.Moedas = Math.Max(0, jogador.Moedas - CustoMoedasBuffServices);

            var buffCriado = AplicarOuSobrescreverBuffInterno(jogador, spec.Atributo, "services");

            if (request.Latitude != 0 || request.Longitude != 0)
            {
                jogador.PosicaoAtualLatitude = Math.Round(request.Latitude, 6);
                jogador.PosicaoAtualLongitude = Math.Round(request.Longitude, 6);
            }

            await RegistrarVisitaECheckpointInternoAsync(
                jogador,
                placeId,
                nome,
                PlaceCategoryMapper.CategoryServices,
                subcategoria,
                request.Latitude,
                request.Longitude,
                estadoInteracao: $"Buff comprado: {spec.NomeBuff} (-{CustoMoedasBuffServices}g)",
                marcarConcluido: false,
                marcarCuraGratuita: false,
                cancellationToken);

            if (jogador.Estatisticas is not null)
            {
                jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
            var buffDto = PlayerStatsCalculator.MapearBuffJogador(buffCriado);

            string mensagem = $"Aprimoramento comprado com sucesso! +{spec.BonusValor} de {spec.RotuloAtributo} ativado por 10 minutos (-{CustoMoedasBuffServices}g).";

            return Ok(new ComprarBuffServicesResponse(
                PlaceId: placeId,
                Atributo: spec.Atributo,
                RotuloAtributo: spec.RotuloAtributo,
                BonusValor: spec.BonusValor,
                DuracaoSegundos: spec.DuracaoSegundos,
                CustoMoedas: CustoMoedasBuffServices,
                Mensagem: mensagem,
                BuffAplicado: buffDto,
                Jogador: estado
            ));
        }
        finally
        {
            ActionConcurrencyLock.Release();
        }
    }

    /// <summary>
    /// Seção 5: Culture — Recebe um aprimoramento temporário gratuito (5 min) sorteado na hora do clique.
    /// Restrito a uma única vez por Place de Culture.
    /// </summary>
    [HttpPost("atual/culture/receber-aprimoramento")]
    public async Task<ActionResult<ReceberBuffCultureResponse>> ReceberAprimoramentoEmCulture(
        [FromBody] ReceberBuffCultureRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.PlaceId))
        {
            return BadRequest(new { mensagem = "Identificador do espaço cultural inválido." });
        }

        await ActionConcurrencyLock.WaitAsync(cancellationToken);
        try
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
            string placeId = request.PlaceId.Trim();
            string nome = string.IsNullOrWhiteSpace(request.Nome) ? "Espaço Cultural" : request.Nome.Trim();
            string subcategoria = string.IsNullOrWhiteSpace(request.Subcategoria)
                ? "cultural_landmark"
                : request.Subcategoria.Trim().ToLowerInvariant();

            var estadoPlace = await ObterOuCriarEstadoPermanenteAsync(
                jogador,
                placeId,
                nome,
                PlaceCategoryMapper.CategoryCulture,
                subcategoria,
                request.Latitude,
                request.Longitude,
                cancellationToken);

            if (estadoPlace.Concluido)
            {
                return BadRequest(new
                {
                    mensagem = "Você já recebeu o aprimoramento deste local cultural. Não é possível receber novamente no mesmo Place."
                });
            }

            string resultadoSorteio = PlayerStatsCalculator.SortearResultadoCulture(Random.Shared.NextDouble());
            bool recebeuBuff = !string.Equals(resultadoSorteio, "nada", StringComparison.OrdinalIgnoreCase);

            BuffJogador? buffCriado = null;
            string nomeBuff;
            string descricaoBuff;
            int bonusValor = 0;
            int duracaoSegundos = 0;
            string mensagem;
            string placeholderKey = "buff_nada";

            if (recebeuBuff)
            {
                var spec = PlayerStatsCalculator.ObterEspecificacaoBuff(resultadoSorteio, "culture");
                buffCriado = AplicarOuSobrescreverBuffInterno(jogador, spec.Atributo, "culture");
                nomeBuff = spec.NomeBuff;
                descricaoBuff = spec.DescricaoBuff;
                bonusValor = spec.BonusValor;
                duracaoSegundos = spec.DuracaoSegundos;
                placeholderKey = spec.PlaceholderKey;
                mensagem = $"Inspiração cultural recebida: {spec.NomeBuff} (+{spec.BonusValor} de {spec.RotuloAtributo} por 5 minutos)!";
            }
            else
            {
                nomeBuff = "Nada";
                descricaoBuff = "Nenhum aprimoramento recebido desta vez.";
                mensagem = "Você contemplou o espaço cultural, mas não recebeu nenhum aprimoramento temporário desta vez.";
            }

            estadoPlace.Concluido = true;
            estadoPlace.EstoqueJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                tipo = "culture_buff",
                resultado = resultadoSorteio,
                recebeuBuff,
                nome = nomeBuff,
                descricao = descricaoBuff,
                bonusValor,
                duracaoSegundos,
                placeholderKey
            });
            estadoPlace.UltimaAtualizacaoUtc = DateTime.UtcNow;

            if (request.Latitude != 0 || request.Longitude != 0)
            {
                jogador.PosicaoAtualLatitude = Math.Round(request.Latitude, 6);
                jogador.PosicaoAtualLongitude = Math.Round(request.Longitude, 6);
            }

            await RegistrarVisitaECheckpointInternoAsync(
                jogador,
                placeId,
                nome,
                PlaceCategoryMapper.CategoryCulture,
                subcategoria,
                request.Latitude,
                request.Longitude,
                estadoInteracao: recebeuBuff ? $"Concluído ({nomeBuff})" : "Concluído (Nenhum aprimoramento)",
                marcarConcluido: true,
                marcarCuraGratuita: false,
                cancellationToken);

            if (jogador.Estatisticas is not null)
            {
                jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
            var buffDto = buffCriado is not null ? PlayerStatsCalculator.MapearBuffJogador(buffCriado) : null;

            return Ok(new ReceberBuffCultureResponse(
                PlaceId: placeId,
                RecebeuBuff: recebeuBuff,
                TipoResultado: resultadoSorteio,
                NomeBuff: nomeBuff,
                DescricaoBuff: descricaoBuff,
                BonusValor: bonusValor,
                DuracaoSegundos: duracaoSegundos,
                Mensagem: mensagem,
                BuffAplicado: buffDto,
                Jogador: estado
            ));
        }
        finally
        {
            ActionConcurrencyLock.Release();
        }
    }

    /// <summary>
    /// Seção 3: Sincroniza e remove buffs temporários cujo tempo já expirou.
    /// </summary>
    [HttpPost("atual/buffs/sincronizar")]
    public async Task<ActionResult<JogadorEstadoDto>> SincronizarBuffsAtivos(CancellationToken cancellationToken)
    {
        await ActionConcurrencyLock.WaitAsync(cancellationToken);
        try
        {
            var jogador = await ObterOuCriarJogadorLocalAsync(cancellationToken);
            var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
            return Ok(estado);
        }
        finally
        {
            ActionConcurrencyLock.Release();
        }
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
        var novoItem = await AdicionarItemRecompensaExploracaoAsync(jogador, cancellationToken);

        if (novoItem is null)
        {
            return BadRequest(new { mensagem = "A mochila está cheia (50/50 slots ocupados)." });
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

        if (request.DestinoLatitude.HasValue && request.DestinoLongitude.HasValue)
        {
            jogador.PosicaoAtualLatitude = Math.Round(request.DestinoLatitude.Value, 6);
            jogador.PosicaoAtualLongitude = Math.Round(request.DestinoLongitude.Value, 6);
        }

        if (jogador.Estatisticas is not null)
        {
            jogador.Estatisticas.DistanciaPercorridaKm = Math.Round(
                jogador.Estatisticas.DistanciaPercorridaKm + request.DistanciaKm,
                3);
            if (request.ChegouAoDestino)
            {
                jogador.Estatisticas.PlacesVisitados += 1;
            }
            jogador.Estatisticas.UltimaAtualizacaoUtc = DateTime.UtcNow;
        }

        if (request.ChegouAoDestino &&
            !string.IsNullOrWhiteSpace(request.PlaceId) &&
            !string.IsNullOrWhiteSpace(request.Categoria))
        {
            await RegistrarVisitaECheckpointInternoAsync(
                jogador,
                request.PlaceId.Trim(),
                string.IsNullOrWhiteSpace(request.NomeLocal) ? "Local" : request.NomeLocal.Trim(),
                request.Categoria.Trim(),
                string.IsNullOrWhiteSpace(request.Subcategoria) ? request.Categoria.Trim() : request.Subcategoria.Trim(),
                request.DestinoLatitude ?? jogador.PosicaoAtualLatitude ?? 0,
                request.DestinoLongitude ?? jogador.PosicaoAtualLongitude ?? 0,
                estadoInteracao: "Visitado",
                marcarConcluido: false,
                marcarCuraGratuita: false,
                cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var estado = await ConstruirEstadoDtoAsync(jogador, cancellationToken);
        return Ok(new
        {
            distanciaKm = Math.Round(request.DistanciaKm, 3),
            energiaConsumida,
            esgotado = jogador.EnergiaAtual <= 0.0,
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

    /// <summary>
    /// Isola a tabela de probabilidades da exploração de Natural Features (Seção 4.3):
    /// - [0.00, 0.50): item (50%)
    /// - [0.50, 0.75): moedas (25%)
    /// - [0.75, 1.00): nada (25%)
    /// Preparado para futura subdivisão dos 50% de itens em raridades sem alterar o fluxo do controlador.
    /// </summary>
    public static string SortearResultadoExploracaoNatural(double roll)
    {
        if (roll < 0.50)
        {
            return "item";
        }

        if (roll < 0.75)
        {
            return "moedas";
        }

        return "nada";
    }

    /// <summary>
    /// Isola a seleção de qual item é entregue quando o resultado da exploração é "item".
    /// Futuramente pode receber o roll de raridade sem alterar o restante do sistema de exploração.
    /// </summary>
    public static string SelecionarCodigoItemExploracao()
    {
        return DatabaseInitializer.CodigoItemDebug;
    }

    private async Task<ItemDefinicao> ObterOuCriarDefinicaoItemDebugAsync(CancellationToken cancellationToken)
    {
        string codigoAlvo = SelecionarCodigoItemExploracao();
        var itemDebugDef = await _context.ItensDefinicao
            .FirstOrDefaultAsync(i => i.Codigo == codigoAlvo, cancellationToken);

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

        return itemDebugDef;
    }

    private async Task<ItemInventario?> AdicionarItemRecompensaExploracaoAsync(
        Jogador jogador,
        CancellationToken cancellationToken)
    {
        var itemDef = await ObterOuCriarDefinicaoItemDebugAsync(cancellationToken);
        int? primeiroSlotLivre = EncontrarPrimeiroSlotLivre(jogador, itemDef.Categoria);

        if (primeiroSlotLivre is null)
        {
            return null;
        }

        var novoItem = new ItemInventario
        {
            JogadorId = jogador.Id,
            ItemDefinicaoId = itemDef.Id,
            ItemDefinicao = itemDef,
            CategoriaAba = itemDef.Categoria,
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

        return novoItem;
    }

    private async Task<EstadoPermanentePlace> ObterOuCriarEstadoPermanenteAsync(
        Jogador jogador,
        string placeId,
        string nome,
        string categoria,
        string subcategoria,
        double latitude,
        double longitude,
        CancellationToken cancellationToken)
    {
        var existente = jogador.EstadosPlaces
            .FirstOrDefault(e => string.Equals(e.PlaceId, placeId, StringComparison.OrdinalIgnoreCase))
            ?? await _context.EstadosPlaces.FirstOrDefaultAsync(
                e => e.JogadorId == jogador.Id && e.PlaceId == placeId,
                cancellationToken);

        if (existente is not null)
        {
            if (!string.IsNullOrWhiteSpace(nome))
            {
                existente.Nome = nome;
            }
            if (!string.IsNullOrWhiteSpace(categoria))
            {
                existente.Categoria = categoria;
            }
            if (!string.IsNullOrWhiteSpace(subcategoria))
            {
                existente.Subcategoria = subcategoria;
            }
            if (latitude != 0 || longitude != 0)
            {
                existente.Latitude = latitude;
                existente.Longitude = longitude;
            }
            if (string.Equals(categoria, PlaceCategoryMapper.CategoryServices, StringComparison.OrdinalIgnoreCase))
            {
                GarantirAtributoSorteadoServicesPlace(existente);
            }
            return existente;
        }

        string? estoqueInicialJson = null;
        if (string.Equals(categoria, PlaceCategoryMapper.CategoryShopping, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(subcategoria, PlaceCategoryMapper.SpecialBossSubcategory, StringComparison.OrdinalIgnoreCase))
        {
            estoqueInicialJson = "{\"tipo\":\"equipamentos\",\"slots\":10,\"reabastecimento\":false}";
        }
        else if (string.Equals(categoria, PlaceCategoryMapper.CategoryFoodAndDrink, StringComparison.OrdinalIgnoreCase))
        {
            estoqueInicialJson = "{\"tipo\":\"consumiveis\",\"slots\":10,\"reabastecimento\":false}";
        }
        else if (string.Equals(categoria, PlaceCategoryMapper.CategoryServices, StringComparison.OrdinalIgnoreCase))
        {
            string atributoSorteado = PlayerStatsCalculator.SortearAtributoServices(Random.Shared.NextDouble());
            var spec = PlayerStatsCalculator.ObterEspecificacaoBuff(atributoSorteado, "services");
            estoqueInicialJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                tipo = "services_buff",
                atributo = spec.Atributo,
                rotuloAtributo = spec.RotuloAtributo,
                bonusValor = spec.BonusValor,
                duracaoSegundos = spec.DuracaoSegundos,
                custoMoedas = CustoMoedasBuffServices
            });
        }

        var novoEstado = new EstadoPermanentePlace
        {
            JogadorId = jogador.Id,
            PlaceId = placeId,
            Nome = nome,
            Categoria = categoria,
            Subcategoria = subcategoria,
            Latitude = latitude,
            Longitude = longitude,
            Concluido = false,
            CuraGratuitaUtilizada = false,
            LojaEsgotada = false,
            EstoqueJson = estoqueInicialJson,
            PrimeiraVisitaUtc = DateTime.UtcNow,
            UltimaAtualizacaoUtc = DateTime.UtcNow
        };

        _context.EstadosPlaces.Add(novoEstado);
        jogador.EstadosPlaces.Add(novoEstado);
        return novoEstado;
    }

    private async Task RegistrarVisitaECheckpointInternoAsync(
        Jogador jogador,
        string placeId,
        string nome,
        string categoria,
        string subcategoria,
        double latitude,
        double longitude,
        string estadoInteracao,
        bool marcarConcluido,
        bool marcarCuraGratuita,
        CancellationToken cancellationToken,
        bool salvarCheckpointDescanso = false)
    {
        if (string.Equals(placeId, "home", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var estadoPermanente = await ObterOuCriarEstadoPermanenteAsync(
            jogador,
            placeId,
            nome,
            categoria,
            subcategoria,
            latitude,
            longitude,
            cancellationToken);

        if (marcarConcluido)
        {
            estadoPermanente.Concluido = true;
        }
        if (marcarCuraGratuita)
        {
            estadoPermanente.CuraGratuitaUtilizada = true;
        }
        estadoPermanente.UltimaAtualizacaoUtc = DateTime.UtcNow;

        // Regras de salvamento de Checkpoints:
        // - Health and Wellness: basta visitar o hospital para salvar o Checkpoint de Vida.
        // - Lodging: é necessário usar o local de descanso (Descansar) para salvar o Checkpoint de Energia.
        if (string.Equals(categoria, PlaceCategoryMapper.CategoryHealthAndWellness, StringComparison.OrdinalIgnoreCase))
        {
            jogador.CheckpointVidaPlaceId = placeId;
            jogador.CheckpointVidaNome = nome;
            jogador.CheckpointVidaCategoria = PlaceCategoryMapper.CategoryHealthAndWellness;
            jogador.CheckpointVidaSubcategoria = subcategoria;
            jogador.CheckpointVidaLatitude = Math.Round(latitude, 6);
            jogador.CheckpointVidaLongitude = Math.Round(longitude, 6);
            jogador.CheckpointVidaDataUtc = DateTime.UtcNow;
        }
        else if (salvarCheckpointDescanso &&
                 string.Equals(categoria, PlaceCategoryMapper.CategoryLodging, StringComparison.OrdinalIgnoreCase))
        {
            jogador.CheckpointEnergiaPlaceId = placeId;
            jogador.CheckpointEnergiaNome = nome;
            jogador.CheckpointEnergiaCategoria = PlaceCategoryMapper.CategoryLodging;
            jogador.CheckpointEnergiaSubcategoria = subcategoria;
            jogador.CheckpointEnergiaLatitude = Math.Round(latitude, 6);
            jogador.CheckpointEnergiaLongitude = Math.Round(longitude, 6);
            jogador.CheckpointEnergiaDataUtc = DateTime.UtcNow;
        }

        // Seção 5: Histórico limitado aos últimos 10 locais de cada uma das 4 categorias monitoradas
        if (!CategoriasComHistorico.Contains(categoria))
        {
            return;
        }

        var registrosCategoria = jogador.HistoricoVisitas
            .Where(h => string.Equals(h.Categoria, categoria, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(h => h.DataVisitaUtc)
            .ToList();

        var registroMesmoPlace = registrosCategoria.FirstOrDefault(
            h => string.Equals(h.PlaceId, placeId, StringComparison.OrdinalIgnoreCase));

        if (registroMesmoPlace is not null)
        {
            registroMesmoPlace.Nome = nome;
            registroMesmoPlace.Subcategoria = subcategoria;
            registroMesmoPlace.Latitude = latitude;
            registroMesmoPlace.Longitude = longitude;
            registroMesmoPlace.DataVisitaUtc = DateTime.UtcNow;
            registroMesmoPlace.EstadoInteracao = estadoInteracao;
            registroMesmoPlace.Concluido = estadoPermanente.Concluido;
            registroMesmoPlace.BeneficioGratuitoResgatado = estadoPermanente.CuraGratuitaUtilizada;
        }
        else
        {
            var novoHistorico = new HistoricoVisitaPlace
            {
                JogadorId = jogador.Id,
                PlaceId = placeId,
                Nome = nome,
                Categoria = categoria,
                Subcategoria = subcategoria,
                Latitude = latitude,
                Longitude = longitude,
                DataVisitaUtc = DateTime.UtcNow,
                EstadoInteracao = estadoInteracao,
                Concluido = estadoPermanente.Concluido,
                BeneficioGratuitoResgatado = estadoPermanente.CuraGratuitaUtilizada
            };

            _context.HistoricoVisitas.Add(novoHistorico);
            jogador.HistoricoVisitas.Add(novoHistorico);
        }

        var atualizadosCategoria = jogador.HistoricoVisitas
            .Where(h => string.Equals(h.Categoria, categoria, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(h => h.DataVisitaUtc)
            .ToList();

        if (atualizadosCategoria.Count > LimiteHistoricoPorCategoria)
        {
            var excedentes = atualizadosCategoria.Skip(LimiteHistoricoPorCategoria).ToList();
            foreach (var antigo in excedentes)
            {
                _context.HistoricoVisitas.Remove(antigo);
                jogador.HistoricoVisitas.Remove(antigo);
            }
        }
    }

    private async Task<Jogador> ObterOuCriarJogadorLocalAsync(CancellationToken cancellationToken)
    {
        var jogador = await _context.Jogadores
            .Include(j => j.Personagem)
            .Include(j => j.Estatisticas)
            .Include(j => j.ItensInventario)
                .ThenInclude(i => i.ItemDefinicao)
            .Include(j => j.Buffs)
            .Include(j => j.EstadosPlaces)
            .Include(j => j.HistoricoVisitas)
            .OrderBy(j => j.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (jogador is not null)
        {
            await LimparBuffsExpiradosInternoAsync(jogador, cancellationToken);
            return jogador;
        }

        await DatabaseInitializer.InitializeAsync(HttpContext.RequestServices);

        var recemCriado = await _context.Jogadores
            .Include(j => j.Personagem)
            .Include(j => j.Estatisticas)
            .Include(j => j.ItensInventario)
                .ThenInclude(i => i.ItemDefinicao)
            .Include(j => j.Buffs)
            .Include(j => j.EstadosPlaces)
            .Include(j => j.HistoricoVisitas)
            .OrderBy(j => j.Id)
            .FirstAsync(cancellationToken);

        await LimparBuffsExpiradosInternoAsync(recemCriado, cancellationToken);
        return recemCriado;
    }

    private async Task LimparBuffsExpiradosInternoAsync(Jogador jogador, CancellationToken cancellationToken)
    {
        var agora = DateTime.UtcNow;
        var expirados = jogador.Buffs
            .Where(b => !b.Ativo || (b.ExpiraEmUtc.HasValue && b.ExpiraEmUtc.Value <= agora))
            .ToList();

        if (expirados.Count == 0)
        {
            return;
        }

        foreach (var exp in expirados)
        {
            _context.BuffsJogador.Remove(exp);
            jogador.Buffs.Remove(exp);
        }

        var atributosAposExpiracao = _statsCalculator.CalcularAtributos(jogador);
        jogador.VidaAtual = Math.Clamp(jogador.VidaAtual, 0, atributosAposExpiracao.VidaFinal);
        jogador.EnergiaAtual = Math.Clamp(Math.Round(jogador.EnergiaAtual, 2), 0.0, atributosAposExpiracao.EnergiaMaximaFinal);

        await _context.SaveChangesAsync(cancellationToken);
    }

    private string GarantirAtributoSorteadoServicesPlace(EstadoPermanentePlace estadoPlace)
    {
        if (!string.IsNullOrWhiteSpace(estadoPlace.EstoqueJson))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(estadoPlace.EstoqueJson);
                if (doc.RootElement.TryGetProperty("atributo", out var attrEl) &&
                    attrEl.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    string? savedAttr = attrEl.GetString();
                    if (PlayerStatsCalculator.EhAtributoBuffValido(savedAttr))
                    {
                        return savedAttr!.Trim().ToLowerInvariant();
                    }
                }
            }
            catch
            {
                // Re-sorteia caso o JSON antigo não possua o atributo
            }
        }

        string atributoSorteado = PlayerStatsCalculator.SortearAtributoServices(Random.Shared.NextDouble());
        var spec = PlayerStatsCalculator.ObterEspecificacaoBuff(atributoSorteado, "services");
        estadoPlace.EstoqueJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            tipo = "services_buff",
            atributo = spec.Atributo,
            rotuloAtributo = spec.RotuloAtributo,
            bonusValor = spec.BonusValor,
            duracaoSegundos = spec.DuracaoSegundos,
            custoMoedas = CustoMoedasBuffServices
        });
        estadoPlace.UltimaAtualizacaoUtc = DateTime.UtcNow;
        return spec.Atributo;
    }

    private BuffJogador AplicarOuSobrescreverBuffInterno(Jogador jogador, string atributo, string origem)
    {
        var agora = DateTime.UtcNow;
        var spec = PlayerStatsCalculator.ObterEspecificacaoBuff(atributo, origem);

        // Regra Seção 3: Caso um aprimoramento que mude o mesmo atributo já ativo seja adquirido,
        // ele sobrescreve o aprimoramento anterior desse mesmo atributo (não se acumulam).
        var existentesMesmoAtributoOuExpirados = jogador.Buffs
            .Where(b =>
                !b.Ativo ||
                (b.ExpiraEmUtc.HasValue && b.ExpiraEmUtc.Value <= agora) ||
                string.Equals(PlayerStatsCalculator.IdentificarAtributoBuff(b), spec.Atributo, StringComparison.OrdinalIgnoreCase))
            .ToList();

        int bonusVidaAnterior = existentesMesmoAtributoOuExpirados
            .Where(b => b.Ativo && (!b.ExpiraEmUtc.HasValue || b.ExpiraEmUtc.Value > agora))
            .Sum(b => b.BonusVida);
        double bonusEnergiaAnterior = existentesMesmoAtributoOuExpirados
            .Where(b => b.Ativo && (!b.ExpiraEmUtc.HasValue || b.ExpiraEmUtc.Value > agora))
            .Sum(b => b.BonusEnergia);

        foreach (var antigo in existentesMesmoAtributoOuExpirados)
        {
            _context.BuffsJogador.Remove(antigo);
            jogador.Buffs.Remove(antigo);
        }

        var novoBuff = new BuffJogador
        {
            JogadorId = jogador.Id,
            Codigo = $"{origem}_{spec.Atributo}",
            Nome = spec.NomeBuff,
            Descricao = spec.DescricaoBuff,
            BonusVida = spec.Atributo == "vida" ? spec.BonusValor : 0,
            BonusEnergia = spec.Atributo == "energia" ? spec.BonusValor : 0,
            BonusDano = spec.Atributo == "dano" ? spec.BonusValor : 0,
            BonusDefesa = spec.Atributo == "defesa" ? spec.BonusValor : 0,
            BonusVelocidade = spec.Atributo == "velocidade" ? spec.BonusValor : 0,
            DuracaoSegundos = spec.DuracaoSegundos,
            CondicaoDuracao = $"{spec.DuracaoSegundos / 60} min",
            CriadoEmUtc = agora,
            ExpiraEmUtc = agora.AddSeconds(spec.DuracaoSegundos),
            Ativo = true,
            PlaceholderKey = spec.PlaceholderKey
        };

        _context.BuffsJogador.Add(novoBuff);
        jogador.Buffs.Add(novoBuff);

        var novosAtributos = _statsCalculator.CalcularAtributos(jogador);
        if (spec.Atributo == "vida")
        {
            int deltaVida = spec.BonusValor - bonusVidaAnterior;
            jogador.VidaAtual = Math.Clamp(jogador.VidaAtual + deltaVida, 0, novosAtributos.VidaFinal);
        }
        else if (spec.Atributo == "energia")
        {
            double deltaEnergia = spec.BonusValor - bonusEnergiaAnterior;
            jogador.EnergiaAtual = Math.Clamp(
                Math.Round(jogador.EnergiaAtual + deltaEnergia, 2),
                0.0,
                novosAtributos.EnergiaMaximaFinal);
        }

        return novoBuff;
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
