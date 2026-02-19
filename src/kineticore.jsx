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
    difficulty: 2,
    xpReward: 90,
    active: true,
  },
  {
    id: "neon-slicer",
    name: "NEON SLICER",
    exercise: "High Knees / Arm Swings",
    mechanic: "Slice floating Energy Cores with your hands before they overload the grid",
    color: "#ff00aa",
    accent: "#00fff7",
    icon: "⚡",
    difficulty: 3,
    xpReward: 120,
    active: true,
  },
  {
    id: "shield-wall",
    name: "SHIELD WALL",
    exercise: "Lunges",
    mechanic: "Lunge left or right to position your Power Shield and block incoming laser fire",
    color: "#f97316",
    accent: "#facc15",
    icon: "🛡",
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
//  GRAVITY WELL GAME
// ─────────────────────────────────────────────
function GravityWellGame({ poseData }) {
  const canvasRef = useRef(null);
  const gameRef   = useRef({
    shipY: 160, targetY: 160,
    asteroids: [], particles: [],
    score: 0, alive: true,
    frameId: null, tick: 0,
  });

  useEffect(() => {
    if (poseData) {
      gameRef.current.targetY = poseData.isSquatting ? 260 : 60;
    }
  }, [poseData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const g = gameRef.current;

    function spawnAsteroid() {
      g.asteroids.push({
        x: W + 40,
        y: Math.random() * (H - 60) + 30,
        r: 18 + Math.random() * 20,
        speed: 2.5 + Math.random() * 2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        color: Math.random() > 0.5 ? "#a855f7" : "#f97316",
      });
    }

    function spawnParticle(x, y, color) {
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 / 10) * i;
        g.particles.push({ x, y,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          life: 1, color,
        });
      }
    }

    function drawShip(x, y) {
      ctx.save();
      ctx.translate(x, y);
      ctx.shadowBlur = 18; ctx.shadowColor = "#00fff7";
      ctx.fillStyle = "#00fff7";
      ctx.beginPath();
      ctx.moveTo(20, 0); ctx.lineTo(-14, -10);
      ctx.lineTo(-8, 0); ctx.lineTo(-14, 10);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = g.tick % 6 < 3 ? "#ff00aa" : "#facc15";
      ctx.beginPath();
      ctx.moveTo(-8, -5); ctx.lineTo(-22, 0); ctx.lineTo(-8, 5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    function drawAsteroid(a) {
      ctx.save();
      ctx.translate(a.x, a.y); ctx.rotate(a.rot);
      ctx.strokeStyle = a.color; ctx.lineWidth = 2;
      ctx.shadowBlur = 10; ctx.shadowColor = a.color;
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 / 7) * i;
        const rad   = a.r * (0.75 + Math.random() * 0.25);
        i === 0
          ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
          : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
      }
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    }

    function loop() {
      g.tick++;
      ctx.clearRect(0, 0, W, H);

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#030310"); bg.addColorStop(1, "#0a0520");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 60; i++) {
        ctx.fillRect(((i * 137 + g.tick * 0.4) % W), ((i * 97) % H), i % 3 === 0 ? 1.5 : 0.8, i % 3 === 0 ? 1.5 : 0.8);
      }

      // Grid
      ctx.strokeStyle = "#00fff706"; ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

      if (g.tick % 55 === 0) spawnAsteroid();
      g.shipY += (g.targetY - g.shipY) * 0.08;

      g.asteroids = g.asteroids.filter(a => {
        a.x -= a.speed; a.rot += a.rotSpeed;
        const dx = a.x - 80, dy = a.y - g.shipY;
        if (Math.sqrt(dx*dx + dy*dy) < a.r + 14) {
          spawnParticle(a.x, a.y, a.color);
          g.alive = false; return false;
        }
        if (a.x < -50) { g.score++; return false; }
        drawAsteroid(a); return true;
      });

      g.particles = g.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.04;
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
        return p.life > 0;
      });

      if (g.alive) {
        drawShip(80, g.shipY);
      } else {
        ctx.fillStyle = "#ef4444"; ctx.font = "bold 26px 'Orbitron',monospace";
        ctx.shadowBlur = 20; ctx.shadowColor = "#ef4444";
        ctx.textAlign = "center";
        ctx.fillText("SHIP DESTROYED", W/2, H/2 - 16);
        ctx.font = "13px 'Share Tech Mono',monospace"; ctx.fillStyle = "#ffffff88";
        ctx.fillText(`FINAL SCORE: ${g.score}`, W/2, H/2 + 14);
        ctx.textAlign = "left";
        setTimeout(() => { g.alive=true; g.score=0; g.asteroids=[]; g.shipY=160; g.targetY=160; }, 2000);
      }

      // HUD
      ctx.fillStyle="#00fff7"; ctx.font="bold 12px 'Orbitron',monospace";
      ctx.shadowBlur=8; ctx.shadowColor="#00fff7";
      ctx.fillText(`SCORE: ${g.score}`, 14, 22);
      ctx.fillStyle="#ffffff33"; ctx.font="10px 'Share Tech Mono',monospace"; ctx.shadowBlur=0;
      ctx.fillText("SQUAT → DESCEND  |  STAND → ASCEND", W/2 - 110, H - 10);

      g.frameId = requestAnimationFrame(loop);
    }

    g.frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(g.frameId);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={620} height={300}
        style={{ borderRadius:10, border:"1px solid #00fff733", display:"block", boxShadow:"0 0 28px #00fff718" }}
      />
      {!poseData && <GameOverlay color="#00fff7" message="GRAVITY WELL" hint="python pose_server.py" />}
    </div>
  );
}

