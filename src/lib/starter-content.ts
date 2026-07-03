export const starterGifPresets = [
  {
    name: "Soft Pulse",
    css: "animation: fx 1.6s ease-in-out infinite; transform-origin: center;",
    keyframes:
      "@keyframes fx { 0%, 100% { transform: scale(0.94); opacity: 0.72; } 50% { transform: scale(1); opacity: 1; } }",
  },
  {
    name: "Gentle Float",
    css: "animation: fx 2s ease-in-out infinite;",
    keyframes:
      "@keyframes fx { 0%, 100% { transform: translateY(8%); } 50% { transform: translateY(-8%); } }",
  },
  {
    name: "Notification Bounce",
    css: "animation: fx 1.2s cubic-bezier(.36,.07,.19,.97) infinite; transform-origin: center bottom;",
    keyframes:
      "@keyframes fx { 0%, 55%, 100% { transform: translateY(0) scale(1); } 20% { transform: translateY(-18%) scale(1.04); } 35% { transform: translateY(0) scale(.98); } 45% { transform: translateY(-7%) scale(1.01); } }",
  },
  {
    name: "Attention Shake",
    css: "animation: fx .8s ease-in-out infinite;",
    keyframes:
      "@keyframes fx { 0%, 100% { transform: translateX(0) rotate(0); } 20% { transform: translateX(-7%) rotate(-4deg); } 40% { transform: translateX(6%) rotate(3deg); } 60% { transform: translateX(-4%) rotate(-2deg); } 80% { transform: translateX(2%) rotate(1deg); } }",
  },
  {
    name: "Neon Glow",
    css: "animation: fx 1.8s ease-in-out infinite;",
    keyframes:
      "@keyframes fx { 0%, 100% { filter: brightness(.85) drop-shadow(0 0 0 #22d3ee); } 50% { filter: brightness(1.25) drop-shadow(0 0 8px #22d3ee); } }",
  },
  {
    name: "Smooth Spin",
    css: "animation: fx 1.5s linear infinite;",
    keyframes: "@keyframes fx { to { transform: rotate(360deg); } }",
  },
];

