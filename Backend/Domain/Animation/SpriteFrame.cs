namespace GeoQuest.Domain.Animation
{
    /// <summary>
    /// Representa um recorte retangular (Source Rectangle) no sprite sheet
    /// com coordenadas e ponto de ancoragem para estabilização de pés no chão.
    /// </summary>
    public class SpriteFrame
    {
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }

        /// <summary>
        /// Ponto de ancoragem horizontal relativo (0.0 = esquerda, 0.5 = centro, 1.0 = direita).
        /// Padrão é 0.5f (centro do corpo).
        /// </summary>
        public float AnchorX { get; set; } = 0.5f;

        /// <summary>
        /// Ponto de ancoragem vertical relativo (0.0 = topo da cabeça, 1.0 = sola dos pés).
        /// Padrão é 1.0f (pés no chão).
        /// </summary>
        public float AnchorY { get; set; } = 1.0f;

        public SpriteFrame() { }

        public SpriteFrame(int x, int y, int width, int height, float anchorX = 0.5f, float anchorY = 1.0f)
        {
            X = x;
            Y = y;
            Width = width;
            Height = height;
            AnchorX = anchorX;
            AnchorY = anchorY;
        }

        /// <summary>
        /// Calcula a coordenada X e Y onde o sprite deve ser desenhado na tela
        /// para que a âncora fique exatamente na posição de solo desejada (groundX, groundY).
        /// </summary>
        public (int DrawX, int DrawY) CalculateDrawPosition(float groundX, float groundY, float scale = 1.0f)
        {
            int drawX = (int)System.MathF.Round(groundX - (Width * scale * AnchorX));
            int drawY = (int)System.MathF.Round(groundY - (Height * scale * AnchorY));
            return (drawX, drawY);
        }
    }
}

