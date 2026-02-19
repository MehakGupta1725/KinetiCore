import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
//  GAME DATA
// ─────────────────────────────────────────────
const GAMES = [
  {
    id: "gravity-well",
    name: "GRAVITY WELL",
    exercise: "Squats",
    mechanic: "Pilot your ship through asteroid fields — squat to descend into safe corridors",
    color: "#00fff7",
    accent: "#a855f7",
    icon: "🚀",
    stat: "ASTEROIDS DODGED",
    statValue: "423",
    difficulty: 2,
    xpReward: 90,
    active: true,
  },
  {
    id: "neon-slicer",
    name: "NEON SLICER",
    exercise: "High Knees / Jumping Jacks",
    mechanic: "Slice floating Energy Cores with your hands and knees before they overload",
    color: "#ff00aa",
    accent: "#00fff7",
    icon: "⚡",
    stat: "CORES SLICED",
    statValue: "1,847",
    difficulty: 3,
    xpReward: 120,
    active: false,
  },
  {
    id: "shield-wall",
    name: "SHIELD WALL",
    exercise: "Lunges",
    mechanic: "Lunge left or right to position your Power Shield and block incoming laser fire",
    color: "#f97316",
    accent: "#facc15",
    icon: "🛡",
    stat: "SHOTS BLOCKED",
    statValue: "2,301",
    difficulty: 4,
    xpReward: 150,
    active: false,
  },
  {
    id: "titan-climb",
    name: "TITAN CLIMB",
    exercise: "Mountain Climbers",
    mechanic: "Scale a digital skyscraper — each leg drive pulls you one floor higher",
    color: "#22c55e",
    accent: "#00fff7",
    icon: "🏗",
    stat: "FLOORS CLIMBED",
    statValue: "9,112",
    difficulty: 5,
    xpReward: 200,
    active: false,
  },
  {
    id: "pulse-defender",
    name: "PULSE DEFENDER",
    exercise: "Push-ups",
    mechanic: "Lower to charge your laser beam, push up to fire it at the boss",
    color: "#ef4444",
    accent: "#ff00aa",
    icon: "💥",
    stat: "BOSSES DEFEATED",
    statValue: "77",
    difficulty: 5,
    xpReward: 250,
    active: false,
  },
];

const LEADERBOARD = [
  { rank: 1, name: "VORTEX_X",  aura: "🔥", score: "88,240 XP", streak: 14 },
  { rank: 2, name: "KYRA_NULL", aura: "⚡", score: "74,190 XP", streak: 9  },
  { rank: 3, name: "DR4KE",     aura: "💀", score: "61,880 XP", streak: 7  },
  { rank: 4, name: "NOMAD_7",   aura: "🌀", score: "55,340 XP", streak: 5  },
  { rank: 5, name: "YOU?",      aura: "❓", score: "— XP",      streak: 0  },
];

