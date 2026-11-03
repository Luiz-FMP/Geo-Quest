namespace GeoQuest.Api.Models;

public class ItemInventario
{
    public int Id { get; set; }

    public int JogadorId { get; set; }

    public int ItemDefinicaoId { get; set; }

    /// <summary>
    /// Aba da mochila ("Equipavel" ou "Consumivel").
    /// </summary>
    public string CategoriaAba { get; set; } = CategoriasItem.Equipavel;

    /// <summary>
    /// Índice do slot na mochila (0 a 49). Null quando o item está equipado.
    /// </summary>
    public int? SlotIndice { get; set; }

    public bool Equipado { get; set; }

    /// <summary>
    /// Identificador do slot de equipamento quando Equipado == true.
    /// </summary>
    public string? SlotEquipado { get; set; }

    public int Quantidade { get; set; } = 1;

    public DateTime DataObtencaoUtc { get; set; } = DateTime.UtcNow;

    public Jogador? Jogador { get; set; }

    public ItemDefinicao? ItemDefinicao { get; set; }
}

