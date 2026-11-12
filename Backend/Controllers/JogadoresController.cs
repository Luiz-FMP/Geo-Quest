using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Data;
using GeoQuest.Api.DTOs;
using GeoQuest.Api.Integrations;
using GeoQuest.Api.Models;
using GeoQuest.Api.Services;

namespace GeoQuest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JogadoresController : ControllerBase
{
    private readonly GeoQuestDbContext _context;

    private static readonly string[] CategoriasComLimiteDe10 =
    [
        "Health and Wellness",
        "Lodging",
        "Entertainment and Recreation",
        "Shopping"
    ];

    private static readonly Dictionary<string, (string Atributo, string NomeExibicao, int Bonus)> SportsTrainingMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["arena"] = ("dano", "Dano", 1),
            ["sports_club"] = ("dano", "Dano", 1),
            ["sports_coaching"] = ("dano", "Dano", 1),
            ["sports_school"] = ("dano", "Dano", 1),
            ["athletic_field"] = ("velocidade", "Velocidade", 1),
            ["playground"] = ("velocidade", "Velocidade", 1),
            ["race_course"] = ("velocidade", "Velocidade", 1),
            ["ski_resort"] = ("velocidade", "Velocidade", 1),
            ["sports_activity_location"] = ("velocidade", "Velocidade", 1),
            ["tennis_court"] = ("velocidade", "Velocidade", 1),
            ["fishing_charter"] = ("defesa", "Defesa", 1),
            ["fishing_pier"] = ("defesa", "Defesa", 1),
            ["fishing_pond"] = ("defesa", "Defesa", 1),
            ["golf_course"] = ("defesa", "Defesa", 1),
            ["ice_skating_rink"] = ("defesa", "Defesa", 1),
            ["indoor_golf_course"] = ("defesa", "Defesa", 1),
            ["swimming_pool"] = ("defesa", "Defesa", 1),
            ["fitness_center"] = ("vida", "Vida", 5),
            ["gym"] = ("vida", "Vida", 5),
            ["sports_complex"] = ("vida", "Vida", 5),
            ["stadium"] = ("vida", "Vida", 5)
        };

    private static readonly string[] AtributosBuffPermitidos =
        ["vida", "energia", "dano", "defesa", "velocidade"];

    public JogadoresController(GeoQuestDbContext context)
    {
        _context = context;
    }

    [HttpGet("atual")]
    public async Task<ActionResult<JogadorEstadoDto>> GetJogadorAtual()
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<JogadorEstadoDto>> GetById(int id)
    {
        var existe = await _context.Jogadores.AnyAsync(j => j.Id == id);
        if (!existe)
            return NotFound();

        return Ok(await MontarEstadoJogadorAsync(id));
    }

    [HttpPut("atual/nome")]
    public async Task<ActionResult<JogadorEstadoDto>> AtualizarNome([FromBody] AtualizarNomeJogadorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nome))
            return BadRequest(new { message = "O nome do usuário não pode ser vazio." });

        var nomeLimpo = request.Nome.Trim();
        if (nomeLimpo.Length > 40)
            nomeLimpo = nomeLimpo[..40];

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        jogador.Nome = nomeLimpo;
        await _context.SaveChangesAsync();

        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPut("atual/personagem")]
    public async Task<ActionResult<JogadorEstadoDto>> AlterarPersonagem([FromBody] AlterarPersonagemJogadorRequest request)
    {
        var personagem = await _context.Personagens
            .FirstOrDefaultAsync(p => p.Id == request.PersonagemId && p.Disponivel);

        if (personagem == null)
            return BadRequest(new { message = "Personagem selecionado inválido ou indisponível." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        jogador.PersonagemId = personagem.Id;

        var estatistica = await ObterOuCriarEstatisticaAsync(jogador.Id);
        estatistica.UltimaAtualizacaoUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPut("atual/vida")]
    public async Task<ActionResult<JogadorEstadoDto>> AtualizarVida([FromBody] AtualizarVidaJogadorRequest request)
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var atrs = await CalcularAtributosJogadorAsync(jogador);

        jogador.VidaAtual = Math.Clamp(request.VidaAtual, 0, atrs.VidaFinal);

        if (request.EnergiaAtual.HasValue)
        {
            jogador.EnergiaAtual = Math.Clamp(Math.Round(request.EnergiaAtual.Value, 2), 0, atrs.EnergiaMaximaFinal);
        }

        if (request.Moedas.HasValue)
        {
            jogador.Moedas = Math.Max(0, request.Moedas.Value);
        }

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/home")]
    public async Task<ActionResult<JogadorEstadoDto>> DefinirHome([FromBody] DefinirHomeRequest request)
    {
        if (!CoordenadasValidas(request.Latitude, request.Longitude))
            return BadRequest(new { message = "Coordenadas inválidas para o Home." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        if (!jogador.HomeLatitude.HasValue || !jogador.HomeLongitude.HasValue)
        {
            jogador.HomeLatitude = request.Latitude;
            jogador.HomeLongitude = request.Longitude;
            await _context.SaveChangesAsync();
        }

        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/locais/visitar")]
    public async Task<ActionResult<JogadorEstadoDto>> VisitarPlace([FromBody] VisitarPlaceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlaceId))
            return BadRequest(new { message = "PlaceId é obrigatório." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var categoria = (request.Categoria ?? string.Empty).Trim();
        var subcategoria = (request.Subcategoria ?? string.Empty).Trim();
        var nome = string.IsNullOrWhiteSpace(request.Nome) ? "Local Desconhecido" : request.Nome.Trim();

        AtualizarCheckpointsPorCategoria(jogador, request.PlaceId.Trim(), nome, categoria, subcategoria, request.Latitude, request.Longitude);
        await RegistrarOuAtualizarHistoricoPlaceAsync(jogador.Id, request.PlaceId.Trim(), nome, categoria, subcategoria, request.Latitude, request.Longitude, "Visitado");

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/locais/hospital/curar")]
    public async Task<ActionResult<JogadorEstadoDto>> CurarNoHospital([FromBody] CurarHospitalRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlaceId))
            return BadRequest(new { message = "PlaceId do hospital é obrigatório." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var placeId = request.PlaceId.Trim();
        var nome = string.IsNullOrWhiteSpace(request.Nome) ? "Hospital" : request.Nome.Trim();
        var sub = string.IsNullOrWhiteSpace(request.Subcategoria) ? "hospital" : request.Subcategoria.Trim();

        jogador.CheckpointVidaPlaceId = placeId;
        jogador.CheckpointVidaNome = nome;
        jogador.CheckpointVidaSubcategoria = sub;
        jogador.CheckpointVidaLatitude = request.Latitude;
        jogador.CheckpointVidaLongitude = request.Longitude;

        var estadoPerm = await ObterOuCriarEstadoPermanentePlaceAsync(jogador.Id, placeId, nome, "Health and Wellness", sub, request.Latitude, request.Longitude);
        var atrs = await CalcularAtributosJogadorAsync(jogador);
        int vidaMax = atrs.VidaFinal;
        string opcao = (request.OpcaoCura ?? "free").Trim().ToLowerInvariant();

        if (opcao == "free")
        {
            if (estadoPerm.BeneficioGratuitoResgatado)
                return BadRequest(new { message = "A cura gratuita única deste hospital já foi utilizada." });

            int ganho = Math.Max(1, (int)Math.Ceiling(vidaMax * 0.25));
            jogador.VidaAtual = Math.Min(vidaMax, jogador.VidaAtual + ganho);
            estadoPerm.BeneficioGratuitoResgatado = true;
            estadoPerm.Concluido = true;
            estadoPerm.AtualizadoEmUtc = DateTime.UtcNow;
        }
        else if (opcao == "half_paid")
        {
            if (jogador.Moedas < 15)
                return BadRequest(new { message = "Moedas insuficientes (requer 15g)." });

            int ganho = Math.Max(1, (int)Math.Ceiling(vidaMax * 0.50));
            jogador.Moedas -= 15;
            jogador.VidaAtual = Math.Min(vidaMax, jogador.VidaAtual + ganho);
        }
        else if (opcao == "full_paid")
        {
            if (jogador.Moedas < 25)
                return BadRequest(new { message = "Moedas insuficientes (requer 25g)." });

            jogador.Moedas -= 25;
            jogador.VidaAtual = vidaMax;
        }
        else
        {
            return BadRequest(new { message = "Opção de cura inválida." });
        }

        await RegistrarOuAtualizarHistoricoPlaceAsync(
            jogador.Id, placeId, nome, "Health and Wellness", sub, request.Latitude, request.Longitude,
            estadoPerm.BeneficioGratuitoResgatado ? "Cura Gratuita Utilizada" : "Cura Realizada",
            concluido: estadoPerm.Concluido,
            beneficioGratuitoResgatado: estadoPerm.BeneficioGratuitoResgatado);

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/locais/hospedagem/descansar")]
    public async Task<ActionResult<JogadorEstadoDto>> DescansarNaHospedagem([FromBody] DescansarHospedagemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlaceId))
            return BadRequest(new { message = "PlaceId da hospedagem é obrigatório." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var placeId = request.PlaceId.Trim();
        var nome = string.IsNullOrWhiteSpace(request.Nome) ? "Hospedagem" : request.Nome.Trim();
        var sub = string.IsNullOrWhiteSpace(request.Subcategoria) ? "hotel" : request.Subcategoria.Trim();

        jogador.CheckpointEnergiaPlaceId = placeId;
        jogador.CheckpointEnergiaNome = nome;
        jogador.CheckpointEnergiaSubcategoria = sub;
        jogador.CheckpointEnergiaLatitude = request.Latitude;
        jogador.CheckpointEnergiaLongitude = request.Longitude;

        var atrs = await CalcularAtributosJogadorAsync(jogador);
        double energiaMax = atrs.EnergiaMaximaFinal;
        string opcao = (request.OpcaoDescanso ?? "full").Trim().ToLowerInvariant();

        if (opcao == "half")
        {
            if (jogador.Moedas < 15)
                return BadRequest(new { message = "Moedas insuficientes (requer 15g)." });

            jogador.Moedas -= 15;
            jogador.EnergiaAtual = Math.Min(energiaMax, Math.Round(jogador.EnergiaAtual + energiaMax * 0.50, 2));
        }
        else if (opcao == "full")
        {
            if (jogador.Moedas < 25)
                return BadRequest(new { message = "Moedas insuficientes (requer 25g)." });

            jogador.Moedas -= 25;
            jogador.EnergiaAtual = energiaMax;
        }
        else
        {
            return BadRequest(new { message = "Opção de descanso inválida." });
        }

        await RegistrarOuAtualizarHistoricoPlaceAsync(
            jogador.Id, placeId, nome, "Lodging", sub, request.Latitude, request.Longitude, "Descanso Realizado");

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/locais/home/descansar")]
    public async Task<ActionResult<JogadorEstadoDto>> DescansarNoHome([FromBody] DefinirHomeRequest? request)
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();

        if (request != null && CoordenadasValidas(request.Latitude, request.Longitude) &&
            (!jogador.HomeLatitude.HasValue || !jogador.HomeLongitude.HasValue))
        {
            jogador.HomeLatitude = request.Latitude;
            jogador.HomeLongitude = request.Longitude;
        }

        var atrs = await CalcularAtributosJogadorAsync(jogador);
        jogador.EnergiaAtual = atrs.EnergiaMaximaFinal;
        jogador.VidaAtual = atrs.VidaFinal;

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/locais/natural-features/vasculhar")]
    public async Task<ActionResult<VasculharNaturalFeatureResponse>> VasculharNaturalFeature([FromBody] VasculharNaturalFeatureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlaceId))
            return BadRequest(new { message = "PlaceId do ponto natural é obrigatório." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var placeId = request.PlaceId.Trim();
        var nome = string.IsNullOrWhiteSpace(request.Nome) ? "Ponto Natural" : request.Nome.Trim();
        var sub = string.IsNullOrWhiteSpace(request.Subcategoria) ? "natural_feature" : request.Subcategoria.Trim();

        var estadoPerm = await ObterOuCriarEstadoPermanentePlaceAsync(jogador.Id, placeId, nome, "Natural Features", sub, request.Latitude, request.Longitude);
        if (estadoPerm.Concluido)
            return BadRequest(new { message = "Este ponto natural já foi vasculhado e concluído permanentemente." });

        int moedasEncontradas = Random.Shared.Next(5, 21);
        jogador.Moedas += moedasEncontradas;

        ItemMochilaDto? itemEncontradoDto = null;
        bool mochilaCheia = false;

        if (Random.Shared.NextDouble() <= 0.30)
        {
            var definicaoItem = await ObterOuCriarDefinicaoItemNaturalAsync();
            var slotsOcupados = await _context.ItensInventario
                .Where(i => i.JogadorId == jogador.Id && !i.Equipado && i.CategoriaAba == definicaoItem.Categoria)
                .Select(i => i.SlotIndice)
                .ToListAsync();

            int slotLivre = -1;
            for (int s = 0; s < PlayerStatsCalculator.TotalSlotsMochila; s++)
            {
                if (!slotsOcupados.Contains(s))
                {
                    slotLivre = s;
                    break;
                }
            }

            if (slotLivre >= 0)
            {
                var novoItem = new ItemInventario
                {
                    JogadorId = jogador.Id,
                    ItemDefinicaoId = definicaoItem.Id,
                    Quantidade = 1,
                    SlotIndice = slotLivre,
                    CategoriaAba = definicaoItem.Categoria,
                    Equipado = false,
                    SlotEquipado = null,
                    ObtidoEmUtc = DateTime.UtcNow
                };
                _context.ItensInventario.Add(novoItem);

                var estatisticaItem = await ObterOuCriarEstatisticaAsync(jogador.Id);
                estatisticaItem.ItensObtidos += 1;
                estatisticaItem.UltimaAtualizacaoUtc = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                novoItem.ItemDefinicao = definicaoItem;
                itemEncontradoDto = MapearItemMochila(novoItem);
            }
            else
            {
                mochilaCheia = true;
            }
        }

        estadoPerm.Concluido = true;
        estadoPerm.BeneficioGratuitoResgatado = true;
        estadoPerm.AtualizadoEmUtc = DateTime.UtcNow;

        var estatistica = await ObterOuCriarEstatisticaAsync(jogador.Id);
        estatistica.MissoesConcluidasCount += 1;
        estatistica.UltimaAtualizacaoUtc = DateTime.UtcNow;

        await RegistrarOuAtualizarHistoricoPlaceAsync(
            jogador.Id, placeId, nome, "Natural Features", sub, request.Latitude, request.Longitude,
            "Vasculhado (Concluído)", concluido: true, beneficioGratuitoResgatado: true);

        await _context.SaveChangesAsync();

        var estadoAtualizado = await MontarEstadoJogadorAsync(jogador.Id);
        string mensagem = itemEncontradoDto != null
            ? $"Você vasculhou {nome} e encontrou +{moedasEncontradas} moedas e 1x {itemEncontradoDto.Nome}!"
            : mochilaCheia
                ? $"Você vasculhou {nome} e encontrou +{moedasEncontradas} moedas (um item foi avistado, mas sua mochila estava cheia)."
                : $"Você vasculhou {nome} e encontrou +{moedasEncontradas} moedas!";

        return Ok(new VasculharNaturalFeatureResponse
        {
            PlaceId = placeId,
            NomePlace = nome,
            MoedasEncontradas = moedasEncontradas,
            ItemEncontrado = itemEncontradoDto,
            MochilaCheia = mochilaCheia,
            Mensagem = mensagem,
            Jogador = estadoAtualizado
        });
    }

    [HttpPost("atual/locais/transporte/viajar")]
    public async Task<ActionResult<ViajarTransporteResponse>> ViajarTransporte([FromBody] ViajarTransporteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DestinoPlaceId))
            return BadRequest(new { message = "Destino de transporte inválido." });

        var sub = (request.SubcategoriaTransporte ?? string.Empty).Trim().ToLowerInvariant();
        if (!PlaceCategoryMapper.IsTransportationSubcategory(sub))
            return BadRequest(new { message = $"Subcategoria de transporte inválida: '{request.SubcategoriaTransporte}'." });

        if (!CoordenadasValidas(request.DestinoLatitude, request.DestinoLongitude))
            return BadRequest(new { message = "Coordenadas de destino inválidas." });

        double distanciaKm = request.DistanciaKm.HasValue && request.DistanciaKm.Value > 0
            ? request.DistanciaKm.Value
            : CoordenadasValidas(request.OrigemLatitude, request.OrigemLongitude)
                ? GooglePlacesClient.CalculateHaversineKm(request.OrigemLatitude, request.OrigemLongitude, request.DestinoLatitude, request.DestinoLongitude)
                : 0.5;

        distanciaKm = Math.Max(0.01, Math.Round(distanciaKm, 3));
        int custoMoedas = Math.Max(1, (int)Math.Ceiling(distanciaKm * 5.0));

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        if (jogador.Moedas < custoMoedas)
            return BadRequest(new { message = $"Moedas insuficientes para a viagem (custo: {custoMoedas}g, saldo: {jogador.Moedas}g)." });

        jogador.Moedas -= custoMoedas;

        var destPlaceId = request.DestinoPlaceId.Trim();
        var destNome = string.IsNullOrWhiteSpace(request.DestinoNome) ? "Terminal de Transporte" : request.DestinoNome.Trim();

        var estatistica = await ObterOuCriarEstatisticaAsync(jogador.Id);
        estatistica.PlacesVisitados += 1;
        estatistica.UltimaAtualizacaoUtc = DateTime.UtcNow;

        await RegistrarOuAtualizarHistoricoPlaceAsync(
            jogador.Id, destPlaceId, destNome, "Transportation", sub, request.DestinoLatitude, request.DestinoLongitude,
            $"Viagem Rápida ({custoMoedas}g)");

        await _context.SaveChangesAsync();

        return Ok(new ViajarTransporteResponse
        {
            DestinoPlaceId = destPlaceId,
            DestinoNome = destNome,
            SubcategoriaTransporte = sub,
            Latitude = request.DestinoLatitude,
            Longitude = request.DestinoLongitude,
            DistanciaKm = distanciaKm,
            CustoMoedas = custoMoedas,
            Jogador = await MontarEstadoJogadorAsync(jogador.Id)
        });
    }

    [HttpPost("atual/locais/sports/treinar")]
    public async Task<ActionResult<TreinarSportsResponse>> TreinarSports([FromBody] TreinarSportsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlaceId))
            return BadRequest(new { message = "PlaceId do local esportivo é obrigatório." });

        var sub = (request.Subcategoria ?? string.Empty).Trim().ToLowerInvariant();
        if (!SportsTrainingMap.TryGetValue(sub, out var treinoInfo))
            return BadRequest(new { message = $"Subcategoria esportiva '{request.Subcategoria}' não possui treinamento configurado." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var placeId = request.PlaceId.Trim();
        var nome = string.IsNullOrWhiteSpace(request.Nome) ? "Centro Esportivo" : request.Nome.Trim();

        var estadoPerm = await ObterOuCriarEstadoPermanentePlaceAsync(jogador.Id, placeId, nome, "Sports", sub, request.Latitude, request.Longitude);
        if (estadoPerm.Concluido)
            return BadRequest(new { message = "O treinamento neste local esportivo já foi realizado e concluído permanentemente." });

        const int custoEnergia = 30;
        if (jogador.EnergiaAtual < custoEnergia)
            return BadRequest(new { message = $"Energia insuficiente para treinar (requer {custoEnergia} de Energia, atual: {Math.Floor(jogador.EnergiaAtual)})." });

        jogador.EnergiaAtual = Math.Max(0, Math.Round(jogador.EnergiaAtual - custoEnergia, 2));

        switch (treinoInfo.Atributo)
        {
            case "dano":
                jogador.DanoBase = Math.Max(1, jogador.DanoBase) + treinoInfo.Bonus;
                break;
            case "velocidade":
                jogador.VelocidadeBase = Math.Max(0, jogador.VelocidadeBase) + treinoInfo.Bonus;
                break;
            case "defesa":
                jogador.DefesaBase = Math.Max(0, jogador.DefesaBase) + treinoInfo.Bonus;
                break;
            case "vida":
                jogador.VidaBase = Math.Max(1, jogador.VidaBase) + treinoInfo.Bonus;
                jogador.VidaAtual += treinoInfo.Bonus;
                break;
        }

        estadoPerm.Concluido = true;
        estadoPerm.BeneficioGratuitoResgatado = true;
        estadoPerm.AtualizadoEmUtc = DateTime.UtcNow;

        var estatistica = await ObterOuCriarEstatisticaAsync(jogador.Id);
        estatistica.MissoesConcluidasCount += 1;
        estatistica.UltimaAtualizacaoUtc = DateTime.UtcNow;

        await RegistrarOuAtualizarHistoricoPlaceAsync(
            jogador.Id, placeId, nome, "Sports", sub, request.Latitude, request.Longitude,
            $"Treino Concluído (+{treinoInfo.Bonus} {treinoInfo.NomeExibicao})",
            concluido: true, beneficioGratuitoResgatado: true);

        await _context.SaveChangesAsync();

        return Ok(new TreinarSportsResponse
        {
            PlaceId = placeId,
            NomePlace = nome,
            Subcategoria = sub,
            AtributoMelhorado = treinoInfo.NomeExibicao,
            BonusAplicado = treinoInfo.Bonus,
            CustoEnergia = custoEnergia,
            Mensagem = $"Treinamento concluído em {nome}! +{treinoInfo.Bonus} de {treinoInfo.NomeExibicao} permanente (-{custoEnergia} de Energia).",
            Jogador = await MontarEstadoJogadorAsync(jogador.Id)
        });
    }

    [HttpPost("atual/locais/services/atributo")]
    public async Task<ActionResult<SortearAtributoServicesResponse>> SortearOuObterAtributoServices([FromBody] SortearAtributoServicesRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlaceId))
            return BadRequest(new { message = "PlaceId do serviço é obrigatório." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var placeId = request.PlaceId.Trim();
        var nome = string.IsNullOrWhiteSpace(request.Nome) ? "Serviço Urbano" : request.Nome.Trim();
        var sub = string.IsNullOrWhiteSpace(request.Subcategoria) ? "consultant" : request.Subcategoria.Trim().ToLowerInvariant();

        var estadoPerm = await ObterOuCriarEstadoPermanentePlaceAsync(jogador.Id, placeId, nome, "Services", sub, request.Latitude, request.Longitude);
        if (string.IsNullOrWhiteSpace(estadoPerm.AtributoBuffFixo) ||
            !AtributosBuffPermitidos.Contains(estadoPerm.AtributoBuffFixo, StringComparer.OrdinalIgnoreCase))
        {
            estadoPerm.AtributoBuffFixo = AtributosBuffPermitidos[Random.Shared.Next(AtributosBuffPermitidos.Length)];
            estadoPerm.AtualizadoEmUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(new SortearAtributoServicesResponse
        {
            PlaceId = placeId,
            AtributoBuffFixo = estadoPerm.AtributoBuffFixo!,
            Jogador = await MontarEstadoJogadorAsync(jogador.Id)
        });
    }

    [HttpPost("atual/locais/services/comprar-buff")]
    public async Task<ActionResult<ComprarBuffServicesResponse>> ComprarBuffServices([FromBody] ComprarBuffServicesRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlaceId))
            return BadRequest(new { message = "PlaceId do local de serviço é obrigatório." });

        int tier = Math.Clamp(request.Tier, 1, 3);
        int custoMoedas = tier switch
        {
            1 => 15,
            2 => 25,
            3 => 35,
            _ => 15
        };

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        if (jogador.Moedas < custoMoedas)
            return BadRequest(new { message = $"Moedas insuficientes para contratar o serviço (custo: {custoMoedas}g, saldo: {jogador.Moedas}g)." });

        var placeId = request.PlaceId.Trim();
        var nome = string.IsNullOrWhiteSpace(request.Nome) ? "Serviço Urbano" : request.Nome.Trim();
        var sub = string.IsNullOrWhiteSpace(request.Subcategoria) ? "consultant" : request.Subcategoria.Trim().ToLowerInvariant();

        var estadoPerm = await ObterOuCriarEstadoPermanentePlaceAsync(jogador.Id, placeId, nome, "Services", sub, request.Latitude, request.Longitude);
        if (string.IsNullOrWhiteSpace(estadoPerm.AtributoBuffFixo) ||
            !AtributosBuffPermitidos.Contains(estadoPerm.AtributoBuffFixo, StringComparer.OrdinalIgnoreCase))
        {
            var sugerido = (request.AtributoSugerido ?? string.Empty).Trim().ToLowerInvariant();
            estadoPerm.AtributoBuffFixo = AtributosBuffPermitidos.Contains(sugerido, StringComparer.OrdinalIgnoreCase)
                ? sugerido
                : AtributosBuffPermitidos[Random.Shared.Next(AtributosBuffPermitidos.Length)];
            estadoPerm.AtualizadoEmUtc = DateTime.UtcNow;
        }

        string atributo = estadoPerm.AtributoBuffFixo!.ToLowerInvariant();
        int bonus = CalcularBonusBuffPorAtributoETier(atributo, tier);
        string nomeExibicaoAtributo = ObterNomeExibicaoAtributoBuff(atributo);
        const int duracaoMinutos = 10;

        jogador.Moedas -= custoMoedas;

        await AplicarOuSubstituirBuffTemporarioAsync(
            jogador, atributo, bonus, duracaoMinutos,
            $"Serviço: {nomeExibicaoAtributo}",
            $"+{bonus} {nomeExibicaoAtributo} por {duracaoMinutos} min");

        await RegistrarOuAtualizarHistoricoPlaceAsync(
            jogador.Id, placeId, nome, "Services", sub, request.Latitude, request.Longitude,
            $"Aprimoramento Contratado (+{bonus} {nomeExibicaoAtributo})");

        await _context.SaveChangesAsync();

        return Ok(new ComprarBuffServicesResponse
        {
            PlaceId = placeId,
            NomePlace = nome,
            AtributoBuff = atributo,
            Tier = tier,
            BonusAplicado = bonus,
            CustoMoedas = custoMoedas,
            DuracaoMinutos = duracaoMinutos,
            Mensagem = $"Serviço contratado em {nome}! +{bonus} de {nomeExibicaoAtributo} por {duracaoMinutos} minutos (-{custoMoedas}g).",
            Jogador = await MontarEstadoJogadorAsync(jogador.Id)
        });
    }

    [HttpPost("atual/locais/culture/aprimorar")]
    public async Task<ActionResult<ReceberAprimoramentoCultureResponse>> ReceberAprimoramentoCulture([FromBody] ReceberAprimoramentoCultureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlaceId))
            return BadRequest(new { message = "PlaceId do ponto cultural é obrigatório." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var placeId = request.PlaceId.Trim();
        var nome = string.IsNullOrWhiteSpace(request.Nome) ? "Ponto Cultural" : request.Nome.Trim();
        var sub = string.IsNullOrWhiteSpace(request.Subcategoria) ? "museum" : request.Subcategoria.Trim().ToLowerInvariant();

        var estadoPerm = await ObterOuCriarEstadoPermanentePlaceAsync(jogador.Id, placeId, nome, "Culture", sub, request.Latitude, request.Longitude);
        if (estadoPerm.Concluido)
            return BadRequest(new { message = "O aprimoramento cultural deste local já foi resgatado e concluído permanentemente." });

        var desejado = (request.AtributoDesejado ?? string.Empty).Trim().ToLowerInvariant();
        string atributo = AtributosBuffPermitidos.Contains(desejado, StringComparer.OrdinalIgnoreCase)
            ? desejado
            : AtributosBuffPermitidos[Random.Shared.Next(AtributosBuffPermitidos.Length)];

        int bonus = CalcularBonusBuffPorAtributoETier(atributo, 3);
        string nomeExibicaoAtributo = ObterNomeExibicaoAtributoBuff(atributo);
        const int duracaoMinutos = 15;

        await AplicarOuSubstituirBuffTemporarioAsync(
            jogador, atributo, bonus, duracaoMinutos,
            $"Cultura: {nomeExibicaoAtributo}",
            $"+{bonus} {nomeExibicaoAtributo} por {duracaoMinutos} min");

        estadoPerm.Concluido = true;
        estadoPerm.BeneficioGratuitoResgatado = true;
        estadoPerm.AtributoBuffFixo = atributo;
        estadoPerm.AtualizadoEmUtc = DateTime.UtcNow;

        var estatistica = await ObterOuCriarEstatisticaAsync(jogador.Id);
        estatistica.MissoesConcluidasCount += 1;
        estatistica.UltimaAtualizacaoUtc = DateTime.UtcNow;

        await RegistrarOuAtualizarHistoricoPlaceAsync(
            jogador.Id, placeId, nome, "Culture", sub, request.Latitude, request.Longitude,
            $"Aprimoramento Cultural (+{bonus} {nomeExibicaoAtributo})",
            concluido: true, beneficioGratuitoResgatado: true);

        await _context.SaveChangesAsync();

        return Ok(new ReceberAprimoramentoCultureResponse
        {
            PlaceId = placeId,
            NomePlace = nome,
            AtributoBuff = atributo,
            BonusAplicado = bonus,
            DuracaoMinutos = duracaoMinutos,
            Mensagem = $"Inspiração cultural recebida em {nome}! +{bonus} de {nomeExibicaoAtributo} gratuitamente por {duracaoMinutos} minutos.",
            Jogador = await MontarEstadoJogadorAsync(jogador.Id)
        });
    }

    [HttpPost("atual/buffs/sincronizar")]
    public async Task<ActionResult<JogadorEstadoDto>> SincronizarBuffsAtivos()
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();
        await LimparBuffsExpiradosAsync(jogador);
        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/locais/concluir-combate")]
    public async Task<ActionResult<JogadorEstadoDto>> ConcluirCombateEmLocal([FromBody] ConcluirCombatePlaceRequest request)
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var atrs = await CalcularAtributosJogadorAsync(jogador);

        jogador.VidaAtual = Math.Clamp(request.VidaRestante, 0, atrs.VidaFinal);

        if (request.EnergiaRestante.HasValue)
        {
            jogador.EnergiaAtual = Math.Clamp(Math.Round(request.EnergiaRestante.Value, 2), 0, atrs.EnergiaMaximaFinal);
        }

        if (request.Vitoria && request.MoedasGanhas > 0)
        {
            jogador.Moedas += request.MoedasGanhas;
        }

        if (request.Vitoria && !string.IsNullOrWhiteSpace(request.PlaceId))
        {
            var placeId = request.PlaceId.Trim();
            var nome = string.IsNullOrWhiteSpace(request.Nome) ? "Local de Combate" : request.Nome.Trim();
            var cat = string.IsNullOrWhiteSpace(request.Categoria) ? "Entertainment and Recreation" : request.Categoria.Trim();
            var sub = string.IsNullOrWhiteSpace(request.Subcategoria) ? "park" : request.Subcategoria.Trim();
            double lat = request.Latitude ?? 0;
            double lng = request.Longitude ?? 0;

            bool ehArena = string.Equals(cat, "Entertainment and Recreation", StringComparison.OrdinalIgnoreCase);
            bool ehBoss = string.Equals(sub, "shopping_mall", StringComparison.OrdinalIgnoreCase) ||
                          string.Equals(request.TipoCombate, "boss", StringComparison.OrdinalIgnoreCase);

            if (ehArena || ehBoss)
            {
                var estadoPerm = await ObterOuCriarEstadoPermanentePlaceAsync(jogador.Id, placeId, nome, cat, sub, lat, lng);
                if (!estadoPerm.Concluido)
                {
                    estadoPerm.Concluido = true;
                    estadoPerm.AtualizadoEmUtc = DateTime.UtcNow;

                    var estatistica = await ObterOuCriarEstatisticaAsync(jogador.Id);
                    estatistica.MissoesConcluidasCount += 1;
                    estatistica.UltimaAtualizacaoUtc = DateTime.UtcNow;
                }

                await RegistrarOuAtualizarHistoricoPlaceAsync(
                    jogador.Id, placeId, nome, cat, sub, lat, lng,
                    ehBoss ? "Boss Derrotado (Concluído)" : "Arena Concluída",
                    concluido: true,
                    beneficioGratuitoResgatado: estadoPerm.BeneficioGratuitoResgatado);
            }
        }

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/retorno")]
    public async Task<ActionResult<RetornoCheckpointResponse>> RetornarParaCheckpoint([FromBody] RetornoCheckpointRequest request)
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var atrs = await CalcularAtributosJogadorAsync(jogador);

        string motivo = (request.Motivo ?? "morte").Trim().ToLowerInvariant();
        string destino = (request.Destino ?? "home").Trim().ToLowerInvariant();

        double destLat = jogador.HomeLatitude ?? -25.4284;
        double destLng = jogador.HomeLongitude ?? -49.2733;
        string destPlaceId = "home";
        string destNome = "Home (Ponto Inicial)";

        if (motivo == "esgotamento")
        {
            if (destino == "hospedagem" &&
                !string.IsNullOrWhiteSpace(jogador.CheckpointEnergiaPlaceId) &&
                jogador.CheckpointEnergiaLatitude.HasValue &&
                jogador.CheckpointEnergiaLongitude.HasValue)
            {
                destLat = jogador.CheckpointEnergiaLatitude.Value;
                destLng = jogador.CheckpointEnergiaLongitude.Value;
                destPlaceId = jogador.CheckpointEnergiaPlaceId!;
                destNome = jogador.CheckpointEnergiaNome ?? "Hospedagem";
                jogador.EnergiaAtual = Math.Max(20, Math.Round(atrs.EnergiaMaximaFinal * 0.25, 2));
            }
            else
            {
                destino = "home";
                jogador.EnergiaAtual = atrs.EnergiaMaximaFinal;
                jogador.VidaAtual = atrs.VidaFinal;
            }
        }
        else
        {
            if (destino == "hospital" &&
                !string.IsNullOrWhiteSpace(jogador.CheckpointVidaPlaceId) &&
                jogador.CheckpointVidaLatitude.HasValue &&
                jogador.CheckpointVidaLongitude.HasValue)
            {
                destLat = jogador.CheckpointVidaLatitude.Value;
                destLng = jogador.CheckpointVidaLongitude.Value;
                destPlaceId = jogador.CheckpointVidaPlaceId!;
                destNome = jogador.CheckpointVidaNome ?? "Hospital";
                jogador.VidaAtual = Math.Max(15, (int)Math.Ceiling(atrs.VidaFinal * 0.50));
                if (jogador.EnergiaAtual <= 0)
                    jogador.EnergiaAtual = Math.Max(20, Math.Round(atrs.EnergiaMaximaFinal * 0.25, 2));
            }
            else
            {
                destino = "home";
                jogador.VidaAtual = atrs.VidaFinal;
                jogador.EnergiaAtual = atrs.EnergiaMaximaFinal;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new RetornoCheckpointResponse
        {
            Motivo = motivo,
            DestinoEscolhido = destino,
            DestinoNome = destNome,
            DestinoPlaceId = destPlaceId,
            Latitude = destLat,
            Longitude = destLng,
            Jogador = await MontarEstadoJogadorAsync(jogador.Id)
        });
    }

    [HttpPut("atual/inventario/{inventarioId:int}/mover")]
    public async Task<ActionResult<JogadorEstadoDto>> MoverItemMochila(int inventarioId, [FromBody] MoverItemMochilaRequest request)
    {
        if (request.NovoSlotIndice < 0 || request.NovoSlotIndice >= PlayerStatsCalculator.TotalSlotsMochila)
            return BadRequest(new { message = $"Slot inválido. Informe um índice entre 0 e {PlayerStatsCalculator.TotalSlotsMochila - 1}." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var itemOrigem = await _context.ItensInventario
            .Include(i => i.ItemDefinicao)
            .FirstOrDefaultAsync(i => i.Id == inventarioId && i.JogadorId == jogador.Id);

        if (itemOrigem == null)
            return NotFound(new { message = "Item não encontrado no inventário do jogador." });

        string abaAlvo = !string.IsNullOrWhiteSpace(request.CategoriaAba)
            ? request.CategoriaAba.Trim()
            : itemOrigem.CategoriaAba;

        var itemNoDestino = await _context.ItensInventario
            .FirstOrDefaultAsync(i =>
                i.JogadorId == jogador.Id &&
                !i.Equipado &&
                i.CategoriaAba == abaAlvo &&
                i.SlotIndice == request.NovoSlotIndice &&
                i.Id != itemOrigem.Id);

        int slotAntigo = itemOrigem.SlotIndice;

        if (itemOrigem.Equipado)
        {
            itemOrigem.Equipado = false;
            itemOrigem.SlotEquipado = null;
        }

        if (itemNoDestino != null)
        {
            itemNoDestino.SlotIndice = slotAntigo;
        }

        itemOrigem.SlotIndice = request.NovoSlotIndice;
        itemOrigem.CategoriaAba = abaAlvo;

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpDelete("atual/inventario/{inventarioId:int}")]
    public async Task<ActionResult<JogadorEstadoDto>> DescartarItemNaLixeira(int inventarioId)
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var item = await _context.ItensInventario
            .FirstOrDefaultAsync(i => i.Id == inventarioId && i.JogadorId == jogador.Id);

        if (item == null)
            return NotFound(new { message = "Item não encontrado na mochila." });

        _context.ItensInventario.Remove(item);

        var estatistica = await ObterOuCriarEstatisticaAsync(jogador.Id);
        estatistica.ItensDescartados += item.Quantidade;
        estatistica.UltimaAtualizacaoUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/inventario/item-debug")]
    public async Task<ActionResult<JogadorEstadoDto>> AdicionarItemDebug()
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var itemDebug = await ObterOuCriarDefinicaoItemDebugAsync();

        var slotsOcupados = await _context.ItensInventario
            .Where(i => i.JogadorId == jogador.Id && !i.Equipado && i.CategoriaAba == itemDebug.Categoria)
            .Select(i => i.SlotIndice)
            .ToListAsync();

        int slotLivre = 0;
        while (slotsOcupados.Contains(slotLivre) && slotLivre < PlayerStatsCalculator.TotalSlotsMochila)
        {
            slotLivre++;
        }

        if (slotLivre >= PlayerStatsCalculator.TotalSlotsMochila)
            return BadRequest(new { message = "A mochila (50 slots) está cheia nesta aba." });

        _context.ItensInventario.Add(new ItemInventario
        {
            JogadorId = jogador.Id,
            ItemDefinicaoId = itemDebug.Id,
            Quantidade = 1,
            SlotIndice = slotLivre,
            CategoriaAba = itemDebug.Categoria,
            Equipado = false,
            SlotEquipado = null,
            ObtidoEmUtc = DateTime.UtcNow
        });

        var estatistica = await ObterOuCriarEstatisticaAsync(jogador.Id);
        estatistica.ItensObtidos += 1;
        estatistica.UltimaAtualizacaoUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPut("atual/equipamentos/equipar")]
    public async Task<ActionResult<JogadorEstadoDto>> EquiparItem([FromBody] EquiparItemRequest request)
    {
        var slotValido = PlayerStatsCalculator.SlotsEquipamentoPadrao
            .FirstOrDefault(s => string.Equals(s.Key, request.SlotKey, StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrEmpty(slotValido.Key))
            return BadRequest(new { message = "Slot de equipamento inválido." });

        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var item = await _context.ItensInventario
            .Include(i => i.ItemDefinicao)
            .FirstOrDefaultAsync(i => i.Id == request.InventarioId && i.JogadorId == jogador.Id);

        if (item == null || item.ItemDefinicao == null)
            return NotFound(new { message = "Item não encontrado no inventário." });

        if (!string.Equals(item.ItemDefinicao.Categoria, "Equipavel", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Apenas itens equipáveis podem ser colocados nos slots de equipamento." });

        if (!string.IsNullOrWhiteSpace(item.ItemDefinicao.SlotEquipamentoCompativel) &&
            !string.Equals(item.ItemDefinicao.SlotEquipamentoCompativel, slotValido.Key, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = $"Este item só pode ser equipado no slot '{item.ItemDefinicao.SlotEquipamentoCompativel}'." });
        }

        var itemAtualmenteEquipado = await _context.ItensInventario
            .FirstOrDefaultAsync(i =>
                i.JogadorId == jogador.Id &&
                i.Equipado &&
                i.SlotEquipado == slotValido.Key &&
                i.Id != item.Id);

        if (itemAtualmenteEquipado != null)
        {
            itemAtualmenteEquipado.Equipado = false;
            itemAtualmenteEquipado.SlotEquipado = null;
            itemAtualmenteEquipado.SlotIndice = item.SlotIndice;
        }

        item.Equipado = true;
        item.SlotEquipado = slotValido.Key;

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPut("atual/equipamentos/desequipar")]
    public async Task<ActionResult<JogadorEstadoDto>> DesequiparItem([FromBody] DesequiparItemRequest request)
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var itemEquipado = await _context.ItensInventario
            .FirstOrDefaultAsync(i =>
                i.JogadorId == jogador.Id &&
                i.Equipado &&
                i.SlotEquipado != null &&
                i.SlotEquipado.ToLower() == request.SlotKey.Trim().ToLower());

        if (itemEquipado == null)
            return NotFound(new { message = "Nenhum item equipado neste slot." });

        int slotDestino = request.SlotMochilaDestino ?? itemEquipado.SlotIndice;
        slotDestino = Math.Clamp(slotDestino, 0, PlayerStatsCalculator.TotalSlotsMochila - 1);

        itemEquipado.Equipado = false;
        itemEquipado.SlotEquipado = null;
        itemEquipado.SlotIndice = slotDestino;

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    [HttpPost("atual/percurso")]
    public async Task<ActionResult<JogadorEstadoDto>> RegistrarPercurso([FromBody] RegistrarPercursoRequest request)
    {
        var jogador = await ObterOuCriarJogadorPadraoAsync();
        var atrs = await CalcularAtributosJogadorAsync(jogador);

        double distanciaValida = Math.Max(0, request.DistanciaKm);
        double energiaGasta = PlayerStatsCalculator.CalcularEnergiaConsumidaNaRota(distanciaValida, atrs.VelocidadeFinal);

        jogador.EnergiaAtual = Math.Max(0, Math.Round(jogador.EnergiaAtual - energiaGasta, 2));

        var estatistica = await ObterOuCriarEstatisticaAsync(jogador.Id);
        estatistica.DistanciaPercorridaKm = Math.Round(estatistica.DistanciaPercorridaKm + distanciaValida, 3);
        if (request.VisitouPlace)
        {
            estatistica.PlacesVisitados += 1;
        }
        estatistica.UltimaAtualizacaoUtc = DateTime.UtcNow;

        if (request.VisitouPlace && !string.IsNullOrWhiteSpace(request.PlaceId) && !string.Equals(request.PlaceId, "home", StringComparison.OrdinalIgnoreCase))
        {
            var placeId = request.PlaceId.Trim();
            var nome = string.IsNullOrWhiteSpace(request.NomePlace) ? "Local Visitado" : request.NomePlace.Trim();
            var cat = (request.CategoriaPlace ?? string.Empty).Trim();
            var sub = (request.SubcategoriaPlace ?? string.Empty).Trim();
            double lat = request.Latitude ?? 0;
            double lng = request.Longitude ?? 0;

            AtualizarCheckpointsPorCategoria(jogador, placeId, nome, cat, sub, lat, lng);
            await RegistrarOuAtualizarHistoricoPlaceAsync(jogador.Id, placeId, nome, cat, sub, lat, lng, "Visitado");
        }

        await _context.SaveChangesAsync();
        return Ok(await MontarEstadoJogadorAsync(jogador.Id));
    }

    private static bool CoordenadasValidas(double lat, double lng) =>
        !double.IsNaN(lat) && !double.IsNaN(lng) && lat is >= -90 and <= 90 && lng is >= -180 and <= 180;

    private static void AtualizarCheckpointsPorCategoria(
        Jogador jogador,
        string placeId,
        string nome,
        string categoria,
        string subcategoria,
        double latitude,
        double longitude)
    {
        if (string.Equals(categoria, "Health and Wellness", StringComparison.OrdinalIgnoreCase))
        {
            jogador.CheckpointVidaPlaceId = placeId;
            jogador.CheckpointVidaNome = nome;
            jogador.CheckpointVidaSubcategoria = string.IsNullOrWhiteSpace(subcategoria) ? "hospital" : subcategoria;
            jogador.CheckpointVidaLatitude = latitude;
            jogador.CheckpointVidaLongitude = longitude;
        }
        else if (string.Equals(categoria, "Lodging", StringComparison.OrdinalIgnoreCase))
        {
            jogador.CheckpointEnergiaPlaceId = placeId;
            jogador.CheckpointEnergiaNome = nome;
            jogador.CheckpointEnergiaSubcategoria = string.IsNullOrWhiteSpace(subcategoria) ? "hotel" : subcategoria;
            jogador.CheckpointEnergiaLatitude = latitude;
            jogador.CheckpointEnergiaLongitude = longitude;
        }
    }

    private async Task<JogadorAtributosDto> CalcularAtributosJogadorAsync(Jogador jogador)
    {
        await LimparBuffsExpiradosAsync(jogador);
        var itens = await _context.ItensInventario
            .Include(i => i.ItemDefinicao)
            .Where(i => i.JogadorId == jogador.Id)
            .ToListAsync();
        var buffs = await _context.BuffsJogadores
            .Where(b => b.JogadorId == jogador.Id && b.Ativo)
            .ToListAsync();
        return PlayerStatsCalculator.CalcularAtributos(jogador, itens, buffs);
    }

    private async Task<EstadoPermanentePlace> ObterOuCriarEstadoPermanentePlaceAsync(
        int jogadorId,
        string placeId,
        string nome,
        string categoria,
        string subcategoria,
        double latitude,
        double longitude)
    {
        var existente = await _context.EstadosPermanentesPlaces
            .FirstOrDefaultAsync(e => e.JogadorId == jogadorId && e.PlaceId == placeId);

        if (existente != null)
        {
            existente.Nome = nome;
            existente.Categoria = categoria;
            existente.Subcategoria = subcategoria;
            if (latitude != 0 || longitude != 0)
            {
                existente.Latitude = latitude;
                existente.Longitude = longitude;
            }
            return existente;
        }

        var novo = new EstadoPermanentePlace
        {
            JogadorId = jogadorId,
            PlaceId = placeId,
            Nome = nome,
            Categoria = categoria,
            Subcategoria = subcategoria,
            Latitude = latitude,
            Longitude = longitude,
            Concluido = false,
            BeneficioGratuitoResgatado = false,
            AtualizadoEmUtc = DateTime.UtcNow
        };
        _context.EstadosPermanentesPlaces.Add(novo);
        await _context.SaveChangesAsync();
        return novo;
    }

    private async Task RegistrarOuAtualizarHistoricoPlaceAsync(
        int jogadorId,
        string placeId,
        string nome,
        string categoria,
        string subcategoria,
        double latitude,
        double longitude,
        string estadoInteracao,
        bool? concluido = null,
        bool? beneficioGratuitoResgatado = null)
    {
        if (string.IsNullOrWhiteSpace(placeId) || string.Equals(placeId, "home", StringComparison.OrdinalIgnoreCase))
            return;

        var estadoPerm = await _context.EstadosPermanentesPlaces
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.JogadorId == jogadorId && e.PlaceId == placeId);

        bool flagConcluido = concluido ?? (estadoPerm?.Concluido ?? false);
        bool flagBeneficio = beneficioGratuitoResgatado ?? (estadoPerm?.BeneficioGratuitoResgatado ?? false);

        var existente = await _context.HistoricoVisitasPlaces
            .FirstOrDefaultAsync(h => h.JogadorId == jogadorId && h.PlaceId == placeId);

        if (existente != null)
        {
            existente.Nome = nome;
            existente.Categoria = categoria;
            existente.Subcategoria = subcategoria;
            existente.Latitude = latitude;
            existente.Longitude = longitude;
            existente.EstadoInteracao = estadoInteracao;
            existente.Concluido = flagConcluido;
            existente.BeneficioGratuitoResgatado = flagBeneficio;
            existente.VisitadoEmUtc = DateTime.UtcNow;
        }
        else
        {
            _context.HistoricoVisitasPlaces.Add(new HistoricoVisitaPlace
            {
                JogadorId = jogadorId,
                PlaceId = placeId,
                Nome = nome,
                Categoria = categoria,
                Subcategoria = subcategoria,
                Latitude = latitude,
                Longitude = longitude,
                EstadoInteracao = estadoInteracao,
                Concluido = flagConcluido,
                BeneficioGratuitoResgatado = flagBeneficio,
                VisitadoEmUtc = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        if (CategoriasComLimiteDe10.Any(c => string.Equals(c, categoria, StringComparison.OrdinalIgnoreCase)))
        {
            var registrosCategoria = await _context.HistoricoVisitasPlaces
                .Where(h => h.JogadorId == jogadorId && h.Categoria == categoria)
                .OrderByDescending(h => h.VisitadoEmUtc)
                .ThenByDescending(h => h.Id)
                .ToListAsync();

            if (registrosCategoria.Count > 10)
            {
                _context.HistoricoVisitasPlaces.RemoveRange(registrosCategoria.Skip(10));
                await _context.SaveChangesAsync();
            }
        }
    }

    private async Task<Jogador> ObterOuCriarJogadorPadraoAsync()
    {
        var jogador = await _context.Jogadores.OrderBy(j => j.Id).FirstOrDefaultAsync();
        if (jogador != null)
            return jogador;

        await DatabaseInitializer.SeedDataAsync(_context);
        return await _context.Jogadores.OrderBy(j => j.Id).FirstAsync();
    }

    private async Task<EstatisticaJogador> ObterOuCriarEstatisticaAsync(int jogadorId)
    {
        var estatistica = await _context.EstatisticasJogadores
            .FirstOrDefaultAsync(e => e.JogadorId == jogadorId);

        if (estatistica != null)
            return estatistica;

        estatistica = new EstatisticaJogador
        {
            JogadorId = jogadorId,
            DistanciaPercorridaKm = 0,
            PlacesVisitados = 0,
            MissoesConcluidasCount = 0,
            ItensObtidos = 1,
            ItensDescartados = 0,
            UltimaAtualizacaoUtc = DateTime.UtcNow
        };
        _context.EstatisticasJogadores.Add(estatistica);
        await _context.SaveChangesAsync();
        return estatistica;
    }

    private async Task<ItemDefinicao> ObterOuCriarDefinicaoItemDebugAsync()
    {
        var item = await _context.ItensDefinicoes
            .FirstOrDefaultAsync(i => i.Codigo == "debug_espada_ferro");

        if (item != null)
            return item;

        item = DatabaseInitializer.CreateDebugSwordDefinition();
        _context.ItensDefinicoes.Add(item);
        await _context.SaveChangesAsync();
        return item;
    }

    private async Task<ItemDefinicao> ObterOuCriarDefinicaoItemNaturalAsync()
    {
        var candidatos = new[]
        {
            new ItemDefinicao
            {
                Codigo = "nat_amuleto_musgo",
                Nome = "Amuleto de Musgo Antigo",
                Descricao = "Relíquia encontrada junto a uma formação natural. Concede +10 de Vida e +2 de Defesa.",
                Categoria = "Equipavel",
                Raridade = "Incomum",
                SlotEquipamentoCompativel = "Acessorio",
                PlaceholderKey = "item_nature_amulet",
                BonusVida = 10,
                BonusDefesa = 2,
                ValorCompra = 25
            },
            new ItemDefinicao
            {
                Codigo = "nat_botas_trilha",
                Nome = "Botas de Trilha Silvestre",
                Descricao = "Calçado leve deixado por exploradores em uma trilha natural. Concede +10 de Velocidade.",
                Categoria = "Equipavel",
                Raridade = "Incomum",
                SlotEquipamentoCompativel = "Botas",
                PlaceholderKey = "item_nature_boots",
                BonusVelocidade = 10,
                ValorCompra = 30
            },
            new ItemDefinicao
            {
                Codigo = "nat_cajado_carvalho",
                Nome = "Bastão de Carvalho",
                Descricao = "Madeira nobre moldada pela natureza. Concede +4 de Dano e +10 de Energia.",
                Categoria = "Equipavel",
                Raridade = "Comum",
                SlotEquipamentoCompativel = "Arma",
                PlaceholderKey = "item_debug_sword",
                BonusDano = 4,
                BonusEnergia = 10,
                ValorCompra = 20
            }
        };

        var sorteado = candidatos[Random.Shared.Next(candidatos.Length)];
        var existente = await _context.ItensDefinicoes
            .FirstOrDefaultAsync(i => i.Codigo == sorteado.Codigo);

        if (existente != null)
            return existente;

        _context.ItensDefinicoes.Add(sorteado);
        await _context.SaveChangesAsync();
        return sorteado;
    }

    private static int CalcularBonusBuffPorAtributoETier(string atributo, int tier)
    {
        int t = Math.Clamp(tier, 1, 3);
        return atributo.ToLowerInvariant() switch
        {
            "vida" or "energia" => t switch { 1 => 15, 2 => 30, _ => 50 },
            _ => t switch { 1 => 3, 2 => 5, _ => 10 }
        };
    }

    private static string ObterNomeExibicaoAtributoBuff(string atributo) =>
        atributo.ToLowerInvariant() switch
        {
            "vida" => "Vida",
            "energia" => "Energia",
            "dano" => "Dano",
            "defesa" => "Defesa",
            "velocidade" => "Velocidade",
            _ => "Dano"
        };

    private static string IdentificarAtributoDoBuff(BuffJogador b)
    {
        if (!string.IsNullOrWhiteSpace(b.Codigo) && b.Codigo.StartsWith("buff_", StringComparison.OrdinalIgnoreCase))
            return b.Codigo["buff_".Length..].ToLowerInvariant();
        if (b.BonusVida > 0) return "vida";
        if (b.BonusEnergia > 0) return "energia";
        if (b.BonusDano > 0) return "dano";
        if (b.BonusDefesa > 0) return "defesa";
        if (b.BonusVelocidade > 0) return "velocidade";
        return "dano";
    }

    private async Task LimparBuffsExpiradosAsync(Jogador jogador)
    {
        var agoraUtc = DateTime.UtcNow;
        var buffsAtivosBanco = await _context.BuffsJogadores
            .Where(b => b.JogadorId == jogador.Id && b.Ativo)
            .ToListAsync();

        var expirados = buffsAtivosBanco
            .Where(b => b.ExpiraEmUtc.HasValue && b.ExpiraEmUtc.Value <= agoraUtc)
            .ToList();

        if (expirados.Count == 0)
            return;

        foreach (var exp in expirados)
        {
            exp.Ativo = false;
        }

        _context.BuffsJogadores.RemoveRange(expirados);

        var restantes = buffsAtivosBanco.Except(expirados).ToList();
        var itens = await _context.ItensInventario
            .Include(i => i.ItemDefinicao)
            .Where(i => i.JogadorId == jogador.Id)
            .ToListAsync();

        var novosAtrs = PlayerStatsCalculator.CalcularAtributos(jogador, itens, restantes);
        if (jogador.VidaAtual > novosAtrs.VidaFinal)
            jogador.VidaAtual = novosAtrs.VidaFinal;
        if (jogador.EnergiaAtual > novosAtrs.EnergiaMaximaFinal)
            jogador.EnergiaAtual = novosAtrs.EnergiaMaximaFinal;
    }

    private async Task AplicarOuSubstituirBuffTemporarioAsync(
        Jogador jogador,
        string atributo,
        int bonus,
        int duracaoMinutos,
        string tituloBuff,
        string descricaoBuff)
    {
        await LimparBuffsExpiradosAsync(jogador);

        string attrNorm = atributo.Trim().ToLowerInvariant();
        string codigoBuff = $"buff_{attrNorm}";
        string placeholderKey = $"buff_{attrNorm}";

        var buffsAtivosMesmoAtributo = await _context.BuffsJogadores
            .Where(b => b.JogadorId == jogador.Id && b.Ativo)
            .ToListAsync();

        int bonusVidaAnterior = 0;
        int bonusEnergiaAnterior = 0;

        foreach (var existente in buffsAtivosMesmoAtributo.Where(b => IdentificarAtributoDoBuff(b) == attrNorm))
        {
            bonusVidaAnterior += existente.BonusVida;
            bonusEnergiaAnterior += existente.BonusEnergia;
            _context.BuffsJogadores.Remove(existente);
        }

        var novoBuff = new BuffJogador
        {
            JogadorId = jogador.Id,
            Codigo = codigoBuff,
            Nome = tituloBuff,
            Descricao = descricaoBuff,
            PlaceholderKey = placeholderKey,
            BonusVida = attrNorm == "vida" ? bonus : 0,
            BonusEnergia = attrNorm == "energia" ? bonus : 0,
            BonusDano = attrNorm == "dano" ? bonus : 0,
            BonusDefesa = attrNorm == "defesa" ? bonus : 0,
            BonusVelocidade = attrNorm == "velocidade" ? bonus : 0,
            Ativo = true,
            ExpiraEmUtc = DateTime.UtcNow.AddMinutes(duracaoMinutos)
        };

        _context.BuffsJogadores.Add(novoBuff);

        if (attrNorm == "vida")
        {
            int deltaVida = bonus - bonusVidaAnterior;
            if (deltaVida > 0)
                jogador.VidaAtual += deltaVida;
        }
        else if (attrNorm == "energia")
        {
            int deltaEnergia = bonus - bonusEnergiaAnterior;
            if (deltaEnergia > 0)
                jogador.EnergiaAtual = Math.Round(jogador.EnergiaAtual + deltaEnergia, 2);
        }
    }

    private async Task<JogadorEstadoDto> MontarEstadoJogadorAsync(int jogadorId)
    {
        var jogadorParaLimpeza = await _context.Jogadores.FirstOrDefaultAsync(j => j.Id == jogadorId);
        if (jogadorParaLimpeza != null)
        {
            await LimparBuffsExpiradosAsync(jogadorParaLimpeza);
            await _context.SaveChangesAsync();
        }

        var jogador = await _context.Jogadores
            .Include(j => j.Personagem)
            .Include(j => j.Estatistica)
            .Include(j => j.Inventario)
                .ThenInclude(i => i.ItemDefinicao)
            .Include(j => j.Buffs)
            .Include(j => j.MissoesConcluidas)
            .Include(j => j.EstadosPermanentesPlaces)
            .Include(j => j.HistoricoVisitas)
            .FirstAsync(j => j.Id == jogadorId);

        var personagem = jogador.Personagem ?? await _context.Personagens.FirstAsync(p => p.Id == 1);
        var estatistica = jogador.Estatistica ?? await ObterOuCriarEstatisticaAsync(jogador.Id);

        var atributos = PlayerStatsCalculator.CalcularAtributos(
            jogador,
            jogador.Inventario,
            jogador.Buffs);

        var slotsEquipamento = PlayerStatsCalculator.SlotsEquipamentoPadrao
            .Select(slotDef =>
            {
                var itemEq = jogador.Inventario.FirstOrDefault(i =>
                    i.Equipado &&
                    i.SlotEquipado != null &&
                    string.Equals(i.SlotEquipado, slotDef.Key, StringComparison.OrdinalIgnoreCase));

                return new SlotEquipamentoDto
                {
                    SlotKey = slotDef.Key,
                    NomeExibicao = slotDef.NomeExibicao,
                    PlaceholderKey = slotDef.PlaceholderKey,
                    ItemEquipado = itemEq != null ? MapearItemMochila(itemEq) : null
                };
            })
            .ToList();

        var itensMochila = jogador.Inventario
            .Where(i => !i.Equipado)
            .OrderBy(i => i.CategoriaAba)
            .ThenBy(i => i.SlotIndice)
            .Select(MapearItemMochila)
            .ToList();

        var buffsAtivos = jogador.Buffs
            .Where(b => b.Ativo && (b.ExpiraEmUtc == null || b.ExpiraEmUtc > DateTime.UtcNow))
            .Select(b => new BuffAtivoDto
            {
                Id = b.Id,
                Codigo = b.Codigo,
                Nome = b.Nome,
                Descricao = b.Descricao,
                PlaceholderKey = b.PlaceholderKey,
                BonusVida = b.BonusVida,
                BonusEnergia = b.BonusEnergia,
                BonusDano = b.BonusDano,
                BonusDefesa = b.BonusDefesa,
                BonusVelocidade = b.BonusVelocidade,
                ExpiraEmUtc = b.ExpiraEmUtc
            })
            .ToList();

        int missoesTotal = Math.Max(estatistica.MissoesConcluidasCount, jogador.MissoesConcluidas.Count);

        LocalCheckpointDto? homeDto = null;
        if (jogador.HomeLatitude.HasValue && jogador.HomeLongitude.HasValue)
        {
            homeDto = new LocalCheckpointDto
            {
                PlaceId = "home",
                Nome = "Home (Ponto Inicial)",
                Categoria = "Home",
                Subcategoria = "home",
                Latitude = jogador.HomeLatitude.Value,
                Longitude = jogador.HomeLongitude.Value
            };
        }

        LocalCheckpointDto? checkpointVidaDto = null;
        if (!string.IsNullOrWhiteSpace(jogador.CheckpointVidaPlaceId) &&
            jogador.CheckpointVidaLatitude.HasValue &&
            jogador.CheckpointVidaLongitude.HasValue)
        {
            checkpointVidaDto = new LocalCheckpointDto
            {
                PlaceId = jogador.CheckpointVidaPlaceId!,
                Nome = jogador.CheckpointVidaNome ?? "Hospital",
                Categoria = "Health and Wellness",
                Subcategoria = jogador.CheckpointVidaSubcategoria ?? "hospital",
                Latitude = jogador.CheckpointVidaLatitude.Value,
                Longitude = jogador.CheckpointVidaLongitude.Value
            };
        }

        LocalCheckpointDto? checkpointEnergiaDto = null;
        if (!string.IsNullOrWhiteSpace(jogador.CheckpointEnergiaPlaceId) &&
            jogador.CheckpointEnergiaLatitude.HasValue &&
            jogador.CheckpointEnergiaLongitude.HasValue)
        {
            checkpointEnergiaDto = new LocalCheckpointDto
            {
                PlaceId = jogador.CheckpointEnergiaPlaceId!,
                Nome = jogador.CheckpointEnergiaNome ?? "Hospedagem",
                Categoria = "Lodging",
                Subcategoria = jogador.CheckpointEnergiaSubcategoria ?? "hotel",
                Latitude = jogador.CheckpointEnergiaLatitude.Value,
                Longitude = jogador.CheckpointEnergiaLongitude.Value
            };
        }

        var locaisConcluidosDto = jogador.EstadosPermanentesPlaces
            .OrderByDescending(e => e.AtualizadoEmUtc)
            .Select(e => new EstadoPermanentePlaceDto
            {
                PlaceId = e.PlaceId,
                Nome = e.Nome,
                Categoria = e.Categoria,
                Subcategoria = e.Subcategoria,
                Latitude = e.Latitude,
                Longitude = e.Longitude,
                Concluido = e.Concluido,
                BeneficioGratuitoResgatado = e.BeneficioGratuitoResgatado,
                AtributoBuffFixo = e.AtributoBuffFixo,
                AtualizadoEmUtc = e.AtualizadoEmUtc
            })
            .ToList();

        var historicoDto = jogador.HistoricoVisitas
            .OrderByDescending(h => h.VisitadoEmUtc)
            .ThenByDescending(h => h.Id)
            .Select(h => new HistoricoVisitaPlaceDto
            {
                PlaceId = h.PlaceId,
                Nome = h.Nome,
                Categoria = h.Categoria,
                Subcategoria = h.Subcategoria,
                Latitude = h.Latitude,
                Longitude = h.Longitude,
                EstadoInteracao = h.EstadoInteracao,
                Concluido = h.Concluido,
                BeneficioGratuitoResgatado = h.BeneficioGratuitoResgatado,
                VisitadoEmUtc = h.VisitadoEmUtc
            })
            .ToList();

        return new JogadorEstadoDto
        {
            Id = jogador.Id,
            Nome = jogador.Nome,
            Nivel = jogador.Nivel,
            XP = jogador.XP,
            Moedas = jogador.Moedas,
            PersonagemId = personagem.Id,
            PersonagemAtual = new PersonagemResumoDto
            {
                Id = personagem.Id,
                Nome = personagem.Nome,
                Descricao = personagem.Descricao,
                Vantagem = personagem.Vantagem,
                PlaceholderKey = personagem.PlaceholderKey,
                Disponivel = personagem.Disponivel
            },
            Atributos = atributos,
            Equipamentos = slotsEquipamento,
            Mochila = itensMochila,
            Buffs = buffsAtivos,
            Estatisticas = new EstatisticasJogadorDto
            {
                DistanciaPercorridaKm = estatistica.DistanciaPercorridaKm,
                PlacesVisitados = estatistica.PlacesVisitados,
                MissoesConcluidas = missoesTotal,
                ItensObtidos = estatistica.ItensObtidos,
                ItensDescartados = estatistica.ItensDescartados,
                PersonagemUtilizado = personagem.Nome
            },
            Home = homeDto,
            CheckpointVida = checkpointVidaDto,
            CheckpointEnergia = checkpointEnergiaDto,
            LocaisConcluidos = locaisConcluidosDto,
            HistoricoVisitas = historicoDto
        };
    }

    private static ItemMochilaDto MapearItemMochila(ItemInventario inv)
    {
        var def = inv.ItemDefinicao ?? new ItemDefinicao();
        return new ItemMochilaDto
        {
            InventarioId = inv.Id,
            ItemDefinicaoId = def.Id,
            Codigo = def.Codigo,
            Nome = def.Nome,
            Descricao = def.Descricao,
            Categoria = def.Categoria,
            CategoriaAba = inv.CategoriaAba,
            Raridade = def.Raridade,
            SlotEquipamentoCompativel = def.SlotEquipamentoCompativel,
            PlaceholderKey = def.PlaceholderKey,
            Quantidade = inv.Quantidade,
            SlotIndice = inv.SlotIndice,
            Equipado = inv.Equipado,
            SlotEquipado = inv.SlotEquipado,
            BonusVida = def.BonusVida,
            BonusEnergia = def.BonusEnergia,
            BonusDano = def.BonusDano,
            BonusDefesa = def.BonusDefesa,
            BonusVelocidade = def.BonusVelocidade
        };
    }
}
