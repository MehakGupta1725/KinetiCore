import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
//  PARTICLE FIELD BACKGROUND
// ─────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    (Math.random() - 0.5) * 0.4,
      r:     Math.random() * 1.5 + 0.3,
      color: Math.random() > 0.6 ? "#00fff7" : Math.random() > 0.5 ? "#a855f7" : "#ff00aa",
      alpha: Math.random() * 0.6 + 0.2,
    }));

    let frameId;
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Perspective grid
      ctx.strokeStyle = "#00fff705";
      ctx.lineWidth = 1;
      const cols = 12, rows = 8;
      for (let i = 0; i <= cols; i++) {
        const x = (canvas.width / cols) * i;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let i = 0; i <= rows; i++) {
        const y = (canvas.height / rows) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Particles + connections
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw connections
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6; ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      });

      frameId = requestAnimationFrame(loop);
    }

    loop();
    return () => { cancelAnimationFrame(frameId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    }} />
  );
}

// ─────────────────────────────────────────────
//  SCANLINES
// ─────────────────────────────────────────────
function Scanlines() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
    }} />
  );
}

// ─────────────────────────────────────────────
//  CYBER INPUT
// ─────────────────────────────────────────────
function CyberInput({ label, type = "text", value, onChange, placeholder, icon, error }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: "block",
        fontFamily: "'Orbitron', monospace",
        fontSize: 10,
        letterSpacing: 2,
        color: focused ? "#00fff7" : "#444466",
        marginBottom: 7,
        transition: "color 0.2s",
      }}>
        {label}
      </label>
      <div style={{
        position: "relative",
        border: `1px solid ${error ? "#ef4444" : focused ? "#00fff7" : "#1e2040"}`,
        borderRadius: 6,
        background: focused ? "#00fff705" : "#0a0a19",
        boxShadow: focused ? `0 0 16px #00fff722, inset 0 0 12px #00fff705` : error ? "0 0 10px #ef444422" : "none",
        transition: "all 0.25s ease",
      }}>
        {/* Left accent bar */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          borderRadius: "6px 0 0 6px",
          background: error ? "#ef4444" : focused ? "#00fff7" : "#1e2040",
          transition: "background 0.25s",
        }} />
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 16 }}>
          {icon && (
            <span style={{ fontSize: 14, marginRight: 10, opacity: focused ? 1 : 0.4, transition: "opacity 0.2s" }}>
              {icon}
            </span>
          )}
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "#e0e0ff",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 13,
              padding: "14px 14px 14px 0",
              letterSpacing: 1,
            }}
          />
        </div>
        {/* Corner accent */}
        <div style={{
          position: "absolute", bottom: -1, right: -1,
          width: 10, height: 10,
          borderBottom: `1px solid ${focused ? "#00fff7" : "#1e2040"}`,
          borderRight: `1px solid ${focused ? "#00fff7" : "#1e2040"}`,
          transition: "border-color 0.25s",
        }} />
      </div>
      {error && (
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#ef4444", marginTop: 5, letterSpacing: 1 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  CYBER BUTTON
// ─────────────────────────────────────────────
function CyberButton({ label, onClick, loading, color = "#00fff7", disabled }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "15px 0",
        background: hovered && !loading ? `${color}18` : "transparent",
        border: `1px solid ${color}`,
        borderRadius: 6,
        color,
        fontFamily: "'Orbitron', monospace",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 3,
        cursor: loading || disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        boxShadow: hovered && !loading
          ? `0 0 24px ${color}55, inset 0 0 16px ${color}11`
          : `0 0 8px ${color}22`,
        textShadow: hovered ? `0 0 10px ${color}` : "none",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Scan line effect on hover */}
      {hovered && !loading && (
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(90deg, transparent, ${color}11, transparent)`,
          animation: "btn-scan 0.6s ease infinite",
        }} />
      )}
      {loading ? (
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ display: "inline-block", width: 14, height: 14, border: `2px solid ${color}44`, borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          AUTHENTICATING...
        </span>
      ) : label}
    </button>
  );
}

// ─────────────────────────────────────────────
//  STRENGTH METER (password)
// ─────────────────────────────────────────────
function StrengthMeter({ password }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)  s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const labels = ["", "WEAK", "FAIR", "STRONG", "UNBREAKABLE"];
  const colors = ["#333355", "#ef4444", "#f97316", "#facc15", "#22c55e"];

  if (!password) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= score ? colors[score] : "#0a0a19",
            boxShadow: i <= score ? `0 0 6px ${colors[score]}` : "none",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: colors[score], letterSpacing: 1 }}>
        SIGNAL STRENGTH: {labels[score] || "NONE"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  LOGIN FORM
// ─────────────────────────────────────────────
function LoginForm({ onSwitch, onLogin }) {
  const [form,    setForm]    = useState({ identifier: "", password: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.identifier) errs.identifier = "Pilot ID or email required";
    if (!form.password)   errs.password   = "Password required";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    onLogin({ username: form.identifier });
  };

  return (
    <div>
      <CyberInput
        label="PILOT ID / EMAIL"
        icon="👤"
        placeholder="your_callsign or email@arena.com"
        value={form.identifier}
        onChange={set("identifier")}
        error={errors.identifier}
      />
      <CyberInput
        label="ACCESS CODE"
        type="password"
        icon="🔐"
        placeholder="••••••••••••"
        value={form.password}
        onChange={set("password")}
        error={errors.password}
      />
      <div style={{ textAlign: "right", marginBottom: 24, marginTop: -10 }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#444466", cursor: "pointer", letterSpacing: 1 }}>
          FORGOT ACCESS CODE?
        </span>
      </div>
      <CyberButton label="ENTER THE ARENA" onClick={handleSubmit} loading={loading} />
      <div style={{ textAlign: "center", marginTop: 22, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#333355" }}>
        NO PILOT PROFILE?{" "}
        <span onClick={onSwitch} style={{ color: "#a855f7", cursor: "pointer", textShadow: "0 0 8px #a855f755", letterSpacing: 1 }}>
          CREATE ONE →
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SIGNUP FORM
// ─────────────────────────────────────────────
function SignupForm({ onSwitch, onSignup }) {
  const [form, setForm] = useState({
    username: "", email: "", password: "", confirm: "", avatar: "🚀",
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(1); // 1 = credentials, 2 = pilot config

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const AVATARS = ["🚀","⚡","💀","🌀","🔥","🛡","💥","🏗"];

  const validateStep1 = () => {
    const errs = {};
    if (!form.username || form.username.length < 3) errs.username = "Min 3 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (!form.password || form.password.length < 6)     errs.password = "Min 6 characters";
    if (form.password !== form.confirm) errs.confirm = "Codes don't match";
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    onSignup({ username: form.username, avatar: form.avatar });
  };

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, alignItems: "center" }}>
        {[1, 2].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              border: `1px solid ${step >= s ? "#00fff7" : "#1e2040"}`,
              background: step > s ? "#00fff722" : step === s ? "#00fff711" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Orbitron', monospace", fontSize: 10,
              color: step >= s ? "#00fff7" : "#333355",
              boxShadow: step === s ? "0 0 12px #00fff744" : "none",
              transition: "all 0.3s",
            }}>
              {step > s ? "✓" : s}
            </div>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: step >= s ? "#00fff7" : "#333355", letterSpacing: 1 }}>
              {s === 1 ? "CREDENTIALS" : "PILOT CONFIG"}
            </span>
            {s < 2 && <div style={{ width: 30, height: 1, background: step > s ? "#00fff733" : "#1e2040", marginLeft: 4 }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <CyberInput label="PILOT CALLSIGN" icon="👤" placeholder="e.g. VORTEX_X" value={form.username} onChange={set("username")} error={errors.username} />
          <CyberInput label="SECURE EMAIL"   icon="📡" placeholder="pilot@arena.com"  value={form.email}    onChange={set("email")}    error={errors.email}    />
          <CyberInput label="ACCESS CODE"    icon="🔐" type="password" placeholder="Min 6 characters"  value={form.password} onChange={set("password")} error={errors.password} />
          <StrengthMeter password={form.password} />
          <CyberInput label="CONFIRM CODE"   icon="🔐" type="password" placeholder="Repeat access code" value={form.confirm}  onChange={set("confirm")}  error={errors.confirm}  />
          <CyberButton label="NEXT: CONFIGURE PILOT →" onClick={handleNext} color="#a855f7" />
          <div style={{ textAlign: "center", marginTop: 22, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#333355" }}>
            ALREADY ENLISTED?{" "}
            <span onClick={onSwitch} style={{ color: "#00fff7", cursor: "pointer", textShadow: "0 0 8px #00fff755", letterSpacing: 1 }}>
              LOGIN →
            </span>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {/* Avatar selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: "#444466", letterSpacing: 2, marginBottom: 12 }}>
              CHOOSE PILOT AVATAR
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AVATARS.map(av => (
                <div
                  key={av}
                  onClick={() => setForm(f => ({ ...f, avatar: av }))}
                  style={{
                    width: 48, height: 48,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                    borderRadius: 8,
                    border: `1px solid ${form.avatar === av ? "#00fff7" : "#1e2040"}`,
                    background: form.avatar === av ? "#00fff711" : "#0a0a19",
                    boxShadow: form.avatar === av ? "0 0 14px #00fff744" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    transform: form.avatar === av ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {av}
                </div>
              ))}
            </div>
          </div>

          {/* Pilot summary */}
          <div style={{
            background: "#0a0a19",
            border: "1px solid #1e2040",
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 24,
          }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: "#444466", letterSpacing: 2, marginBottom: 10 }}>PILOT PROFILE PREVIEW</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                border: "1px solid #00fff744",
                background: "#00fff711",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
                boxShadow: "0 0 16px #00fff733",
              }}>
                {form.avatar}
              </div>
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, color: "#00fff7", letterSpacing: 2, textShadow: "0 0 10px #00fff7" }}>
                  {form.username || "PILOT"}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#444466", marginTop: 3 }}>{form.email}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  {["LVL 1", "0 XP", "ROOKIE"].map(tag => (
                    <span key={tag} style={{
                      fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
                      color: "#333355", border: "1px solid #1e2040",
                      borderRadius: 3, padding: "2px 6px", letterSpacing: 1,
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <CyberButton label="INITIALIZE PILOT" onClick={handleSubmit} loading={loading} />
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <span onClick={() => setStep(1)} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#444466", cursor: "pointer", letterSpacing: 1 }}>
              ← BACK
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  SUCCESS SCREEN
// ─────────────────────────────────────────────
function SuccessScreen({ user, mode, onEnter }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(timer); onEnter(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div style={{
        fontSize: 60, marginBottom: 16,
        filter: "drop-shadow(0 0 20px #00fff7)",
        animation: "float-up 2s ease-in-out infinite",
      }}>
        {user.avatar || "⚡"}
      </div>
      <div style={{
        fontFamily: "'Orbitron', monospace", fontSize: 20, fontWeight: 900,
        background: "linear-gradient(90deg, #00fff7, #a855f7)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        letterSpacing: 3, marginBottom: 8,
      }}>
        {mode === "login" ? "ACCESS GRANTED" : "PILOT INITIALIZED"}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#555577", marginBottom: 24, letterSpacing: 1 }}>
        WELCOME BACK, {(user.username || "PILOT").toUpperCase()}
      </div>
      <div style={{
        background: "#00fff711",
        border: "1px solid #00fff733",
        borderRadius: 8, padding: "12px 20px",
        fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#00fff7",
        letterSpacing: 1,
      }}>
        ENTERING ARENA IN {count}...
      </div>

      {/* XP earned on login */}
      {mode === "login" && (
        <div style={{ marginTop: 14, fontFamily: "'Orbitron', monospace", fontSize: 11, color: "#facc15", textShadow: "0 0 8px #facc1555" }}>
          +50 XP DAILY LOGIN BONUS ⚡
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN AUTH PAGE
// ─────────────────────────────────────────────
export default function AuthPage({ onEnter }) {
  const [mode,    setMode]    = useState("login"); // login | signup
  const [user,    setUser]    = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
      @keyframes float-up  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-8px)} }
      @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes btn-scan   { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
      @keyframes flicker    { 0%,100%{opacity:1} 91%{opacity:1} 92%{opacity:0.3} 94%{opacity:1} 97%{opacity:0.7} }
      @keyframes card-in    { from{opacity:0;transform:translateY(30px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
      * { box-sizing:border-box; margin:0; padding:0; }
      body { background:#05050f; }
      ::-webkit-scrollbar { width:4px; }
      ::-webkit-scrollbar-track { background:#050510; }
      ::-webkit-scrollbar-thumb { background:#00fff733; border-radius:4px; }
      input::placeholder { color:#222244; }
    `;
    document.head.appendChild(style);
    setTimeout(() => setVisible(true), 50);
    return () => document.head.removeChild(style);
  }, []);

  const handleLogin  = (u) => setUser({ ...u, avatar: "⚡", _mode: "login"  });
  const handleSignup = (u) => setUser({ ...u, _mode: "signup" });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#05050f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "20px",
    }}>
      <ParticleField />
      <Scanlines />

      {/* Ambient glows */}
      <div style={{ position:"fixed", top:-300, left:-300, width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,#00fff708,transparent 65%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:-300, right:-200, width:800, height:800, borderRadius:"50%", background:"radial-gradient(circle,#a855f708,transparent 65%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"30%", right:"-10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,#ff00aa05,transparent 65%)", pointerEvents:"none", zIndex:0 }} />

      {/* Main card */}
      <div style={{
        position: "relative", zIndex: 2,
        width: "100%", maxWidth: 440,
        animation: visible ? "card-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
        opacity: visible ? 1 : 0,
      }}>

        {/* Top bar */}
        <div style={{
          background: "rgba(5,5,15,0.9)",
          border: "1px solid #0e0e22",
          borderBottom: "none",
          borderRadius: "12px 12px 0 0",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          {["#ef4444","#facc15","#22c55e"].map((c,i) => (
            <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:c, opacity:0.6 }} />
          ))}
          <div style={{ flex:1, textAlign:"center", fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#222244", letterSpacing:2 }}>
            KINETICORE // SECURE ACCESS TERMINAL
          </div>
        </div>

        {/* Card body */}
        <div style={{
          background: "rgba(8,8,20,0.95)",
          border: "1px solid #0e0e22",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: "32px 32px 28px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px #00fff708",
        }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            {/* Pulse rings */}
            <div style={{ position:"relative", display:"inline-block" }}>
              <div style={{
                position:"absolute", inset:-16,
                borderRadius:"50%", border:"1px solid #00fff722",
                animation:"pulse-ring 2s ease-out infinite",
              }} />
              <div style={{
                position:"absolute", inset:-8,
                borderRadius:"50%", border:"1px solid #00fff733",
                animation:"pulse-ring 2s ease-out infinite 0.5s",
              }} />
              <div style={{
                width:64, height:64, borderRadius:"50%",
                border:"1px solid #00fff766",
                background:"linear-gradient(135deg,#00fff711,#a855f711)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:28,
                boxShadow:"0 0 24px #00fff733",
                margin:"0 auto 16px",
              }}>
                ⚡
              </div>
            </div>
            <div style={{ marginTop:16 }}>
              <div style={{
                fontFamily:"'Orbitron',monospace", fontSize:24, fontWeight:900,
                background:"linear-gradient(90deg,#00fff7,#a855f7,#ff00aa)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                letterSpacing:4, animation:"flicker 8s infinite",
              }}>
                KINETICORE
              </div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#333355", letterSpacing:3, marginTop:3 }}>
                MOTION-SENSING COMBAT ARENA
              </div>
            </div>
          </div>

          {!user ? (
            <>
              {/* Mode toggle */}
              <div style={{
                display:"flex", background:"#0a0a19",
                border:"1px solid #1e2040", borderRadius:8,
                padding:4, marginBottom:28,
              }}>
                {[
                  { id:"login",  label:"LOGIN"  },
                  { id:"signup", label:"ENLIST" },
                ].map(m => (
                  <div
                    key={m.id}
                    onClick={() => { setMode(m.id); setUser(null); }}
                    style={{
                      flex:1, textAlign:"center",
                      padding:"9px 0",
                      borderRadius:6,
                      background: mode===m.id ? "#00fff711" : "transparent",
                      border: mode===m.id ? "1px solid #00fff733" : "1px solid transparent",
                      fontFamily:"'Orbitron',monospace", fontSize:11, letterSpacing:2,
                      color: mode===m.id ? "#00fff7" : "#333355",
                      cursor:"pointer",
                      boxShadow: mode===m.id ? "0 0 12px #00fff722" : "none",
                      transition:"all 0.2s",
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {mode === "login"
                ? <LoginForm  onSwitch={() => setMode("signup")} onLogin={handleLogin}   />
                : <SignupForm onSwitch={() => setMode("login")}  onSignup={handleSignup} />
              }

              {/* Divider */}
              <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
                <div style={{ flex:1, height:1, background:"#0e0e22" }} />
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#222244", letterSpacing:1 }}>OR CONNECT</span>
                <div style={{ flex:1, height:1, background:"#0e0e22" }} />
              </div>

              {/* Social buttons */}
              <div style={{ display:"flex", gap:10 }}>
                {[
                  { label:"GOOGLE",  icon:"G", color:"#ea4335" },
                  { label:"DISCORD", icon:"D", color:"#5865f2" },
                  { label:"GITHUB",  icon:"⌥", color:"#ffffff" },
                ].map(btn => (
                  <div key={btn.label} style={{
                    flex:1, textAlign:"center",
                    border:`1px solid ${btn.color}33`,
                    borderRadius:6, padding:"10px 0",
                    background:`${btn.color}08`,
                    cursor:"pointer",
                    fontFamily:"'Orbitron',monospace", fontSize:9,
                    color:btn.color, letterSpacing:1,
                    transition:"all 0.2s",
                  }}>
                    <div style={{ fontSize:14, marginBottom:2 }}>{btn.icon}</div>
                    {btn.label}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <SuccessScreen user={user} mode={user._mode} onEnter={onEnter} />
          )}
        </div>

        {/* Bottom tagline */}
        {!user && (
          <div style={{ textAlign:"center", marginTop:16, fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#1a1a33", letterSpacing:1 }}>
            BY ENTERING, YOU ACCEPT THE ARENA TERMS OF COMBAT
          </div>
        )}
      </div>
    </div>
  );
}