// ─────────────────────────────────────────────
//  NEON SLICER GAME
// ─────────────────────────────────────────────
function NeonSlicerGame({ poseData }) {
  const canvasRef = useRef(null);
  const scoreRef  = useRef(0);
  const gameRef   = useRef({
    cores:      [],
    trails:     { left: [], right: [] },
    particles:  [],
    score:      0,
    frameId:    null,
    tick:       0,
    lastLeft:   null,
    lastRight:  null,
  });

  // Feed hand positions into game
  useEffect(() => {
    if (!poseData) return;
    const g = gameRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;

    const lh = poseData.leftHand;
    const rh = poseData.rightHand;

    if (lh?.visible) {
      const nx = lh.x * W, ny = lh.y * H;
      if (g.lastLeft) {
        g.trails.left.push({ x: nx, y: ny, life: 1 });
        if (g.trails.left.length > 12) g.trails.left.shift();
        // Slice check
        g.cores = g.cores.filter(core => {
          const dx = core.x - nx, dy = core.y - ny;
          if (Math.sqrt(dx*dx+dy*dy) < core.r + 20) {
            spawnSliceParticles(g, core.x, core.y, "#ff00aa");
            g.score++;
            scoreRef.current = g.score;
            return false;
          }
          return true;
        });
      }
      g.lastLeft = { x: nx, y: ny };
    }

    if (rh?.visible) {
      const nx = rh.x * W, ny = rh.y * H;
      if (g.lastRight) {
        g.trails.right.push({ x: nx, y: ny, life: 1 });
        if (g.trails.right.length > 12) g.trails.right.shift();
        g.cores = g.cores.filter(core => {
          const dx = core.x - nx, dy = core.y - ny;
          if (Math.sqrt(dx*dx+dy*dy) < core.r + 20) {
            spawnSliceParticles(g, core.x, core.y, "#00fff7");
            g.score++;
            scoreRef.current = g.score;
            return false;
          }
          return true;
        });
      }
      g.lastRight = { x: nx, y: ny };
    }
  }, [poseData]);

  function spawnSliceParticles(g, x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      g.particles.push({
        x, y,
        vx: Math.cos(angle) * (3 + Math.random() * 4),
        vy: Math.sin(angle) * (3 + Math.random() * 4),
        life: 1, color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const g = gameRef.current;

    const CORE_COLORS = ["#ff00aa", "#00fff7", "#a855f7", "#facc15", "#22c55e"];

    function spawnCore() {
      const margin = 50;
      g.cores.push({
        x:     margin + Math.random() * (W - margin * 2),
        y:     margin + Math.random() * (H - margin * 2),
        r:     22 + Math.random() * 16,
        color: CORE_COLORS[Math.floor(Math.random() * CORE_COLORS.length)],
        pulse: Math.random() * Math.PI * 2,
        life:  1,           // fades out if not sliced
        decay: 0.003 + Math.random() * 0.002,
        rings: Math.floor(2 + Math.random() * 3),
      });
    }

    function drawCore(core) {
      ctx.save();
      ctx.globalAlpha = core.life;
      const pSize = core.r + Math.sin(core.pulse) * 5;

      // Outer rings
      for (let i = core.rings; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(core.x, core.y, pSize * (1 + i * 0.3), 0, Math.PI * 2);
        ctx.strokeStyle = core.color;
        ctx.lineWidth   = 1;
        ctx.globalAlpha = core.life * (0.15 / i);
        ctx.shadowBlur  = 0;
        ctx.stroke();
      }

      // Core body
      ctx.globalAlpha = core.life;
      ctx.beginPath();
      ctx.arc(core.x, core.y, pSize, 0, Math.PI * 2);
      ctx.fillStyle   = `${core.color}22`;
      ctx.shadowBlur  = 20;
      ctx.shadowColor = core.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(core.x, core.y, pSize, 0, Math.PI * 2);
      ctx.strokeStyle = core.color;
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Inner cross
      ctx.strokeStyle = core.color;
      ctx.lineWidth   = 1.5;
      ctx.globalAlpha = core.life * 0.7;
      ctx.beginPath();
      ctx.moveTo(core.x - pSize * 0.5, core.y);
      ctx.lineTo(core.x + pSize * 0.5, core.y);
      ctx.moveTo(core.x, core.y - pSize * 0.5);
      ctx.lineTo(core.x, core.y + pSize * 0.5);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawTrail(points, color) {
      if (points.length < 2) return;
      for (let i = 1; i < points.length; i++) {
        const alpha = (i / points.length) * 0.8;
        ctx.beginPath();
        ctx.moveTo(points[i-1].x, points[i-1].y);
        ctx.lineTo(points[i].x,   points[i].y);
        ctx.strokeStyle = color;
        ctx.lineWidth   = 4 * alpha;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur  = 12;
        ctx.shadowColor = color;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawHandCursor(x, y, color) {
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 14;
      ctx.shadowColor = color;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    function loop() {
      g.tick++;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#060612";
      ctx.fillRect(0, 0, W, H);

      // Neon grid
      ctx.strokeStyle = "#ff00aa09"; ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 50) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 50) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

      // Spawn cores every ~2.5s
      if (g.tick % 75 === 0 || g.cores.length < 3) spawnCore();

      // Update & draw cores
      g.cores = g.cores.filter(core => {
        core.pulse += 0.06;
        core.life  -= core.decay;
        if (core.life <= 0) return false;
        drawCore(core);
        return true;
      });

      // Draw trails
      drawTrail(g.trails.left,  "#ff00aa");
      drawTrail(g.trails.right, "#00fff7");

      // Fade trails
      g.trails.left  = g.trails.left.filter(p  => { p.life -= 0.08; return p.life > 0; });
      g.trails.right = g.trails.right.filter(p => { p.life -= 0.08; return p.life > 0; });

      // Draw hand cursors
      if (g.lastLeft)  drawHandCursor(g.lastLeft.x,  g.lastLeft.y,  "#ff00aa");
      if (g.lastRight) drawHandCursor(g.lastRight.x, g.lastRight.y, "#00fff7");

      // Particles
      g.particles = g.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.035;
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.shadowBlur  = 8; ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        return p.life > 0;
      });

      // HUD
      ctx.fillStyle = "#ff00aa"; ctx.font = "bold 12px 'Orbitron',monospace";
      ctx.shadowBlur=8; ctx.shadowColor="#ff00aa";
      ctx.fillText(`CORES SLICED: ${g.score}`, 14, 22);
      ctx.fillStyle="#ffffff33"; ctx.font="10px 'Share Tech Mono',monospace"; ctx.shadowBlur=0;
      ctx.textAlign="center";
      ctx.fillText("SWING YOUR HANDS TO SLICE ENERGY CORES", W/2, H - 10);
      ctx.textAlign="left";

      g.frameId = requestAnimationFrame(loop);
    }

    g.frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(g.frameId);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={620} height={300}
        style={{ borderRadius:10, border:"1px solid #ff00aa33", display:"block", boxShadow:"0 0 28px #ff00aa18" }}
      />
      {!poseData && <GameOverlay color="#ff00aa" message="NEON SLICER" hint="python pose_server.py" />}
    </div>
  );
}

// ─────────────────────────────────────────────
//  SHARED GAME OVERLAY (no pose server)
// ─────────────────────────────────────────────
function GameOverlay({ color, message, hint }) {
  return (
    <div style={{
      position:"absolute", inset:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(5,5,15,0.82)", borderRadius:10,
      flexDirection:"column", gap:8,
    }}>
      <div style={{ fontSize:32 }}>📷</div>
      <div style={{ fontFamily:"'Orbitron',monospace", fontSize:12, color, letterSpacing:2 }}>
        START POSE SERVER TO PLAY {message}
      </div>
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#555577" }}>
        {hint}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────
function PulseOrb({ color, size = 8, style: s = {} }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size,
      borderRadius:"50%", background:color,
      boxShadow:`0 0 ${size}px ${color}`,
      animation:"orb-pulse 2s ease-in-out infinite",
      flexShrink:0, ...s,
    }} />
  );
}

function StatBar({ value, max = 5, color }) {
  return (
    <div style={{ display:"flex", gap:4, marginTop:5 }}>
      {Array.from({ length:max }).map((_, i) => (
        <div key={i} style={{
          width:16, height:5, borderRadius:2,
          background: i < value ? color : "#1a1a2e",
          boxShadow:  i < value ? `0 0 5px ${color}` : "none",
        }} />
      ))}
    </div>
  );
}

function ScanlineOverlay() {
  return (
    <div style={{
      position:"fixed", inset:0, pointerEvents:"none", zIndex:9999,
      background:"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)",
    }} />
  );
}

function AnimatedGrid() {
  return (
    <div style={{
      position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
      background:`linear-gradient(rgba(0,255,247,0.025) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,255,247,0.025) 1px, transparent 1px)`,
      backgroundSize:"60px 60px",
      maskImage:"radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)",
    }} />
  );
}

// ─────────────────────────────────────────────
//  LIVE POSE STATS PANEL
// ─────────────────────────────────────────────
function LiveStatsPanel({ poseData, connected, activeGame }) {
  const isNeonSlicer = activeGame === "neon-slicer";
  const accentColor  = isNeonSlicer ? "#ff00aa" : "#00fff7";

  return (
    <div style={{
      background:"rgba(10,10,25,0.95)",
      border:`1px solid ${connected ? accentColor+"33" : "#ef444433"}`,
      borderRadius:10, padding:"16px 20px",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <PulseOrb color={connected ? "#22c55e" : "#ef4444"} size={7} />
        <span style={{ fontFamily:"'Orbitron',monospace", fontSize:10, letterSpacing:2, color: connected ? "#22c55e" : "#ef4444" }}>
          {connected ? "POSE SERVER ONLINE" : "POSE SERVER OFFLINE"}
        </span>
      </div>

      {poseData ? (
        <>
          <div style={{
            fontFamily:"'Share Tech Mono',monospace", fontSize:12,
            color: poseData.isSquatting ? "#ff00aa" : accentColor,
            marginBottom:12, padding:"8px 10px",
            background: poseData.isSquatting ? "#ff00aa11" : `${accentColor}11`,
            border:`1px solid ${poseData.isSquatting ? "#ff00aa33" : accentColor+"33"}`,
            borderRadius:6,
          }}>
            {poseData.feedback}
          </div>

          {/* Gravity Well stats */}
          {!isNeonSlicer && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
                {[
                  { label:"SQUATS", value:poseData.squatCount, color:"#00fff7" },
                  { label:"XP",     value:poseData.xp,         color:"#a855f7" },
                  { label:"DEPTH",  value:poseData.depth,      color:"#facc15" },
                ].map(item => (
                  <div key={item.label} style={{ background:"#0a0a19", borderRadius:6, padding:"8px", textAlign:"center" }}>
                    <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444466", letterSpacing:1 }}>{item.label}</div>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:16, color:item.color, marginTop:3, textShadow:`0 0 8px ${item.color}` }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"#0a0a19", borderRadius:4, height:7, overflow:"hidden" }}>
                <div style={{
                  width:`${Math.max(5, Math.min(100, (1 - poseData.depth / 0.5) * 100))}%`,
                  height:"100%",
                  background: poseData.isSquatting ? "linear-gradient(90deg,#ff00aa,#a855f7)" : "linear-gradient(90deg,#00fff7,#22c55e)",
                  borderRadius:4, transition:"width 0.1s ease, background 0.3s ease",
                }} />
              </div>
            </>
          )}

          {/* Neon Slicer stats */}
          {isNeonSlicer && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
              {[
                { label:"LEFT HAND",  value: poseData.leftHand?.visible  ? "ACTIVE" : "—", color:"#ff00aa" },
                { label:"RIGHT HAND", value: poseData.rightHand?.visible ? "ACTIVE" : "—", color:"#00fff7" },
              ].map(item => (
                <div key={item.label} style={{ background:"#0a0a19", borderRadius:6, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444466", letterSpacing:1 }}>{item.label}</div>
                  <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, color:item.color, marginTop:4, textShadow:`0 0 8px ${item.color}` }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign:"center", padding:"16px 0", fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#333355", lineHeight:2 }}>
          Run in terminal:<br />
          <span style={{ color:`${accentColor}88` }}>python pose_server.py</span>
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
  const total = baseXp + xp;
  const level = Math.floor(total / 500) + 1;
  const pct   = ((total % 500) / 500) * 100;
  return (
    <div style={{ background:"rgba(10,10,25,0.9)", border:"1px solid #1e2040", borderRadius:10, padding:"16px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
        <span style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:"#a855f7", letterSpacing:2 }}>PILOT LVL {level}</span>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466" }}>{total.toLocaleString()} XP</span>
      </div>
      <div style={{ background:"#0a0a19", borderRadius:4, height:7, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg,#a855f7,#00fff7)", borderRadius:4, transition:"width 0.6s ease" }} />
      </div>
      <div style={{ display:"flex", gap:10, marginTop:10 }}>
        {[
          { label:"SESSION XP", value:`+${xp}`, icon:"⚡" },
          { label:"STREAK",     value:"5 DAYS", icon:"🔥" },
          { label:"RANK",       value:"#142",   icon:"🏆" },
        ].map(item => (
          <div key={item.label} style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:13 }}>{item.icon}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444466", marginTop:2 }}>{item.label}</div>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:"#00fff7", marginTop:1 }}>{item.value}</div>
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
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor:"pointer",
        border:`1px solid ${glow ? game.color : "#1e2040"}`,
        borderRadius:10, padding:"12px 16px",
        background: glow ? `linear-gradient(135deg,${game.color}10,${game.accent}06)` : "rgba(10,10,25,0.8)",
        boxShadow: glow ? `0 0 18px ${game.color}33` : "none",
        transform: glow ? "translateY(-2px)" : "none",
        transition:"all 0.2s ease",
      }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <span style={{ fontSize:20, filter: glow ? `drop-shadow(0 0 6px ${game.color})` : "none" }}>{game.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:12, fontWeight:700, color:game.color, letterSpacing:2, textShadow: glow ? `0 0 8px ${game.color}` : "none" }}>
            {game.name}
            {!game.active && <span style={{ marginLeft:8, fontSize:9, color:"#333355", border:"1px solid #222244", borderRadius:3, padding:"1px 5px", letterSpacing:1 }}>COMING SOON</span>}
          </div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#555577", marginTop:2, letterSpacing:1 }}>{game.exercise.toUpperCase()}</div>
          {glow && <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#8888aa", marginTop:5, lineHeight:1.5 }}>{game.mechanic}</div>}
          <StatBar value={game.difficulty} color={game.color} />
        </div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:game.accent, fontWeight:700, flexShrink:0 }}>
          +{game.xpReward} XP
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
    <div style={{ background:"rgba(10,10,25,0.9)", border:"1px solid #1e2040", borderRadius:10, padding:"16px 20px" }}>
      <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#facc15", letterSpacing:3, marginBottom:14, textShadow:"0 0 8px #facc1555" }}>▶ WEEKLY CHAMPIONS</div>
      {LEADERBOARD.map((entry, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom: i<LEADERBOARD.length-1 ? "1px solid #0e0e22":"none", opacity: entry.name==="YOU?" ? 0.35:1 }}>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, width:18, color: i===0?"#facc15":i===1?"#aaaacc":"#444466" }}>{entry.rank}</div>
          <span style={{ fontSize:14 }}>{entry.aura}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color: i===0?"#facc15":"#7777aa", letterSpacing:1 }}>{entry.name}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#333355", marginTop:1 }}>{entry.streak>0?`${entry.streak}-DAY STREAK`:"NO STREAK"}</div>
          </div>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:"#00fff7" }}>{entry.score}</div>
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
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#444466", letterSpacing:2, marginBottom:20 }}>
        ARCHITECTURE // HIGH-PERFORMANCE BROWSER + PYTHON STACK
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"MEDIAPIPE POSE",  sub:"33-point body tracking / ~30fps",       color:"#00fff7" },
          { label:"REACT + HOOKS",   sub:"Game state, score, health bars",         color:"#a855f7" },
          { label:"CANVAS API",      sub:"Gravity Well + Neon Slicer engines",     color:"#f97316" },
          { label:"WEBSOCKETS",      sub:"Python ↔ React real-time bridge",        color:"#22c55e" },
          { label:"HOWLER.JS",       sub:"Dynamic synthwave / phonk audio",        color:"#ff00aa" },
          { label:"OPENCV-PYTHON",   sub:"Webcam capture + skeleton overlay",      color:"#facc15" },
        ].map(item => (
          <div key={item.label} style={{ border:`1px solid ${item.color}33`, borderRadius:8, padding:"12px 14px", background:`${item.color}08` }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:item.color, letterSpacing:1 }}>{item.label}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", marginTop:4 }}>{item.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"rgba(5,5,15,0.98)", border:"1px solid #0e0e22", borderRadius:10, padding:"20px 24px" }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:"#00fff7", letterSpacing:3, marginBottom:16 }}>▶ DATA FLOW</div>
        <pre style={{ margin:0, fontFamily:"'Share Tech Mono',monospace", fontSize:12, lineHeight:1.8, color:"#8888aa", overflowX:"auto" }}>
{`  Python pose_server.py
  ├── MediaPipe detects 33 landmarks
  ├── Squats  → isSquatting, squatCount, xp
  ├── Wrists  → leftHand {x,y}, rightHand {x,y}
  └── JSON → WebSocket → ws://localhost:8765

  React kineticore.jsx
  ├── Gravity Well  → ship.y = isSquatting ? low : high
  ├── Neon Slicer   → cursor = hand {x,y}, slice cores
  └── Live Stats    → XP bar, rep counter, depth bar`}
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
  const [wsStatus,   setWsStatus]   = useState("AWAITING POSE SERVER");

  // ── Global styles ────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
      @keyframes orb-pulse     { 0%,100%{opacity:1;transform:scale(1)}   50%{opacity:0.4;transform:scale(0.75)} }
      @keyframes title-flicker { 0%,100%{opacity:1} 91%{opacity:1} 92%{opacity:0.4} 94%{opacity:1} 96%{opacity:0.6} }
      @keyframes float-up      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      * { box-sizing:border-box; margin:0; padding:0; }
      body { background:#05050f; }
      ::-webkit-scrollbar       { width:4px; }
      ::-webkit-scrollbar-track { background:#050510; }
      ::-webkit-scrollbar-thumb { background:#00fff733; border-radius:4px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ── WebSocket ────────────────────────────────
  useEffect(() => {
    let ws, reconnectTimer;

    function connect() {
      ws = new WebSocket("ws://localhost:8765");
      ws.onopen    = () => { setConnected(true);  setWsStatus("POSE SERVER ONLINE"); };
      ws.onmessage = (e) => { try { setPoseData(JSON.parse(e.data)); } catch {} };
      ws.onerror   = ()  => { setConnected(false); setWsStatus("OFFLINE — run pose_server.py"); };
      ws.onclose   = ()  => { setConnected(false); setWsStatus("RECONNECTING..."); reconnectTimer = setTimeout(connect, 3000); };
    }

    connect();
    return () => { clearTimeout(reconnectTimer); if (ws) ws.close(); };
  }, []);

  const currentXp = poseData?.xp ?? 0;

  return (
    <div style={{ minHeight:"100vh", background:"#05050f", color:"#e0e0ff", fontFamily:"'Share Tech Mono',monospace", position:"relative", overflowX:"hidden" }}>
      <ScanlineOverlay />
      <AnimatedGrid />
      <div style={{ position:"fixed", top:-200, left:-200,  width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,#00fff70c,transparent 70%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:-200, right:-100, width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,#a855f70c,transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:980, margin:"0 auto", padding:"0 20px 60px" }}>

        {/* ── HEADER ── */}
        <header style={{ padding:"28px 0 20px", borderBottom:"1px solid #0e0e22" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <PulseOrb color={connected ? "#22c55e" : "#ef4444"} size={7} />
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:2, color: connected?"#22c55e":"#ef4444" }}>{wsStatus}</span>
              </div>
              <h1 style={{ fontFamily:"'Orbitron',monospace", fontSize:"clamp(26px,6vw,50px)", fontWeight:900,
                background:"linear-gradient(90deg,#00fff7,#a855f7,#ff00aa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                letterSpacing:4, animation:"title-flicker 9s infinite", lineHeight:1.1 }}>
                KINETICORE
              </h1>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#333355", letterSpacing:3, marginTop:3 }}>
                THE MOTION-SENSING COMBAT ARENA
              </div>
            </div>
            <div style={{ background:"rgba(10,10,25,0.9)", border:`1px solid ${connected?"#00fff722":"#333355"}`, borderRadius:10, padding:"12px 16px", fontFamily:"'Share Tech Mono',monospace", fontSize:11, lineHeight:2, color:"#555577" }}>
              <div style={{ color:"#00fff7", marginBottom:3, letterSpacing:1 }}>QUICK START</div>
              <div>1. <span style={{color:"#a855f7"}}>kineticore-env\Scripts\activate</span></div>
              <div>2. <span style={{color:"#a855f7"}}>python pose_server.py</span></div>
              <div>3. Stand in front of webcam &amp; move!</div>
            </div>
          </div>
        </header>

        {/* ── TABS ── */}
        <nav style={{ display:"flex", borderBottom:"1px solid #0e0e22", marginBottom:22, marginTop:18 }}>
          {[{id:"arena",label:"COMBAT ARENA"},{id:"leaderboard",label:"LEADERBOARDS"},{id:"tech",label:"TECH STACK"}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background:"none", border:"none",
              borderBottom: tab===t.id ? "2px solid #00fff7":"2px solid transparent",
              color: tab===t.id ? "#00fff7":"#333355",
              fontFamily:"'Orbitron',monospace", fontSize:11, letterSpacing:2,
              padding:"10px 20px", cursor:"pointer",
              textShadow: tab===t.id ? "0 0 10px #00fff7":"none",
              transition:"all 0.2s",
            }}>{t.label}</button>
          ))}
        </nav>

        {/* ══════════ ARENA TAB ══════════ */}
        {tab === "arena" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Active game canvas */}
              {activeGame === "gravity-well" && (
                <div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:8 }}>▶ GRAVITY WELL — LIVE GAMEPLAY</div>
                  <GravityWellGame poseData={poseData} />
                </div>
              )}
              {activeGame === "neon-slicer" && (
                <div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:8 }}>▶ NEON SLICER — LIVE GAMEPLAY</div>
                  <NeonSlicerGame poseData={poseData} />
                </div>
              )}
              {!["gravity-well","neon-slicer"].includes(activeGame) && activeGame && (
                <div style={{ background:"rgba(10,10,25,0.8)", border:"1px solid #1e2040", borderRadius:10, height:300, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
                  <div style={{ fontSize:36 }}>🔒</div>
                  <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, color:"#333355", letterSpacing:2 }}>COMING SOON</div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#222244" }}>This game mode is in development</div>
                </div>
              )}

              {/* Game list */}
              <div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:10 }}>SELECT MISSION // {GAMES.length} COMBAT MODES</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {GAMES.map(game => (
                    <GameCard key={game.id} game={game}
                      isActive={activeGame === game.id}
                      onClick={() => setActiveGame(activeGame === game.id ? null : game.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <LiveStatsPanel poseData={poseData} connected={connected} activeGame={activeGame} />
              <XPBar xp={currentXp} />

              {/* Skill Tree */}
              <div style={{ background:"rgba(10,10,25,0.9)", border:"1px solid #1e2040", borderRadius:10, padding:"16px 20px" }}>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#22c55e", letterSpacing:3, marginBottom:12, textShadow:"0 0 8px #22c55e55" }}>▶ SKILL TREE</div>
                {[
                  { name:"HYPER DASH", unlocked:true,  color:"#00fff7", req:"ACTIVE"   },
                  { name:"NEON TRAIL", unlocked:true,  color:"#a855f7", req:"ACTIVE"   },
                  { name:"GHOST MODE", unlocked:false, color:"#22c55e", req:"LVL 10"   },
                  { name:"TITAN FORM", unlocked:false, color:"#f97316", req:"2,000 XP" },
                ].map((skill,i,arr) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom: i<arr.length-1?"1px solid #0e0e22":"none", opacity: skill.unlocked?1:0.35 }}>
                    <PulseOrb color={skill.unlocked?skill.color:"#222244"} size={6} />
                    <span style={{ flex:1, fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:skill.unlocked?skill.color:"#333355", letterSpacing:1 }}>{skill.name}</span>
                    <span style={{ fontFamily:"'Orbitron',monospace", fontSize:9, color:"#333355" }}>{skill.req}</span>
                  </div>
                ))}
              </div>

              {/* Ghost Mode */}
              <div style={{ background:"linear-gradient(135deg,#00fff708,#a855f708)", border:"1px solid #00fff722", borderRadius:10, padding:"14px 16px", animation:"float-up 4s ease-in-out infinite" }}>
                <div style={{ fontSize:20, marginBottom:6 }}>👻</div>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:"#00fff7", letterSpacing:2 }}>GHOST MODE</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#555577", marginTop:4, lineHeight:1.5 }}>Race your past self. Beat your ghost for bonus XP.</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#333355", marginTop:8 }}>UNLOCKS AT LVL 10</div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ LEADERBOARD TAB ══════════ */}
        {tab === "leaderboard" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:12 }}>WEEK 8 // FEB 17–23 2026</div>
              <LeaderboardPanel />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ background:"rgba(10,10,25,0.9)", border:"1px solid #1e2040", borderRadius:10, padding:"16px 20px" }}>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#22c55e", letterSpacing:3, marginBottom:12, textShadow:"0 0 8px #22c55e55" }}>▶ TOP TITAN CLIMBERS</div>
                {[
                  {name:"ATLAS_9",floors:"41,200",color:"#facc15"},
                  {name:"IRONWING",floors:"38,770",color:"#aaaacc"},
                  {name:"VORTEX_X",floors:"35,100",color:"#f97316"},
                  {name:"ZERO_G",floors:"29,880",color:"#555577"},
                ].map((e,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:i<3?"1px solid #0e0e22":"none" }}>
                    <span style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:e.color }}>{e.name}</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#22c55e" }}>{e.floors} FLOORS</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"linear-gradient(135deg,#f9731608,#facc1508)", border:"1px solid #f9731633", borderRadius:10, padding:"16px 20px" }}>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#f97316", letterSpacing:2, marginBottom:10 }}>🔥 STREAK AURAS</div>
                {[
                  {days:3, label:"IGNIS FORM", color:"#f97316",desc:"3+ days — orange flame"},
                  {days:7, label:"PLASMA FORM",color:"#a855f7",desc:"7+ days — purple surge"},
                  {days:14,label:"NOVA FORM",  color:"#00fff7",desc:"14+ days — cyan halo"},
                ].map((a,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"6px 0", borderBottom:i<2?"1px solid #0e0e22":"none" }}>
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
        <footer style={{ marginTop:40, paddingTop:18, borderTop:"1px solid #0e0e22", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:9, color:"#1a1a33", letterSpacing:2 }}>KINETICORE v2.0.0 // 2 GAMES LIVE</div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <PulseOrb color={connected?"#22c55e":"#ef4444"} size={5} />
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#222244" }}>{connected?"ALL SYSTEMS NOMINAL":"AWAITING POSE SERVER"}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}