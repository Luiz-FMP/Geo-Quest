using System;
using System.Collections.Generic;

namespace GeoQuest.Domain.Animation
{
    /// <summary>
    /// Armazena a sequência ordenada de frames de uma ação específica,
    /// a taxa de atualização e regras de repetição (Loop normal ou Ping-Pong).
    /// </summary>
    public class Animation
    {
        public string Name { get; set; } = string.Empty;
        public List<SpriteFrame> Frames { get; set; } = new List<SpriteFrame>();

        /// <summary>
        /// Duração em segundos de cada frame (ex: 0.18s = ~5.5 FPS na animação).
        /// </summary>
        public float FrameDuration { get; set; } = 0.18f;

        /// <summary>
        /// Se deve reiniciar automaticamente ao terminar.
        /// </summary>
        public bool IsLooping { get; set; } = true;

        /// <summary>
        /// Modo de reprodução vai-e-volta (1 -> 2 -> 3 -> 2 -> 1).
        /// Cria sensação natural de respiração contínua em animações de Idle.
        /// </summary>
        public bool IsPingPong { get; set; } = false;

        /// <summary>
        /// Fator multiplicador de velocidade (1.0 = velocidade normal).
        /// </summary>
        public float PlaybackSpeed { get; set; } = 1.0f;

        public int FrameCount => Frames.Count;

        public Animation() { }

        public Animation(string name, float frameDuration = 0.18f, bool isLooping = true, bool isPingPong = false, float playbackSpeed = 1.0f)
        {
            Name = name;
            FrameDuration = frameDuration;
            IsLooping = isLooping;
            IsPingPong = isPingPong;
            PlaybackSpeed = playbackSpeed;
        }

        public void AddFrame(SpriteFrame frame)
        {
            Frames.Add(frame);
        }

        public SpriteFrame? GetFrame(int index)
        {
            if (Frames.Count == 0) return null;
            int clamped = Math.Clamp(index, 0, Frames.Count - 1);
            return Frames[clamped];
        }
    }
}
