namespace GeoQuest.Api.DTOs;

public class IniciarCombateRequest
{
    public int JogadorId { get; set; }
    public string TipoCombate { get; set; } = "Emboscada"; // "Emboscada", "Arena", "Boss"
    public string NomeLocal { get; set; } = string.Empty;
    public int? CidadeId { get; set; }
}

public class CombatenteInimigoDto
{
    public string InstanciaId { get; set; } = Guid.NewGuid().ToString();
    public int OrigemId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Tier { get; set; } = "Comum"; // "Comum", "MiniBoss", "Boss"
    public int VidaMaxima { get; set; }
    public int VidaAtual { get; set; }
    public int Ataque { get; set; }
    public int Defesa { get; set; }
    public int Velocidade { get; set; }
}

public class SessaoCombateDto
{
    public string TipoCombate { get; set; } = string.Empty;
    public string NomeLocal { get; set; } = string.Empty;
    public bool PermiteFuga { get; set; }
    public List<List<CombatenteInimigoDto>> Rondas { get; set; } = new();
}