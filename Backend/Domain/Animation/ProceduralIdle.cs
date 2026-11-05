using System;

namespace GeoQuest.Domain.Animation
{
    /// <summary>
    /// Fornece movimento procedural sutil (squash & stretch e respiração senoidal)
    /// como alternativa ou complemento a animações baseadas em poucos frames.
    /// </summary>
    public class ProceduralIdle
    {
        /// <summary>
        /// Frequência do ciclo de respiração em radianos por segundo.
        /// </summary>
        public float Frequency { get; set; } = 2.4f;

        /// <summary>
        /// Amplitude da oscilação vertical em pixels.
        /// </summary>
        public float AmplitudeY { get; set; } = 1.5f;

        /// <summary>
        /// Variação percentual de escala para simular expansão pulmonar (ex: 0.015 = 1.5%).
        /// </summary>
        public float ScaleBreath { get; set; } = 0.012f;

        private float _timeAccumulator = 0f;

        public void Update(float deltaTime)
        {
            _timeAccumulator += deltaTime;
        }

        public void Reset()
        {
            _timeAccumulator = 0f;
        }

        /// <summary>
        /// Calcula as alterações de escala e deslocamento preservando a estabilidade dos pés.
        /// </summary>
        public void Apply(
            float groundX, 
            float groundY, 
            SpriteFrame frame,
            float baseScale,
            out int finalDrawX, 
            out int finalDrawY, 
            out float finalScaleX, 
            out float finalScaleY)
        {
            float wave = MathF.Sin(_timeAccumulator * Frequency);

            // Squash & stretch: quando o peito expande em Y, contrai discretamente em X
            finalScaleY = baseScale * (1.0f + (wave * ScaleBreath));
            finalScaleX = baseScale * (1.0f - (wave * ScaleBreath * 0.5f));

            float offsetY = wave * AmplitudeY;

            // Mantém os pés ancorados no chão da arena
            finalDrawX = (int)MathF.Round(groundX - (frame.Width * finalScaleX * frame.AnchorX));
            finalDrawY = (int)MathF.Round(groundY - (frame.Height * finalScaleY * frame.AnchorY) + offsetY);
        }
    }
}

