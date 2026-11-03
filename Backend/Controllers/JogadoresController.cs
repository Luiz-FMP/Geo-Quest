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
    public const int CustoMoedasCuraPaga = 50;
    public const int CustoMoedasDescansoLodging = 25;
    public const int LimiteHistoricoPorCategoria = 10;

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

        // Regra 9.1: A posição de Home deve ser persistida na sessão inicial e não deve ser sobrescrita a cada movimentação
        if (!jogador.HomeLatitude.HasValue || !jogador.HomeLongitude.HasValue || request.ForcarAtualizacao)
        {
            jogador.HomeLatitude = Math.Round(request.Latitude, 6);
            jogador.HomeLongitude = Math.Round(request.Longitude, 6);
        }

        if (!jogador.PosicaoAtualLatitude.HasValue || !jogador.PosicaoAtualLongitude.HasValue)
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

        int vidaRecuperadaHome = Math.Max(1, (int)Math.Round(atributos.VidaFinal * 0.50, MidpointRounding.AwayFromZero));
        jogador.VidaAtual = Math.Clamp(jogador.VidaAtual + vidaRecuperadaHome, 1, atributos.VidaFinal);
        jogador.EnergiaAtual = atributos.EnergiaMaximaFinal;

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
            return existente;
        }

        string? estoqueInicialJson = null;
        if (string.Equals(categoria, PlaceCategoryMapper.CategoryShopping, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(subcategoria, PlaceCategoryMapper.SpecialBossSubcategory, StringComparison.OrdinalIgnoreCase))
        {
            estoqueInicialJson = "{\"slots\":10,\"reabastecimento\":false}";
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
            return jogador;
        }

        await DatabaseInitializer.InitializeAsync(HttpContext.RequestServices);

        return await _context.Jogadores
            .Include(j => j.Personagem)
            .Include(j => j.Estatisticas)
            .Include(j => j.ItensInventario)
                .ThenInclude(i => i.ItemDefinicao)
            .Include(j => j.Buffs)
            .Include(j => j.EstadosPlaces)
            .Include(j => j.HistoricoVisitas)
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