// ─────────────────────────────────────────────
//  GRAVITY WELL GAME (Canvas)
// ─────────────────────────────────────────────
function GravityWellGame({ poseData }) {
  const canvasRef = useRef(null);
  const gameRef   = useRef({
    shipY:       250,
    targetY:     250,
    asteroids:   [],
    particles:   [],
    score:       0,
    alive:       true,
    frameId:     null,
    tick:        0,
  });

  useEffect(() => {
    // Move ship based on squat
    if (poseData) {
      gameRef.current.targetY = poseData.isSquatting ? 380 : 120;
    }
  }, [poseData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const g = gameRef.current;

    function spawnAsteroid() {
      g.asteroids.push({
        x: W + 40,
        y: Math.random() * (H - 60) + 30,
        r: 18 + Math.random() * 22,
        speed: 2.5 + Math.random() * 2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        color: Math.random() > 0.5 ? "#a855f7" : "#f97316",
      });
    }

    function spawnParticle(x, y, color) {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        g.particles.push({
          x, y,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          life: 1,
          color,
        });
      }
    }

    function drawShip(x, y) {
      ctx.save();
      ctx.translate(x, y);
      // Engine glow
      ctx.shadowBlur  = 20;
      ctx.shadowColor = "#00fff7";
      // Body
      ctx.fillStyle = "#00fff7";
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-14, -10);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-14, 10);
      ctx.closePath();
      ctx.fill();
      // Engine flame
      ctx.fillStyle = g.tick % 6 < 3 ? "#ff00aa" : "#facc15";
      ctx.beginPath();
      ctx.moveTo(-8, -5);
      ctx.lineTo(-22, 0);
      ctx.lineTo(-8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawAsteroid(a) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.strokeStyle = a.color;
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = a.color;
      ctx.beginPath();
      const sides = 7;
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 / sides) * i;
        const rad   = a.r * (0.8 + Math.random() * 0.2);
        i === 0
          ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
          : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    function drawHUD() {
      // Score
      ctx.fillStyle   = "#00fff7";
      ctx.font        = "bold 13px 'Orbitron', monospace";
      ctx.shadowBlur  = 8;
      ctx.shadowColor = "#00fff7";
      ctx.fillText(`SCORE: ${g.score}`, 14, 24);
      // Squat prompt
      ctx.fillStyle   = "#ffffff44";
      ctx.font        = "11px 'Share Tech Mono', monospace";
      ctx.shadowBlur  = 0;
      ctx.fillText("SQUAT → DESCEND  |  STAND → ASCEND", W / 2 - 130, H - 12);
    }

    function loop() {
      g.tick++;
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#030310");
      bg.addColorStop(1, "#0a0520");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 137 + g.tick * 0.5) % W);
        const sy = ((i * 97)  % H);
        const ss = i % 3 === 0 ? 1.5 : 0.8;
        ctx.fillRect(sx, sy, ss, ss);
      }

      // Grid lines
      ctx.strokeStyle = "#00fff708";
      ctx.lineWidth   = 1;
      for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // Spawn asteroids
      if (g.tick % 60 === 0) spawnAsteroid();

      // Smooth ship movement
      g.shipY += (g.targetY - g.shipY) * 0.08;

      // Update asteroids
      g.asteroids = g.asteroids.filter(a => {
        a.x   -= a.speed;
        a.rot += a.rotSpeed;
        // Collision with ship
        const dx   = a.x - 80;
        const dy   = a.y - g.shipY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < a.r + 14) {
          spawnParticle(a.x, a.y, a.color);
          g.alive = false;
          return false;
        }
        if (a.x < -50) {
          g.score++;
          return false;
        }
        drawAsteroid(a);
        return true;
      });

      // Draw particles
      g.particles = g.particles.filter(p => {
        p.x    += p.vx;
        p.y    += p.vy;
        p.life -= 0.04;
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
        return p.life > 0;
      });

      // Draw ship
      if (g.alive) {
        drawShip(80, g.shipY);
      } else {
        // Game over
        ctx.fillStyle   = "#ef4444";
        ctx.font        = "bold 28px 'Orbitron', monospace";
        ctx.shadowBlur  = 20;
        ctx.shadowColor = "#ef4444";
        ctx.textAlign   = "center";
        ctx.fillText("SHIP DESTROYED", W / 2, H / 2 - 20);
        ctx.font        = "14px 'Share Tech Mono', monospace";
        ctx.fillStyle   = "#ffffff88";
        ctx.fillText(`FINAL SCORE: ${g.score}`, W / 2, H / 2 + 16);
        ctx.textAlign   = "left";
        // Auto-reset after 2s
        setTimeout(() => {
          g.alive      = true;
          g.score      = 0;
          g.asteroids  = [];
          g.shipY      = 250;
          g.targetY    = 250;
        }, 2000);
      }

      drawHUD();
      g.frameId = requestAnimationFrame(loop);
    }

    g.frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(g.frameId);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={620}
        height={320}
        style={{
          borderRadius: 10,
          border: "1px solid #00fff733",
          display: "block",
          boxShadow: "0 0 30px #00fff722",
        }}
      />
      {!poseData && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(5,5,15,0.75)",
          borderRadius: 10,
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ fontSize: 32 }}>📷</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, color: "#00fff7", letterSpacing: 2 }}>
            START POSE SERVER
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#555577" }}>
            python pose_server.py
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────
function PulseOrb({ color, size = 8, style: s = {} }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 ${size}px ${color}`,
      animation: "orb-pulse 2s ease-in-out infinite",
      flexShrink: 0,
      ...s,
    }} />
  );
}

function StatBar({ value, max = 5, color }) {
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          width: 16, height: 5, borderRadius: 2,
          background: i < value ? color : "#1a1a2e",
          boxShadow: i < value ? `0 0 5px ${color}` : "none",
        }} />
      ))}
    </div>
  );
}

function ScanlineOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)",
    }} />
  );
}

function AnimatedGrid() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      background: `linear-gradient(rgba(0,255,247,0.025) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(0,255,247,0.025) 1px, transparent 1px)`,
      backgroundSize: "60px 60px",
      maskImage: "radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)",
    }} />
  );
}

// ─────────────────────────────────────────────
//  LIVE POSE STATS PANEL
// ─────────────────────────────────────────────
function LiveStatsPanel({ poseData, connected }) {
  return (
    <div style={{
      background: "rgba(10,10,25,0.95)",
      border: `1px solid ${connected ? "#00fff733" : "#ef444433"}`,
      borderRadius: 10,
      padding: "16px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <PulseOrb color={connected ? "#22c55e" : "#ef4444"} size={7} />
        <span style={{
          fontFamily: "'Orbitron', monospace", fontSize: 10,
          color: connected ? "#22c55e" : "#ef4444", letterSpacing: 2,
        }}>
          {connected ? "POSE SERVER ONLINE" : "POSE SERVER OFFLINE"}
        </span>
      </div>

      {poseData ? (
        <>
          {/* Feedback */}
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 12,
            color: poseData.isSquatting ? "#ff00aa" : "#00fff7",
            marginBottom: 14,
            padding: "8px 12px",
            background: poseData.isSquatting ? "#ff00aa11" : "#00fff711",
            borderRadius: 6,
            border: `1px solid ${poseData.isSquatting ? "#ff00aa33" : "#00fff733"}`,
          }}>
            {poseData.feedback}
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: "SQUAT REPS", value: poseData.squatCount, color: "#00fff7" },
              { label: "XP EARNED",  value: poseData.xp,         color: "#a855f7" },
              { label: "DEPTH",      value: poseData.depth,      color: "#facc15" },
            ].map(item => (
              <div key={item.label} style={{
                background: "#0a0a19",
                borderRadius: 6,
                padding: "10px",
                textAlign: "center",
              }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#444466", letterSpacing: 1 }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: "'Orbitron', monospace", fontSize: 18,
                  color: item.color, marginTop: 4,
                  textShadow: `0 0 10px ${item.color}`,
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Squat depth bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#444466" }}>
                SQUAT DEPTH
              </span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#00fff7" }}>
                {poseData.isSquatting ? "⬇ LOW" : "⬆ HIGH"}
              </span>
            </div>
            <div style={{ background: "#0a0a19", borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div style={{
                width: `${Math.max(5, Math.min(100, (1 - poseData.depth / 0.5) * 100))}%`,
                height: "100%",
                background: poseData.isSquatting
                  ? "linear-gradient(90deg, #ff00aa, #a855f7)"
                  : "linear-gradient(90deg, #00fff7, #22c55e)",
                boxShadow: `0 0 10px ${poseData.isSquatting ? "#ff00aa" : "#00fff7"}66`,
                borderRadius: 4,
                transition: "width 0.1s ease, background 0.3s ease",
              }} />
            </div>
          </div>
        </>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "20px 0",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 11,
          color: "#333355",
          lineHeight: 2,
        }}>
          Run in terminal:<br />
          <span style={{ color: "#00fff766" }}>python pose_server.py</span>
          <br />then stand in front of your webcam
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  XP BAR
// ─────────────────────────────────────────────
function XPBar({ xp = 0, baseXp = 3240 }) {
  const totalXp = baseXp + xp;
  const maxXp   = 5000;
  const level   = Math.floor(totalXp / 500) + 1;
  const pct     = ((totalXp % 500) / 500) * 100;

  return (
    <div style={{
      background: "rgba(10,10,25,0.9)",
      border: "1px solid #1e2040",
      borderRadius: 10,
      padding: "16px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: "#a855f7", letterSpacing: 2 }}>
          PILOT LVL {level}
        </span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#444466" }}>
          {totalXp.toLocaleString()} XP TOTAL
        </span>
      </div>
      <div style={{ background: "#0a0a19", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg, #a855f7, #00fff7)",
          boxShadow: "0 0 10px #a855f755",
          borderRadius: 4,
          transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        {[
          { label: "SESSION XP", value: `+${xp}`,    icon: "⚡" },
          { label: "STREAK",     value: "5 DAYS",     icon: "🔥" },
          { label: "RANK",       value: "#142",       icon: "🏆" },
        ].map(item => (
          <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 14 }}>{item.icon}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#444466", marginTop: 2 }}>
              {item.label}
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: "#00fff7", marginTop: 1 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  GAME CARD
// ─────────────────────────────────────────────
function GameCard({ game, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const glow = isActive || hovered;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        border: `1px solid ${glow ? game.color : "#1e2040"}`,
        borderRadius: 10,
        padding: "14px 18px",
        background: glow
          ? `linear-gradient(135deg, ${game.color}10, ${game.accent}06)`
          : "rgba(10,10,25,0.8)",
        boxShadow: glow ? `0 0 20px ${game.color}33` : "none",
        transform: glow ? "translateY(-2px)" : "none",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 22, filter: glow ? `drop-shadow(0 0 6px ${game.color})` : "none" }}>
          {game.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700,
            color: game.color, letterSpacing: 2,
            textShadow: glow ? `0 0 8px ${game.color}` : "none",
          }}>
            {game.name}
            {!game.active && (
              <span style={{
                marginLeft: 8, fontSize: 9, color: "#333355",
                border: "1px solid #222244", borderRadius: 3,
                padding: "1px 5px", letterSpacing: 1,
              }}>
                COMING SOON
              </span>
            )}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#555577", marginTop: 2, letterSpacing: 1 }}>
            {game.exercise.toUpperCase()}
          </div>
          {glow && (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#8888aa", marginTop: 6, lineHeight: 1.5 }}>
              {game.mechanic}
            </div>
          )}
          <StatBar value={game.difficulty} color={game.color} />
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: game.accent, fontWeight: 700 }}>
            +{game.xpReward} XP
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  LEADERBOARD
// ─────────────────────────────────────────────
function LeaderboardPanel() {
  return (
    <div style={{
      background: "rgba(10,10,25,0.9)", border: "1px solid #1e2040",
      borderRadius: 10, padding: "16px 20px",
    }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: "#facc15", letterSpacing: 3, marginBottom: 14, textShadow: "0 0 8px #facc1555" }}>
        ▶ WEEKLY CHAMPIONS
      </div>
      {LEADERBOARD.map((entry, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "8px 0",
          borderBottom: i < LEADERBOARD.length - 1 ? "1px solid #0e0e22" : "none",
          opacity: entry.name === "YOU?" ? 0.35 : 1,
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 11, width: 18,
            color: i === 0 ? "#facc15" : i === 1 ? "#aaaacc" : "#444466",
          }}>
            {entry.rank}
          </div>
          <span style={{ fontSize: 14 }}>{entry.aura}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: i === 0 ? "#facc15" : "#7777aa", letterSpacing: 1 }}>
              {entry.name}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#333355", marginTop: 1 }}>
              {entry.streak > 0 ? `${entry.streak}-DAY STREAK` : "NO STREAK"}
            </div>
          </div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: "#00fff7" }}>
            {entry.score}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  TECH STACK TAB
// ─────────────────────────────────────────────
function TechTab() {
  return (
    <div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#444466", letterSpacing: 2, marginBottom: 20 }}>
        ARCHITECTURE // HIGH-PERFORMANCE BROWSER + PYTHON STACK
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "MEDIAPIPE POSE",   sub: "33-point body tracking / ~30fps",        color: "#00fff7" },
          { label: "REACT + HOOKS",    sub: "Game state, score, health bars",          color: "#a855f7" },
          { label: "CANVAS API",       sub: "Gravity Well 2D game engine",             color: "#f97316" },
          { label: "WEBSOCKETS",       sub: "Python ↔ React real-time bridge",         color: "#22c55e" },
          { label: "HOWLER.JS",        sub: "Dynamic synthwave / phonk audio",         color: "#ff00aa" },
          { label: "OPENCV-PYTHON",    sub: "Webcam capture + skeleton overlay",       color: "#facc15" },
        ].map(item => (
          <div key={item.label} style={{
            border: `1px solid ${item.color}33`,
            borderRadius: 8, padding: "12px 14px",
            background: `${item.color}08`,
          }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: item.color, letterSpacing: 1 }}>{item.label}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#444466", marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(5,5,15,0.98)", border: "1px solid #0e0e22",
        borderRadius: 10, padding: "20px 24px",
      }}>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: "#00fff7", letterSpacing: 3, marginBottom: 16 }}>
          ▶ WEBSOCKET FLOW
        </div>
        <pre style={{ margin: 0, fontFamily: "'Share Tech Mono', monospace", fontSize: 12, lineHeight: 1.8, color: "#8888aa", overflowX: "auto" }}>
{`  ┌──────────────┐     WebSocket      ┌──────────────┐
  │  Python 3.10  │ ─────────────────▶ │  React App   │
  │  pose_server  │   ws://localhost   │  localhost   │
  │  .py          │       :8765        │  :3000       │
  └──────┬────────┘                    └──────┬───────┘
         │                                    │
  MediaPipe Pose                       poseData state
  33 landmarks                         ↓
  Squat detection                 GravityWell canvas
  squatCount / XP                 ship moves up/down
  JSON → send()                   XP bar updates`}
        </pre>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
export default function KinetiCore() {
  const [tab,        setTab]        = useState("arena");
  const [activeGame, setActiveGame] = useState("gravity-well");
  const [poseData,   setPoseData]   = useState(null);
  const [connected,  setConnected]  = useState(false);
  const [wsStatus,   setWsStatus]   = useState("CONNECTING...");

  // ── Inject global styles & fonts ──────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

      @keyframes orb-pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
      @keyframes title-flicker{ 0%,100%{opacity:1} 91%{opacity:1} 92%{opacity:0.4} 94%{opacity:1} 96%{opacity:0.6} 98%{opacity:1} }
      @keyframes float-up     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #05050f; }
      ::-webkit-scrollbar       { width: 4px; }
      ::-webkit-scrollbar-track { background: #050510; }
      ::-webkit-scrollbar-thumb { background: #00fff733; border-radius: 4px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ── WebSocket connection to Python pose server ──
  useEffect(() => {
    let ws;
    let reconnectTimer;

    function connect() {
      ws = new WebSocket("ws://localhost:8765");

      ws.onopen = () => {
        setConnected(true);
        setWsStatus("POSE SERVER ONLINE");
        console.log("✅ Connected to KinetiCore pose server");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setPoseData(data);
        } catch (e) {
          console.error("Bad JSON from server:", e);
        }
      };

      ws.onerror = () => {
        setConnected(false);
        setWsStatus("OFFLINE — run pose_server.py");
      };

      ws.onclose = () => {
        setConnected(false);
        setWsStatus("RECONNECTING...");
        // Auto-reconnect every 3s
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const currentXp = poseData?.xp ?? 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#05050f",
      color: "#e0e0ff",
      fontFamily: "'Share Tech Mono', monospace",
      position: "relative",
      overflowX: "hidden",
    }}>
      <ScanlineOverlay />
      <AnimatedGrid />

      {/* Ambient glows */}
      <div style={{ position:"fixed", top:-200, left:-200, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,#00fff70d,transparent 70%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:-200, right:-100, width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,#a855f70d,transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:980, margin:"0 auto", padding:"0 20px 60px" }}>

        {/* ── HEADER ── */}
        <header style={{ padding:"30px 0 22px", borderBottom:"1px solid #0e0e22" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <PulseOrb color={connected ? "#22c55e" : "#ef4444"} size={7} />
                <span style={{
                  fontFamily:"'Share Tech Mono',monospace", fontSize:10,
                  color: connected ? "#22c55e" : "#ef4444",
                  letterSpacing:2,
                }}>
                  {wsStatus}
                </span>
              </div>
              <h1 style={{
                fontFamily:"'Orbitron',monospace",
                fontSize:"clamp(26px,6vw,52px)",
                fontWeight:900,
                background:"linear-gradient(90deg,#00fff7,#a855f7,#ff00aa)",
                WebkitBackgroundClip:"text",
                WebkitTextFillColor:"transparent",
                letterSpacing:4,
                animation:"title-flicker 9s infinite",
                lineHeight:1.1,
              }}>
                KINETICORE
              </h1>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#333355", letterSpacing:3, marginTop:4 }}>
                THE MOTION-SENSING COMBAT ARENA
              </div>
            </div>

            {/* Quick-start instructions */}
            <div style={{
              background:"rgba(10,10,25,0.9)",
              border:`1px solid ${connected ? "#00fff733" : "#333355"}`,
              borderRadius:10,
              padding:"14px 18px",
              fontFamily:"'Share Tech Mono',monospace",
              fontSize:11,
              lineHeight:2,
              color:"#555577",
            }}>
              <div style={{ color:"#00fff7", marginBottom:4, letterSpacing:1 }}>QUICK START</div>
              <div>1. <span style={{color:"#a855f7"}}>kineticore-env\Scripts\activate</span></div>
              <div>2. <span style={{color:"#a855f7"}}>python pose_server.py</span></div>
              <div>3. Stand in front of webcam &amp; squat!</div>
            </div>
          </div>
        </header>

        {/* ── NAV TABS ── */}
        <nav style={{ display:"flex", borderBottom:"1px solid #0e0e22", marginBottom:24, marginTop:20 }}>
          {[
            { id:"arena",       label:"COMBAT ARENA"  },
            { id:"leaderboard", label:"LEADERBOARDS"  },
            { id:"tech",        label:"TECH STACK"    },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background:"none", border:"none",
              borderBottom: tab===t.id ? "2px solid #00fff7" : "2px solid transparent",
              color: tab===t.id ? "#00fff7" : "#333355",
              fontFamily:"'Orbitron',monospace", fontSize:11, letterSpacing:2,
              padding:"10px 20px", cursor:"pointer",
              textShadow: tab===t.id ? "0 0 10px #00fff7" : "none",
              transition:"all 0.2s",
            }}>
              {t.label}
            </button>
          ))}
        </nav>

        {/* ══════════ ARENA TAB ══════════ */}
        {tab === "arena" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>

            {/* Left: game canvas + game list */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Gravity Well Game Canvas */}
              {activeGame === "gravity-well" && (
                <div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:8 }}>
                    ▶ GRAVITY WELL — LIVE GAMEPLAY
                  </div>
                  <GravityWellGame poseData={poseData} />
                </div>
              )}

              {/* Game selector */}
              <div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:10 }}>
                  SELECT MISSION // {GAMES.length} COMBAT MODES
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {GAMES.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isActive={activeGame === game.id}
                      onClick={() => setActiveGame(activeGame === game.id ? null : game.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Live Pose Stats */}
              <LiveStatsPanel poseData={poseData} connected={connected} />

              {/* XP Bar */}
              <XPBar xp={currentXp} />

              {/* Skill Tree */}
              <div style={{
                background:"rgba(10,10,25,0.9)", border:"1px solid #1e2040",
                borderRadius:10, padding:"16px 20px",
              }}>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#22c55e", letterSpacing:3, marginBottom:12, textShadow:"0 0 8px #22c55e55" }}>
                  ▶ SKILL TREE
                </div>
                {[
                  { name:"HYPER DASH",  unlocked:true,  color:"#00fff7", req:"ACTIVE"   },
                  { name:"NEON TRAIL",  unlocked:true,  color:"#a855f7", req:"ACTIVE"   },
                  { name:"GHOST MODE",  unlocked:false, color:"#22c55e", req:"LVL 10"   },
                  { name:"TITAN FORM",  unlocked:false, color:"#f97316", req:"2,000 XP" },
                ].map((skill, i, arr) => (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"7px 0",
                    borderBottom: i < arr.length-1 ? "1px solid #0e0e22" : "none",
                    opacity: skill.unlocked ? 1 : 0.35,
                  }}>
                    <PulseOrb color={skill.unlocked ? skill.color : "#222244"} size={6} />
                    <span style={{ flex:1, fontFamily:"'Share Tech Mono',monospace", fontSize:11, color: skill.unlocked ? skill.color : "#333355", letterSpacing:1 }}>
                      {skill.name}
                    </span>
                    <span style={{ fontFamily:"'Orbitron',monospace", fontSize:9, color:"#333355" }}>
                      {skill.req}
                    </span>
                  </div>
                ))}
              </div>

              {/* Ghost Mode card */}
              <div style={{
                background:"linear-gradient(135deg,#00fff708,#a855f708)",
                border:"1px solid #00fff722", borderRadius:10, padding:"14px 16px",
                animation:"float-up 4s ease-in-out infinite",
              }}>
                <div style={{ fontSize:20, marginBottom:6 }}>👻</div>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:"#00fff7", letterSpacing:2 }}>GHOST MODE</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#555577", marginTop:4, lineHeight:1.5 }}>
                  Race your past self. Beat your ghost for bonus XP.
                </div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#333355", marginTop:8 }}>
                  UNLOCKS AT LVL 10
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ LEADERBOARD TAB ══════════ */}
        {tab === "leaderboard" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:12 }}>
                WEEK 8 // FEB 17–23 2026
              </div>
              <LeaderboardPanel />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Top Titan Climbers */}
              <div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:12 }}>
                  TOP TITAN CLIMBERS
                </div>
                <div style={{ background:"rgba(10,10,25,0.9)", border:"1px solid #1e2040", borderRadius:10, padding:"16px 20px" }}>
                  <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#22c55e", letterSpacing:3, marginBottom:12, textShadow:"0 0 8px #22c55e55" }}>
                    ▶ FLOORS CLIMBED
                  </div>
                  {[
                    { name:"ATLAS_9",  floors:"41,200", color:"#facc15" },
                    { name:"IRONWING", floors:"38,770", color:"#aaaacc" },
                    { name:"VORTEX_X", floors:"35,100", color:"#f97316" },
                    { name:"ZERO_G",   floors:"29,880", color:"#555577" },
                  ].map((e,i) => (
                    <div key={i} style={{
                      display:"flex", justifyContent:"space-between",
                      padding:"7px 0", borderBottom: i<3 ? "1px solid #0e0e22":"none",
                    }}>
                      <span style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:e.color }}>{e.name}</span>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#22c55e" }}>{e.floors} FLOORS</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak Auras */}
              <div style={{ background:"linear-gradient(135deg,#f9731608,#facc1508)", border:"1px solid #f9731633", borderRadius:10, padding:"16px 20px" }}>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#f97316", letterSpacing:2, marginBottom:10 }}>
                  🔥 STREAK AURAS
                </div>
                {[
                  { days:3,  label:"IGNIS FORM",  color:"#f97316", desc:"3+ days — orange flame"  },
                  { days:7,  label:"PLASMA FORM", color:"#a855f7", desc:"7+ days — purple surge"  },
                  { days:14, label:"NOVA FORM",   color:"#00fff7", desc:"14+ days — cyan halo"    },
                ].map((a,i) => (
                  <div key={i} style={{
                    display:"flex", gap:10, alignItems:"center",
                    padding:"6px 0", borderBottom: i<2 ? "1px solid #0e0e22":"none",
                  }}>
                    <PulseOrb color={a.color} size={7} />
                    <div>
                      <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:a.color, letterSpacing:1 }}>{a.label}</div>
                      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#333355" }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TECH TAB ══════════ */}
        {tab === "tech" && <TechTab />}

        {/* ── FOOTER ── */}
        <footer style={{ marginTop:40, paddingTop:20, borderTop:"1px solid #0e0e22", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:9, color:"#1a1a33", letterSpacing:2 }}>
            KINETICORE v1.0.0 // PROTOTYPE
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <PulseOrb color={connected ? "#22c55e" : "#ef4444"} size={5} />
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#222244" }}>
              {connected ? "ALL SYSTEMS NOMINAL" : "AWAITING POSE SERVER"}
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}