namespace GeoQuest.Api.Models;

public class BuffJogador
{
    public int Id { get; set; }

    public int JogadorId { get; set; }

    public string Codigo { get; set; } = string.Empty;

    public string Nome { get; set; } = string.Empty;

    public string Descricao { get; set; } = string.Empty;

    public int BonusVida { get; set; }

    public double BonusEnergia { get; set; }

    public int BonusDano { get; set; }

    public int BonusDefesa { get; set; }

    public int BonusVelocidade { get; set; }

    public int? DuracaoSegundos { get; set; }

    public string CondicaoDuracao { get; set; } = "Temporario";

    public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiraEmUtc { get; set; }

    public bool Ativo { get; set; } = true;

    public string PlaceholderKey { get; set; } = "buff_placeholder";

    public Jogador? Jogador { get; set; }
}

