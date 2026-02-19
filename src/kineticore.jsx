import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
//  THEMES
// ─────────────────────────────────────────────
const THEMES = {
  cyan: {
    primary:  "#00fff7",
    secondary:"#a855f7",
    accent:   "#ff00aa",
    gradient: "linear-gradient(90deg,#00fff7,#a855f7,#ff00aa)",
    label:    "CYBER CYAN",
  },
  magenta: {
    primary:  "#ff00aa",
    secondary:"#a855f7",
    accent:   "#facc15",
    gradient: "linear-gradient(90deg,#ff00aa,#a855f7,#facc15)",
    label:    "NEON MAGENTA",
  },
  green: {
    primary:  "#22c55e",
    secondary:"#00fff7",
    accent:   "#a855f7",
    gradient: "linear-gradient(90deg,#22c55e,#00fff7,#a855f7)",
    label:    "MATRIX GREEN",
  },
  orange: {
    primary:  "#f97316",
    secondary:"#facc15",
    accent:   "#ef4444",
    gradient: "linear-gradient(90deg,#f97316,#facc15,#ef4444)",
    label:    "INFERNO ORANGE",
  },
};


// ─────────────────────────────────────────────
//  PROFILE HELPERS (localStorage)
// ─────────────────────────────────────────────
const XP_PER_LEVEL = 500;

function loadProfile(username) {
  if (!username) return defaultProfile();
  const key = `kc_profile_${username.toLowerCase()}`;
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);
  return defaultProfile();
}

