namespace MeuSistema.Models;

public class Jogador
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public int PersonagemId { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public Personagem Personagem { get; set; } = null!;

    public ICollection<MissaoJogador> MissoesJogadores { get; set; }
    = new List<MissaoJogador>();
}