export const starterComponents = [
  {
    name: "Primary Action Button",
    variants: {
      html_css: {
        html: '<button class="primary-btn">Continue <span>→</span></button>',
        css: ".primary-btn{display:inline-flex;align-items:center;gap:.6rem;padding:.75rem 1.1rem;border:0;border-radius:.75rem;background:#14b8a6;color:#042f2e;font:600 14px system-ui;box-shadow:0 8px 24px #14b8a633;cursor:pointer;transition:.2s}.primary-btn:hover{transform:translateY(-2px);background:#2dd4bf}",
      },
      react_css: {
        react:
          "function App(){return <button className=\"primary-btn\" onClick={()=>alert('Continue')}>Continue <span>→</span></button>}",
        css: ".primary-btn{display:inline-flex;align-items:center;gap:.6rem;padding:.75rem 1.1rem;border:0;border-radius:.75rem;background:#14b8a6;color:#042f2e;font:600 14px system-ui;cursor:pointer}",
      },
      react_tailwind: {
        react:
          "function App(){return <button onClick={()=>alert('Continue')} className=\"inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-semibold text-teal-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-300\">Continue <span>→</span></button>}",
      },
    },
  },
  {
    name: "Status Alert",
    variants: {
      html_css: {
        html: '<div class="alert"><span class="alert-icon">✓</span><div><strong>Changes saved</strong><p>Your settings are now up to date.</p></div></div>',
        css: ".alert{display:flex;gap:12px;max-width:360px;padding:16px;border:1px solid #34d39955;border-radius:12px;background:#064e3b55;color:#d1fae5;font:14px system-ui}.alert-icon{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#34d399;color:#022c22;font-weight:800}.alert p{margin:4px 0 0;color:#a7f3d0}",
      },
      react_css: {
        react:
          'function App(){return <div className="alert"><span className="alert-icon">✓</span><div><strong>Changes saved</strong><p>Your settings are now up to date.</p></div></div>}',
        css: ".alert{display:flex;gap:12px;padding:16px;border:1px solid #34d39955;border-radius:12px;background:#064e3b55;color:#d1fae5;font:14px system-ui}.alert-icon{font-weight:800}.alert p{margin:4px 0 0}",
      },
      react_tailwind: {
        react:
          'function App(){return <div className="flex max-w-sm gap-3 rounded-xl border border-emerald-400/30 bg-emerald-950/60 p-4 text-emerald-100"><span className="grid size-6 place-items-center rounded-full bg-emerald-400 font-bold text-emerald-950">✓</span><div><strong>Changes saved</strong><p className="mt-1 text-sm text-emerald-200">Your settings are now up to date.</p></div></div>}',
      },
    },
  },
  {
    name: "Profile Card",
    variants: {
      html_css: {
        html: '<article class="profile"><div class="avatar">AM</div><div><h3>Alex Morgan</h3><p>Product designer</p></div><button>Follow</button></article>',
        css: ".profile{display:flex;align-items:center;gap:14px;width:min(420px,90vw);padding:18px;border:1px solid #ffffff1f;border-radius:16px;background:#171a22;color:white;font:14px system-ui;box-shadow:0 18px 50px #0006}.avatar{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#2dd4bf,#818cf8);font-weight:800}.profile h3,.profile p{margin:0}.profile p{margin-top:4px;color:#9ca3af}.profile button{margin-left:auto;padding:8px 14px;border:0;border-radius:9px;background:#fff;color:#111827;font-weight:700}",
      },
      react_css: {
        react:
          'function App(){return <article className="profile"><div className="avatar">AM</div><div><h3>Alex Morgan</h3><p>Product designer</p></div><button>Follow</button></article>}',
        css: ".profile{display:flex;align-items:center;gap:14px;padding:18px;border:1px solid #ffffff1f;border-radius:16px;background:#171a22;color:white;font:14px system-ui}.avatar{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#2dd4bf}.profile h3,.profile p{margin:0}.profile button{margin-left:auto}",
      },
      react_tailwind: {
        react:
          'function App(){return <article className="flex w-full max-w-md items-center gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 text-white shadow-2xl"><div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-indigo-400 font-bold">AM</div><div><h3 className="font-semibold">Alex Morgan</h3><p className="text-sm text-slate-400">Product designer</p></div><button className="ml-auto rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900">Follow</button></article>}',
      },
    },
  },
  {
    name: "Loading Dots",
    variants: {
      html_css: {
        html: '<div class="loader" aria-label="Loading"><i></i><i></i><i></i></div>',
        css: ".loader{display:flex;gap:7px}.loader i{width:10px;height:10px;border-radius:50%;background:#2dd4bf;animation:dot .8s ease-in-out infinite}.loader i:nth-child(2){animation-delay:.12s}.loader i:nth-child(3){animation-delay:.24s}@keyframes dot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-8px);opacity:1}}",
      },
      react_css: {
        react:
          'function App(){return <div className="loader" aria-label="Loading"><i/><i/><i/></div>}',
        css: ".loader{display:flex;gap:7px}.loader i{width:10px;height:10px;border-radius:50%;background:#2dd4bf;animation:dot .8s ease-in-out infinite}.loader i:nth-child(2){animation-delay:.12s}.loader i:nth-child(3){animation-delay:.24s}@keyframes dot{50%{transform:translateY(-8px)}}",
      },
      react_tailwind: {
        react:
          'function App(){return <div className="flex gap-2" aria-label="Loading">{[0,1,2].map(i=><span key={i} className="size-2.5 animate-bounce rounded-full bg-teal-400" style={{animationDelay:`${i*120}ms`}} />)}</div>}',
      },
    },
  },
];