function saveProfile(username, profile) {
  if (!username) return;
  const key = `kc_profile_${username.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(profile));
}

function defaultProfile() {
  return {
    totalXp:      0,
    level:        1,
    streak:       0,
    lastPlayedDate: null,
    rank:         "—",
    gamesPlayed:  0,
  };
}

function calcLevel(totalXp) {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

function updateStreak(profile) {
  const today = new Date().toDateString();
  if (profile.lastPlayedDate === today) return profile; // already played today
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const newStreak = profile.lastPlayedDate === yesterday
    ? profile.streak + 1   // consecutive day
    : 1;                   // streak reset
  return { ...profile, streak: newStreak, lastPlayedDate: today };
}

function addXpToProfile(profile, xpGained) {
  if (xpGained <= 0) return profile;
  const updated = updateStreak(profile);
  const totalXp = updated.totalXp + xpGained;
  return {
    ...updated,
    totalXp,
    level: calcLevel(totalXp),
    gamesPlayed: updated.gamesPlayed + 1,
  };
}

// ─────────────────────────────────────────────
//  AVATAR PANEL (slide-in from right)
// ─────────────────────────────────────────────
function AvatarPanel({ user, theme, setTheme, show, setShow, onLogout, connected, wsStatus, profile = defaultProfile() }) {
  const t = THEMES[theme];
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setShow(false)} style={{
        position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.4)",
        backdropFilter:"blur(2px)",
      }} />

      {/* Panel */}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0, width:280,
        zIndex:101,
        background:"rgba(6,6,18,0.98)",
        borderLeft:`1px solid ${t.primary}33`,
        boxShadow:`-20px 0 60px rgba(0,0,0,0.6), inset 0 0 30px ${t.primary}05`,
        animation:"panel-in 0.25s cubic-bezier(0.16,1,0.3,1)",
        display:"flex", flexDirection:"column",
        overflow:"hidden",
      }}>

        {/* Top accent bar */}
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${t.primary},${t.secondary})` }} />

        {/* Close button */}
        <div onClick={() => setShow(false)} style={{
          position:"absolute", top:14, right:14,
          width:28, height:28, borderRadius:"50%",
          border:"1px solid #1e2040",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:"#444466", fontSize:14,
          fontFamily:"monospace",
        }}>✕</div>

        <div style={{ padding:"24px 20px", flex:1, overflowY:"auto" }}>

          {/* Avatar + name */}
          <div style={{ textAlign:"center", marginBottom:24, paddingTop:8 }}>
            <div style={{
              width:70, height:70, borderRadius:"50%",
              border:`2px solid ${t.primary}88`,
              background:`${t.primary}11`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:34, margin:"0 auto 12px",
              boxShadow:`0 0 24px ${t.primary}44`,
            }}>
              {user.avatar || "⚡"}
            </div>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:14, fontWeight:700, color:t.primary, letterSpacing:2, textShadow:`0 0 10px ${t.primary}` }}>
              {(user.username || "PILOT").toUpperCase()}
            </div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", marginTop:3, letterSpacing:1 }}>
              {user.email || "pilot@arena.com"}
            </div>
            {/* Badges */}
            <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:10, flexWrap:"wrap" }}>
              {[`LVL ${profile?.level ?? 1}`, `${(profile?.totalXp ?? 0).toLocaleString()} XP`, profile?.streak > 0 ? `${profile.streak}-DAY STREAK` : "NEW PILOT"].map(b => (
                <span key={b} style={{
                  fontFamily:"'Share Tech Mono',monospace", fontSize:9,
                  color:t.primary, border:`1px solid ${t.primary}44`,
                  borderRadius:4, padding:"2px 7px", letterSpacing:1,
                  background:`${t.primary}08`,
                }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Server status */}
          <div style={{
            background:"#0a0a19", border:"1px solid #1e2040",
            borderRadius:8, padding:"10px 12px", marginBottom:20,
            display:"flex", alignItems:"center", gap:8,
          }}>
            <div style={{
              width:7, height:7, borderRadius:"50%",
              background: connected ? "#22c55e" : "#ef4444",
              boxShadow:`0 0 6px ${connected ? "#22c55e" : "#ef4444"}`,
              flexShrink:0,
            }} />
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color: connected ? "#22c55e" : "#ef4444", letterSpacing:1 }}>
              {wsStatus}
            </span>
          </div>

          {/* Theme selector */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:12 }}>
              ARENA THEME
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {Object.entries(THEMES).map(([key, val]) => (
                <div
                  key={key}
                  onClick={() => setTheme(key)}
                  style={{
                    padding:"10px 10px",
                    borderRadius:8,
                    border:`1px solid ${theme === key ? val.primary : "#1e2040"}`,
                    background: theme === key ? `${val.primary}12` : "#0a0a19",
                    cursor:"pointer",
                    boxShadow: theme === key ? `0 0 12px ${val.primary}33` : "none",
                    transition:"all 0.2s",
                  }}
                >
                  {/* Color preview */}
                  <div style={{
                    height:4, borderRadius:2,
                    background:val.gradient,
                    marginBottom:6,
                    boxShadow: theme === key ? `0 0 8px ${val.primary}66` : "none",
                  }} />
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color: theme === key ? val.primary : "#444466", letterSpacing:1 }}>
                    {val.label}
                  </div>
                  {theme === key && (
                    <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:val.primary, marginTop:2, opacity:0.6 }}>
                      ACTIVE
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:12 }}>
              SETTINGS
            </div>
            {[
              { label:"SOUND FX",       status:"ON"  },
              { label:"MUSIC",          status:"ON"  },
              { label:"SCANLINES",      status:"ON"  },
              { label:"GHOST MODE",     status:"LVL 10" },
            ].map((s, i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"8px 0",
                borderBottom:"1px solid #0e0e22",
                fontFamily:"'Share Tech Mono',monospace", fontSize:11,
              }}>
                <span style={{ color:"#555577", letterSpacing:1 }}>{s.label}</span>
                <span style={{ color: s.status === "ON" ? t.primary : "#333355", fontSize:10 }}>{s.status}</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          {!confirmLogout ? (
            <div
              onClick={() => setConfirmLogout(true)}
              style={{
                padding:"12px 0", textAlign:"center",
                border:"1px solid #ef444444",
                borderRadius:8, cursor:"pointer",
                fontFamily:"'Orbitron',monospace", fontSize:11,
                color:"#ef4444", letterSpacing:2,
                background:"#ef444408",
                transition:"all 0.2s",
              }}
            >
              ⏻ LOGOUT
            </div>
          ) : (
            <div style={{ border:"1px solid #ef444466", borderRadius:8, padding:"14px", background:"#ef444410" }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#ef4444", textAlign:"center", marginBottom:10, letterSpacing:1 }}>
                CONFIRM LOGOUT?
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div onClick={onLogout} style={{
                  flex:1, padding:"9px 0", textAlign:"center",
                  background:"#ef444422", border:"1px solid #ef444466",
                  borderRadius:6, cursor:"pointer",
                  fontFamily:"'Orbitron',monospace", fontSize:10,
                  color:"#ef4444", letterSpacing:1,
                }}>
                  YES
                </div>
                <div onClick={() => setConfirmLogout(false)} style={{
                  flex:1, padding:"9px 0", textAlign:"center",
                  background:"#0a0a19", border:"1px solid #1e2040",
                  borderRadius:6, cursor:"pointer",
                  fontFamily:"'Orbitron',monospace", fontSize:10,
                  color:"#555577", letterSpacing:1,
                }}>
                  CANCEL
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom version */}
        <div style={{ padding:"12px 20px", borderTop:"1px solid #0e0e22", fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#1a1a33", letterSpacing:1 }}>
          KINETICORE v2.0.0 // PILOT PANEL
        </div>
      </div>
    </>
  );
}

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
    active: true,
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
//  SHIELD WALL GAME
// ─────────────────────────────────────────────
function ShieldWallGame({ poseData }) {
  const canvasRef = useRef(null);
  const gameRef   = useRef({
    shield:    { x: 310, targetX: 310, side: "none" },
    lasers:    [],
    explosions:[],
    particles: [],
    health:    100,
    score:     0,
    blocked:   0,
    alive:     true,
    frameId:   null,
    tick:      0,
    warnFlash: 0,
  });

  // Feed lunge direction into game
  useEffect(() => {
    if (!poseData) return;
    const g = gameRef.current;
    const dir = poseData.lungeDir;
    g.shield.side = dir;
    if      (dir === "left")  g.shield.targetX = 130;
    else if (dir === "right") g.shield.targetX = 490;
    else                      g.shield.targetX = 310;
  }, [poseData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const g = gameRef.current;
    const SHIELD_Y = H - 80;
    const SHIELD_W = 100, SHIELD_H = 140;

    function spawnLaser() {
      const side  = Math.random() > 0.5 ? "left" : "right";
      const lanes = [120, 200, 310, 420, 500];
      const laneX = lanes[Math.floor(Math.random() * lanes.length)];
      g.lasers.push({
        x:      laneX,
        y:      -30,
        targetX:laneX,
        speed:  2.8 + Math.random() * 2.5,
        width:  8 + Math.random() * 6,
        side,
        color:  side === "left" ? "#ef4444" : "#a855f7",
        phase:  Math.random() * Math.PI * 2,
        warned: false,
      });
    }

    function spawnExplosion(x, y, color, blocked) {
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 / 20) * i + Math.random() * 0.3;
        const speed = 2 + Math.random() * 5;
        g.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: blocked ? "#f97316" : color,
          size: blocked ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
        });
      }
      g.explosions.push({ x, y, r: 0, maxR: blocked ? 60 : 40, color, blocked });
    }

    function drawShield(x, y) {
      const active = g.shield.side !== "none";
      ctx.save();
      ctx.translate(x, y);

      // Shield glow
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, SHIELD_W * 0.7);
      grd.addColorStop(0, active ? "#f9731644" : "#00fff722");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(0, 0, SHIELD_W * 0.7, SHIELD_H * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shield body (hexagonal)
      ctx.beginPath();
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 / sides) * i - Math.PI / 6;
        const sx = Math.cos(angle) * (SHIELD_W * 0.45);
        const sy = Math.sin(angle) * (SHIELD_H * 0.5);
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.closePath();

      const col = active ? "#f97316" : "#00fff7";
      ctx.strokeStyle = col;
      ctx.lineWidth   = active ? 3 : 2;
      ctx.shadowBlur  = active ? 24 : 12;
      ctx.shadowColor = col;
      ctx.stroke();

      // Shield fill
      ctx.fillStyle = active ? "#f9731611" : "#00fff708";
      ctx.fill();

      // Inner energy lines
      ctx.shadowBlur = 0;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 16, -SHIELD_H * 0.35);
        ctx.lineTo(i * 16,  SHIELD_H * 0.35);
        ctx.strokeStyle = active ? "#f9731644" : "#00fff733";
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      // Direction indicator
      if (g.shield.side !== "none") {
        ctx.fillStyle   = "#f97316";
        ctx.font        = "bold 11px 'Orbitron',monospace";
        ctx.shadowBlur  = 8;
        ctx.shadowColor = "#f97316";
        ctx.textAlign   = "center";
        ctx.fillText(g.shield.side === "left" ? "◀ BLOCKING" : "BLOCKING ▶", 0, -SHIELD_H * 0.55);
      }

      ctx.restore();
    }

    function drawLaser(laser) {
      const wobble = Math.sin(laser.phase + laser.y * 0.05) * 3;
      ctx.save();

      // Warning beam (faint preview)
      if (laser.y < H * 0.4) {
        ctx.strokeStyle = laser.color + "33";
        ctx.lineWidth   = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(laser.x + wobble, laser.y);
        ctx.lineTo(laser.x + wobble, H - 80);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Laser bolt
      const grad = ctx.createLinearGradient(0, laser.y - 30, 0, laser.y + 10);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, laser.color);
      grad.addColorStop(1,   "#ffffff");
      ctx.strokeStyle = grad;
      ctx.lineWidth   = laser.width;
      ctx.shadowBlur  = 16;
      ctx.shadowColor = laser.color;
      ctx.lineCap     = "round";
      ctx.beginPath();
      ctx.moveTo(laser.x + wobble, laser.y - 28);
      ctx.lineTo(laser.x + wobble, laser.y + 6);
      ctx.stroke();

      // Bright core
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth   = laser.width * 0.3;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.moveTo(laser.x + wobble, laser.y - 20);
      ctx.lineTo(laser.x + wobble, laser.y + 4);
      ctx.stroke();

      ctx.restore();
      laser.phase += 0.15;
    }

    function drawHUD() {
      // Health bar
      const barW = 160, barH = 8;
      const barX = W / 2 - barW / 2, barY = 12;
      ctx.fillStyle = "#0a0a19";
      ctx.fillRect(barX, barY, barW, barH);
      const hpColor = g.health > 60 ? "#22c55e" : g.health > 30 ? "#facc15" : "#ef4444";
      ctx.fillStyle   = hpColor;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = hpColor;
      ctx.fillRect(barX, barY, barW * (g.health / 100), barH);
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = "#1e2040";
      ctx.lineWidth   = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.fillStyle = "#ffffff88";
      ctx.font      = "9px 'Share Tech Mono',monospace";
      ctx.textAlign = "center";
      ctx.fillText(`SHIELD ${g.health}%`, W / 2, barY + barH + 13);
      ctx.textAlign = "left";

      // Score
      ctx.fillStyle   = "#f97316";
      ctx.font        = "bold 12px 'Orbitron',monospace";
      ctx.shadowBlur  = 8;
      ctx.shadowColor = "#f97316";
      ctx.fillText(`BLOCKED: ${g.blocked}`, 14, 24);

      // Lunge prompt
      ctx.fillStyle  = "#ffffff22";
      ctx.font       = "10px 'Share Tech Mono',monospace";
      ctx.shadowBlur = 0;
      ctx.textAlign  = "center";
      ctx.fillText("LUNGE LEFT / RIGHT TO MOVE YOUR SHIELD", W / 2, H - 10);
      ctx.textAlign  = "left";
    }

    function loop() {
      g.tick++;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#060410";
      ctx.fillRect(0, 0, W, H);

      // Vertical lane lines (subtle)
      [120, 200, 310, 420, 500].forEach(lx => {
        ctx.strokeStyle = "#f9731606";
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
      });

      // Horizontal grid
      ctx.strokeStyle = "#a855f705";
      ctx.lineWidth   = 1;
      for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // Enemy emitters at top
      [120, 200, 310, 420, 500].forEach(lx => {
        ctx.beginPath();
        ctx.arc(lx, 18, 7, 0, Math.PI * 2);
        ctx.fillStyle   = "#ef444422";
        ctx.shadowBlur  = 10;
        ctx.shadowColor = "#ef4444";
        ctx.fill();
        ctx.strokeStyle = "#ef444466";
        ctx.lineWidth   = 1;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      });

      // Spawn lasers
      if (g.tick % 70 === 0 && g.alive) spawnLaser();

      // Smooth shield movement
      g.shield.x += (g.shield.targetX - g.shield.x) * 0.12;

      if (g.alive) {
        // Update & draw lasers
        g.lasers = g.lasers.filter(laser => {
          laser.y += laser.speed;
          const wobble = Math.sin(laser.phase) * 3;

          // Check if laser reaches shield zone
          if (laser.y >= SHIELD_Y - SHIELD_H * 0.5 && laser.y < SHIELD_Y + 20) {
            const dx = Math.abs((laser.x + wobble) - g.shield.x);
            const blocked = dx < SHIELD_W * 0.5;

            if (blocked) {
              spawnExplosion(laser.x + wobble, SHIELD_Y - SHIELD_H * 0.2, laser.color, true);
              g.blocked++;
              g.warnFlash = 0;
              return false;
            }
          }

          // Laser passed the shield
          if (laser.y > H) {
            g.health = Math.max(0, g.health - 12);
            g.warnFlash = 8;
            spawnExplosion(laser.x, H - 20, laser.color, false);
            if (g.health <= 0) g.alive = false;
            return false;
          }

          drawLaser(laser);
          return true;
        });

        // Draw shield
        drawShield(g.shield.x, SHIELD_Y);
      } else {
        // Game over
        ctx.fillStyle   = "#ef4444";
        ctx.font        = "bold 26px 'Orbitron',monospace";
        ctx.shadowBlur  = 20; ctx.shadowColor = "#ef4444";
        ctx.textAlign   = "center";
        ctx.fillText("SHIELD DESTROYED", W / 2, H / 2 - 16);
        ctx.font        = "13px 'Share Tech Mono',monospace";
        ctx.fillStyle   = "#ffffff88";
        ctx.fillText(`SHOTS BLOCKED: ${g.blocked}`, W / 2, H / 2 + 14);
        ctx.textAlign   = "left";
        setTimeout(() => {
          g.alive = true; g.health = 100; g.blocked = 0;
          g.lasers = []; g.score = 0; g.shield.x = 310;
        }, 2500);
      }

      // Explosions
      g.explosions = g.explosions.filter(ex => {
        ex.r += ex.blocked ? 5 : 3;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
        ctx.strokeStyle = ex.color;
        ctx.lineWidth   = 2;
        ctx.globalAlpha = Math.max(0, 1 - ex.r / ex.maxR);
        ctx.shadowBlur  = 10; ctx.shadowColor = ex.color;
        ctx.stroke();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        return ex.r < ex.maxR;
      });

      // Particles
      g.particles = g.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94;
        p.life -= 0.03;
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.shadowBlur  = 6; ctx.shadowColor = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        return p.life > 0;
      });

      // Damage flash
      if (g.warnFlash > 0) {
        ctx.fillStyle   = `rgba(239,68,68,${g.warnFlash * 0.015})`;
        ctx.fillRect(0, 0, W, H);
        g.warnFlash--;
      }

      drawHUD();
      g.frameId = requestAnimationFrame(loop);
    }

    g.frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(g.frameId);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={620} height={300}
        style={{ borderRadius:10, border:"1px solid #f9731633", display:"block", boxShadow:"0 0 28px #f9731618" }}
      />
      {!poseData && <GameOverlay color="#f97316" message="SHIELD WALL" hint="python pose_server.py" />}
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
      background:`linear-gradient(var(--primary-grid,rgba(0,255,247,0.025)) 1px, transparent 1px),
                  linear-gradient(90deg, var(--primary-grid,rgba(0,255,247,0.025)) 1px, transparent 1px)`,
      backgroundSize:"60px 60px",
      maskImage:"radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)",
    }} />
  );
}

