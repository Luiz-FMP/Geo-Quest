using System;
using System.Collections.Generic;

namespace GeoQuest.Domain.Animation
{
    /// <summary>
    /// Gerencia o estado da animação ativa, calcula o avanço temporal baseado em deltaTime
    /// e fornece o frame atual para a camada de renderização.
    /// Totalmente desacoplado de dependências gráficas específicas.
    /// </summary>
    public class Animator
    {
        private readonly Dictionary<string, Animation> _animations = new(StringComparer.OrdinalIgnoreCase);

        public Animation? CurrentAnimation { get; private set; }
        public int CurrentFrameIndex { get; private set; }
        public float Timer { get; private set; }
        public bool IsPlaying { get; private set; } = true;

        // Sentido de reprodução em modo Ping-Pong (+1 avança, -1 recua)
        private int _pingPongDirection = 1;

        public IReadOnlyDictionary<string, Animation> Animations => _animations;

        public void AddAnimation(Animation animation)
        {
            _animations[animation.Name] = animation;

            // Se for a primeira animação adicionada ou se chamar "idle", define como padrão
            if (CurrentAnimation == null || animation.Name.Equals("idle", StringComparison.OrdinalIgnoreCase))
            {
                Play(animation.Name);
            }
        }

        public void Play(string animationName)
        {
            if (!_animations.TryGetValue(animationName, out var targetAnimation))
            {
                throw new ArgumentException($"Animação '{animationName}' não está registrada neste Animator.");
            }

            if (CurrentAnimation == targetAnimation && IsPlaying)
            {
                return;
            }

            CurrentAnimation = targetAnimation;
            CurrentFrameIndex = 0;
            Timer = 0f;
            _pingPongDirection = 1;
            IsPlaying = true;
        }

        public void Stop()
        {
            IsPlaying = false;
        }

        public void Reset()
        {
            CurrentFrameIndex = 0;
            Timer = 0f;
            _pingPongDirection = 1;
        }

        /// <summary>
        /// Atualiza o acumulador de tempo com deltaTime em segundos.
        /// Garante cadência uniforme de quadros independente da taxa de FPS do computador.
        /// </summary>
        /// <param name="deltaTime">Tempo decorrido em segundos desde o último frame.</param>
        public void Update(float deltaTime)
        {
            if (!IsPlaying || CurrentAnimation == null || CurrentAnimation.FrameCount <= 1)
            {
                return;
            }

            float speed = MathF.Max(CurrentAnimation.PlaybackSpeed, 0.001f);
            float effectiveDuration = CurrentAnimation.FrameDuration / speed;

            Timer += deltaTime;

            // Consome o tempo acumulado avançando os frames
            while (Timer >= effectiveDuration)
            {
                Timer -= effectiveDuration;

                if (CurrentAnimation.IsPingPong)
                {
                    AdvancePingPong();
                }
                else
                {
                    AdvanceLoop();
                }
            }
        }

        private void AdvanceLoop()
        {
            if (CurrentAnimation == null) return;

            if (CurrentFrameIndex + 1 < CurrentAnimation.FrameCount)
            {
                CurrentFrameIndex++;
            }
            else
            {
                if (CurrentAnimation.IsLooping)
                {
                    CurrentFrameIndex = 0;
                }
                else
                {
                    IsPlaying = false;
                }
            }
        }

        private void AdvancePingPong()
        {
            if (CurrentAnimation == null) return;

            int nextIndex = CurrentFrameIndex + _pingPongDirection;

            if (nextIndex >= CurrentAnimation.FrameCount)
            {
                _pingPongDirection = -1;
                CurrentFrameIndex = Math.Max(0, CurrentAnimation.FrameCount - 2);
            }
            else if (nextIndex < 0)
            {
                if (CurrentAnimation.IsLooping)
                {
                    _pingPongDirection = 1;
                    CurrentFrameIndex = Math.Min(1, CurrentAnimation.FrameCount - 1);
                }
                else
                {
                    CurrentFrameIndex = 0;
                    IsPlaying = false;
                }
            }
            else
            {
                CurrentFrameIndex = nextIndex;
            }
        }

        /// <summary>
        /// Retorna o recorte do frame ativo pronto para ser desenhado.
        /// </summary>
        public SpriteFrame? GetCurrentFrame()
        {
            return CurrentAnimation?.GetFrame(CurrentFrameIndex);
        }
    }
}
