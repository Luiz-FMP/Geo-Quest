namespace MeuSistema.Models;

public class MissaoJogador
{
    public int Id { get; set; }

    public int JogadorId { get; set; }

    public int MissaoId { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime DataInicio { get; set; } = DateTime.UtcNow;

    public DateTime? DataConclusao { get; set; }

    public Jogador Jogador { get; set; } = null!;

    public Missao Missao { get; set; } = null!;
}