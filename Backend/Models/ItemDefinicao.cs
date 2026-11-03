namespace GeoQuest.Api.Models;

public static class CategoriasItem
{
    public const string Equipavel = "Equipavel";
    public const string Consumivel = "Consumivel";

    public static readonly string[] Todas = [Equipavel, Consumivel];
}

public static class RaridadesItem
{
    public const string Comum = "Comum";
    public const string Incomum = "Incomum";
    public const string Raro = "Raro";
    public const string Epico = "Épico";
    public const string Lendario = "Lendário";

    public static readonly string[] Todas = [Comum, Incomum, Raro, Epico, Lendario];
}

public static class SlotsEquipamento
{
    public const string Cabeca = "Cabeca";
    public const string Superior = "Superior";
    public const string Inferior = "Inferior";
    public const string Maos = "Maos";
    public const string Botas = "Botas";
    public const string Acessorio = "Acessorio";
    public const string Arma = "Arma";

    public static readonly string[] Todos =
    [
        Cabeca,
        Superior,
        Inferior,
        Maos,
        Botas,
        Acessorio,
        Arma
    ];

    public static string ObterRotulo(string slot) => slot switch
    {
        Cabeca => "Cabeça",
        Superior => "Superior",
        Inferior => "Inferior",
        Maos => "Mãos",
        Botas => "Botas",
        Acessorio => "Acessório",
        Arma => "Arma",
        _ => slot
    };
}

public class ItemDefinicao
{
    public int Id { get; set; }

    public string Codigo { get; set; } = string.Empty;

    public string Nome { get; set; } = string.Empty;

    public string Descricao { get; set; } = string.Empty;

    public string Categoria { get; set; } = CategoriasItem.Equipavel;

    public string Raridade { get; set; } = RaridadesItem.Comum;

    public bool Equipavel { get; set; }

    public string? SlotEquipamentoCompativel { get; set; }

    public int BonusVida { get; set; }

    public double BonusEnergia { get; set; }

    public int BonusDano { get; set; }

    public int BonusDefesa { get; set; }

    public int BonusVelocidade { get; set; }

    public string PlaceholderKey { get; set; } = "item_placeholder";
}

