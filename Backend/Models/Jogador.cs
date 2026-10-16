namespace GeoQuest.Api.Models;

public class Jogador
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public int PersonagemId { get; set; }

    public DateTime DataCriacao { get; set; }

    public Personagem? Personagem { get; set; }

    public ICollection<MissaoConcluida> MissoesConcluidas { get; set; }
        = new List<MissaoConcluida>();
}