// ─────────────────────────────────────────────
//  LIVE POSE STATS PANEL
// ─────────────────────────────────────────────
function LiveStatsPanel({ poseData, connected, activeGame }) {
  const isNeonSlicer  = activeGame === "neon-slicer";
  const isShieldWall  = activeGame === "shield-wall";
  const accentColor  = isNeonSlicer ? "#ff00aa" : isShieldWall ? "#f97316" : "#00fff7";

  return (
    <div style={{
      background:"rgba(10,10,25,0.95)",
      border:`1px solid ${connected ? "var(--primary,#00fff7)" : "#ef444433"}`,
      borderRadius:10, padding:"16px 20px",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <PulseOrb color={connected ? "var(--primary,#22c55e)" : "#ef4444"} size={7} />
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

          {/* Shield Wall stats */}
          {isShieldWall && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                {[
                  { label:"LUNGES",   value: poseData.lungeCount ?? 0,    color:"#f97316" },
                  { label:"SPREAD",   value: poseData.hipSpread  ?? 0,    color:"#facc15" },
                ].map(item => (
                  <div key={item.label} style={{ background:"#0a0a19", borderRadius:6, padding:"10px", textAlign:"center" }}>
                    <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444466", letterSpacing:1 }}>{item.label}</div>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:16, color:item.color, marginTop:3, textShadow:`0 0 8px ${item.color}` }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{
                padding:"8px 12px", borderRadius:6, textAlign:"center",
                background: poseData.lungeDir === "none" ? "#0a0a19" : "#f9731611",
                border:`1px solid ${poseData.lungeDir === "none" ? "#1e2040" : "#f9731644"}`,
                fontFamily:"'Orbitron',monospace", fontSize:12,
                color: poseData.lungeDir === "none" ? "#333355" : "#f97316",
                textShadow: poseData.lungeDir !== "none" ? "0 0 8px #f97316" : "none",
                transition:"all 0.2s",
              }}>
                {poseData.lungeDir === "left"  ? "◀ LUNGING LEFT"  :
                 poseData.lungeDir === "right" ? "LUNGING RIGHT ▶" :
                 "STAND CENTER"}
              </div>
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
function XPBar({ profile = defaultProfile(), sessionXp = 0 }) {
  const { totalXp, level, streak } = profile;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  const pct = totalXp === 0 ? 0 : (xpIntoLevel / XP_PER_LEVEL) * 100;
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;

  const streakLabel = streak === 0 ? "NONE"
    : streak === 1 ? "1 DAY"
    : `${streak} DAYS`;

  const streakAura = streak >= 14 ? " 🌟"
    : streak >= 7  ? " 💜"
    : streak >= 3  ? " 🔥"
    : "";

  return (
    <div style={{ background:"rgba(10,10,25,0.9)", border:"1px solid #1e2040", borderRadius:10, padding:"16px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:"var(--secondary,#a855f7)", letterSpacing:2 }}>
          PILOT LVL {level}
        </span>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466" }}>
          {totalXp.toLocaleString()} XP
        </span>
      </div>
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#333355", marginBottom:6 }}>
        {totalXp === 0 ? "PLAY GAMES TO EARN XP" : `${xpToNext} XP TO LEVEL ${level + 1}`}
      </div>
      <div style={{ background:"#0a0a19", borderRadius:4, height:7, overflow:"hidden" }}>
        <div style={{
          width:`${pct}%`, height:"100%",
          background:"linear-gradient(90deg,var(--secondary,#a855f7),var(--primary,#00fff7))",
          borderRadius:4, transition:"width 0.8s ease",
          minWidth: totalXp > 0 ? 4 : 0,
        }} />
      </div>
      <div style={{ display:"flex", gap:10, marginTop:10 }}>
        {[
          { label:"SESSION XP", value: sessionXp > 0 ? `+${sessionXp}` : "0",      icon:"⚡" },
          { label:"STREAK",     value: streakLabel + streakAura,                    icon:"🔥" },
          { label:"TOTAL XP",   value: totalXp > 999 ? `${(totalXp/1000).toFixed(1)}K` : `${totalXp}`, icon:"🏆" },
        ].map(item => (
          <div key={item.label} style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:13 }}>{item.icon}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444466", marginTop:2 }}>{item.label}</div>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"var(--primary,#00fff7)", marginTop:1, letterSpacing:1 }}>{item.value}</div>
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
export default function KinetiCore({ user = {}, onLogout }) {
  const [tab,        setTab]        = useState("arena");
  const [activeGame, setActiveGame] = useState("gravity-well");
  const [poseData,   setPoseData]   = useState(null);
  const [connected,  setConnected]  = useState(false);
  const [wsStatus,   setWsStatus]   = useState("AWAITING POSE SERVER");
  const [theme,      setTheme]      = useState("cyan");
  const [showPanel,  setShowPanel]  = useState(false);
  const [profile,    setProfile]    = useState(() => loadProfile(user?.username));
  const lastSavedXp = useRef(0);

  // ── Global styles ────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
      @keyframes orb-pulse     { 0%,100%{opacity:1;transform:scale(1)}   50%{opacity:0.4;transform:scale(0.75)} }
      @keyframes title-flicker { 0%,100%{opacity:1} 91%{opacity:1} 92%{opacity:0.4} 94%{opacity:1} 96%{opacity:0.6} }
      @keyframes float-up      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      @keyframes panel-in { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      @keyframes logout-flash { 0%{opacity:1} 50%{opacity:0.3} 100%{opacity:1} }
      * { box-sizing:border-box; margin:0; padding:0; }
      body { background:#05050f; }
      ::-webkit-scrollbar       { width:4px; }
      ::-webkit-scrollbar-track { background:#050510; }
      /* scrollbar thumb set by theme effect */
    `;
    style.id = "kc-main-style";
    // Create separate scrollbar style so theme can update it
    const sbStyle = document.createElement("style");
    sbStyle.id = "kc-scrollbar-style";
    sbStyle.textContent = "::-webkit-scrollbar-thumb { background: #00fff744; border-radius:4px; }";
    document.head.appendChild(sbStyle);
    document.head.appendChild(style);
    return () => {
      const s = document.getElementById("kc-main-style");
      const sb = document.getElementById("kc-scrollbar-style");
      if (s)  document.head.removeChild(s);
      if (sb) document.head.removeChild(sb);
    };
  }, []);

  // ── Theme CSS variables ─────────────────────
  useEffect(() => {
    const t = THEMES[theme];
    const root = document.documentElement;
    root.style.setProperty("--primary",   t.primary);
    root.style.setProperty("--secondary", t.secondary);
    root.style.setProperty("--accent",    t.accent);
    root.style.setProperty("--gradient",  t.gradient);
    // Compute a low-alpha version for grid
    const hex = t.primary.replace("#","");
    const r = parseInt(hex.slice(0,2),16), g2 = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    root.style.setProperty("--primary-grid", `rgba(${r},${g2},${b},0.028)`);
    // Scrollbar thumb color
    const thumb = document.getElementById("kc-scrollbar-style");
    if (thumb) thumb.textContent = `::-webkit-scrollbar-thumb { background: ${t.primary}44; border-radius:4px; }`;
  }, [theme]);

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

  const sessionXp = poseData?.xp ?? 0;

  // Whenever sessionXp increases, update and save the profile
  useEffect(() => {
    const gained = sessionXp - lastSavedXp.current;
    if (gained > 0) {
      lastSavedXp.current = sessionXp;
      setProfile(prev => {
        const updated = addXpToProfile(prev, gained);
        saveProfile(user?.username, updated);
        return updated;
      });
    }
  }, [sessionXp]);

  return (
    <div style={{ minHeight:"100vh", background:"#05050f", color:"#e0e0ff", fontFamily:"'Share Tech Mono',monospace", position:"relative", overflowX:"hidden" }}>
      <ScanlineOverlay />
      <AnimatedGrid />
      <div style={{ position:"fixed", top:-200, left:-200,  width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,${THEMES[theme].primary}0c,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:-200, right:-100, width:600, height:600, borderRadius:"50%", background:`radial-gradient(circle,${THEMES[theme].secondary}0c,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:980, margin:"0 auto", padding:"0 20px 60px" }}>

        {/* ── HEADER ── */}
        <AvatarPanel
          user={user} theme={theme} setTheme={setTheme}
          show={showPanel} setShow={setShowPanel} onLogout={onLogout}
          connected={connected} wsStatus={wsStatus}
          profile={profile}
        />
        <header style={{ padding:"28px 0 20px", borderBottom:"1px solid #0e0e22" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <PulseOrb color={connected ? "var(--primary,#22c55e)" : "#ef4444"} size={7} />
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:2, color: connected?"#22c55e":"#ef4444" }}>{wsStatus}</span>
              </div>
              <h1 style={{ fontFamily:"'Orbitron',monospace", fontSize:"clamp(26px,6vw,50px)", fontWeight:900,
                background:THEMES[theme].gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                letterSpacing:4, animation:"title-flicker 9s infinite", lineHeight:1.1 }}>
                KINETICORE
              </h1>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#333355", letterSpacing:3, marginTop:3 }}>
                THE MOTION-SENSING COMBAT ARENA
              </div>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <div style={{ background:"rgba(10,10,25,0.9)", border:`1px solid ${connected?THEMES[theme].primary+"22":"#333355"}`, borderRadius:10, padding:"12px 16px", fontFamily:"'Share Tech Mono',monospace", fontSize:11, lineHeight:2, color:"#555577" }}>
                <div style={{ color:THEMES[theme].primary, marginBottom:3, letterSpacing:1 }}>QUICK START</div>
                <div>1. <span style={{color:"#a855f7"}}>kineticore-env\Scripts\activate</span></div>
                <div>2. <span style={{color:"#a855f7"}}>python pose_server.py</span></div>
                <div>3. Stand in front of webcam &amp; move!</div>
              </div>
              {/* Avatar button */}
              <div onClick={() => setShowPanel(p => !p)} style={{
                width:46, height:46, borderRadius:"50%",
                border:`1px solid ${THEMES[theme].primary}66`,
                background:`${THEMES[theme].primary}11`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, cursor:"pointer",
                boxShadow:`0 0 14px ${THEMES[theme].primary}33`,
                transition:"all 0.2s",
                flexShrink:0,
              }}>
                {user.avatar || "⚡"}
              </div>
            </div>
          </div>
        </header>

        {/* ── TABS ── */}
        <nav style={{ display:"flex", borderBottom:"1px solid #0e0e22", marginBottom:22, marginTop:18 }}>
          {[{id:"arena",label:"COMBAT ARENA"},{id:"leaderboard",label:"LEADERBOARDS"},{id:"tech",label:"TECH STACK"}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background:"none", border:"none",
              borderBottom: tab===t.id ? `2px solid ${THEMES[theme].primary}`:"2px solid transparent",
              color: tab===t.id ? THEMES[theme].primary:"#333355",
              fontFamily:"'Orbitron',monospace", fontSize:11, letterSpacing:2,
              padding:"10px 20px", cursor:"pointer",
              textShadow: tab===t.id ? `0 0 10px ${THEMES[theme].primary}`:"none",
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
              {activeGame === "shield-wall" && (
                <div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444466", letterSpacing:2, marginBottom:8 }}>▶ SHIELD WALL — LIVE GAMEPLAY</div>
                  <ShieldWallGame poseData={poseData} />
                </div>
              )}
              {!["gravity-well","neon-slicer","shield-wall"].includes(activeGame) && activeGame && (
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
              <XPBar profile={profile} sessionXp={sessionXp} />

              {/* Skill Tree */}
              <div style={{ background:"rgba(10,10,25,0.9)", border:"1px solid #1e2040", borderRadius:10, padding:"16px 20px" }}>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:"#22c55e", letterSpacing:3, marginBottom:12, textShadow:"0 0 8px #22c55e55" }}>▶ SKILL TREE</div>
                {[
                  { name:"HYPER DASH", unlocked:true,  color:"#00fff7", req:"ACTIVE"   },
                  { name:"NEON TRAIL", unlocked:true,  color:"#a855f7", req:"ACTIVE"   },
                  { name:"GHOST MODE", unlocked:(profile?.level ?? 1) >= 10, color:"#22c55e", req:"LVL 10"   },
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
              <div style={{ background:`linear-gradient(135deg,var(--primary,#00fff7)08,var(--secondary,#a855f7)08)`, border:`1px solid var(--primary,#00fff7)22`, borderRadius:10, padding:"14px 16px", animation:"float-up 4s ease-in-out infinite" }}>
                <div style={{ fontSize:20, marginBottom:6 }}>👻</div>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:"var(--primary,#00fff7)", letterSpacing:2 }}>GHOST MODE</div>
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
            <PulseOrb color={connected?`var(--primary,#22c55e)`:"#ef4444"} size={5} />
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#222244" }}>{connected?"ALL SYSTEMS NOMINAL":"AWAITING POSE SERVER"}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}