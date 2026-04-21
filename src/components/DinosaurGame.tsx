import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DinosaurGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver'>('waiting');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('dinoHighScore') || '0', 10));

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 200;
  const GROUND_HEIGHT = 20;
  const DINO_WIDTH = 40;
  const DINO_HEIGHT = 40;
  const DINO_X = 50;
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const OBSTACLE_SPEED = 6;
  const OBSTACLE_SPAWN_RATE = 0.005;

  // Game variables
  const dinoYRef = useRef(CANVAS_HEIGHT - GROUND_HEIGHT - DINO_HEIGHT);
  const dinoVelocityRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const animationIdRef = useRef<number>();
  const scoreRef = useRef(0);

  const resetGame = useCallback(() => {
    dinoYRef.current = CANVAS_HEIGHT - GROUND_HEIGHT - DINO_HEIGHT;
    dinoVelocityRef.current = 0;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameState('waiting');
  }, []);

  const jump = useCallback(() => {
    if (gameState === 'waiting') {
      setGameState('playing');
    } else if (gameState === 'playing' && dinoYRef.current === CANVAS_HEIGHT - GROUND_HEIGHT - DINO_HEIGHT) {
      dinoVelocityRef.current = JUMP_FORCE;
    } else if (gameState === 'gameOver') {
      resetGame();
    }
  }, [gameState, resetGame]);

  const checkCollision = useCallback((dinoX: number, dinoY: number, obstacle: Obstacle): boolean => {
    return (
      dinoX < obstacle.x + obstacle.width &&
      dinoX + DINO_WIDTH > obstacle.x &&
      dinoY < obstacle.y + obstacle.height &&
      dinoY + DINO_HEIGHT > obstacle.y
    );
  }, []);

  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update dinosaur
    dinoVelocityRef.current += GRAVITY;
    dinoYRef.current += dinoVelocityRef.current;
    if (dinoYRef.current > CANVAS_HEIGHT - GROUND_HEIGHT - DINO_HEIGHT) {
      dinoYRef.current = CANVAS_HEIGHT - GROUND_HEIGHT - DINO_HEIGHT;
      dinoVelocityRef.current = 0;
    }

    // Update obstacles
    obstaclesRef.current = obstaclesRef.current.filter(obstacle => {
      obstacle.x -= OBSTACLE_SPEED;
      return obstacle.x + obstacle.width > 0;
    });

    // Spawn new obstacles
    if (Math.random() < OBSTACLE_SPAWN_RATE) {
      const height = Math.random() * 30 + 20;
      obstaclesRef.current.push({
        x: CANVAS_WIDTH,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - height,
        width: 20,
        height: height,
      });
    }

    // Check collisions
    for (const obstacle of obstaclesRef.current) {
      if (checkCollision(DINO_X, dinoYRef.current, obstacle)) {
        setGameState('gameOver');
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
          localStorage.setItem('dinoHighScore', scoreRef.current.toString());
        }
        return;
      }
    }

    // Update score
    scoreRef.current += 1;
    setScore(scoreRef.current);
  }, [gameState, checkCollision, highScore]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground
    ctx.fillStyle = '#000';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Draw dinosaur
    ctx.fillStyle = '#000';
    ctx.fillRect(DINO_X, dinoYRef.current, DINO_WIDTH, DINO_HEIGHT);

    // Draw obstacles
    ctx.fillStyle = '#000';
    for (const obstacle of obstaclesRef.current) {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    // Draw text
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    if (gameState === 'waiting') {
      ctx.fillText('Press SPACE or UP to start', CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2);
    } else if (gameState === 'gameOver') {
      ctx.fillText('Game Over! Press SPACE or UP to restart', CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2);
    }
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`High Score: ${highScore}`, 10, 60);
  }, [gameState, score, highScore]);

  const gameLoop = useCallback(() => {
    updateGame();
    draw();
    animationIdRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, draw]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationIdRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      draw(); // Draw once for static states
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [gameState, gameLoop, draw]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300 bg-white"
      />
    </div>
  );
};

export default DinosaurGame;
