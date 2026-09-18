namespace MeuSistema.Models;

public class Missao
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Descricao { get; set; } = string.Empty;

    public string Tipo { get; set; } = string.Empty;

    public int PontoInteresseId { get; set; }

    public int Recompensa { get; set; }

    public PontoInteresse PontoInteresse { get; set; } = null!;

    public ICollection<MissaoJogador> MissoesJogadores { get; set; }
        = new List<MissaoJogador>();
}