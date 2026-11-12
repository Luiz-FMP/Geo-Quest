namespace GeoQuest.Api.DTOs;

public class InimigoCombateDto
{
    public string InstanciaId { get; set; } = Guid.NewGuid().ToString("N");
    public string Nome { get; set; } = string.Empty;
    public int VidaMaxima { get; set; }
    public int VidaAtual { get; set; }
    public int Ataque { get; set; }
    public int Defesa { get; set; }
    public int Velocidade { get; set; }
    public int RecompensaXP { get; set; }
    public string Tier { get; set; } = "Normal";
}

public class SessaoCombateDto
{
    public string TipoCombate { get; set; } = string.Empty;
    public string NomeLocal { get; set; } = string.Empty;
    public bool PermiteFuga { get; set; }
    public List<List<InimigoCombateDto>> Rondas { get; set; } = new();
}
