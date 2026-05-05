"use client";

import { useState, useEffect, useRef } from 'react';

// ── Utility: scroll-reveal hook ──
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Smooth scroll utility ──
function smoothScrollTo(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const start = window.scrollY;
  const end = el.getBoundingClientRect().top + window.scrollY - 56;
  const dist = end - start;
  const duration = 700;
  let startTime = null;
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = (ts) => {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + dist * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Animated particle canvas ──
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56,189,248,0.6)';
        ctx.fill();
      });
      particles.forEach((a, i) => particles.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(56,189,248,${0.15 * (1 - d / 120)})`;
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// ── Glitch Text ──
function GlitchText({ text, className = '' }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const t = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 200); }, 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={`relative inline-block ${className}`} style={{ fontFamily: 'monospace' }}>
      {text}
      {glitch && <>
        <span className="absolute inset-0 text-cyan-400 opacity-80" style={{ clipPath: 'inset(30% 0 40% 0)', transform: 'translate(-3px,0)' }}>{text}</span>
        <span className="absolute inset-0 text-pink-400 opacity-80" style={{ clipPath: 'inset(60% 0 10% 0)', transform: 'translate(3px,0)' }}>{text}</span>
      </>}
    </span>
  );
}

// ── Typed effect ──
function TypedText({ words }) {
  const [idx, setIdx] = useState(0);
  const [sub, setSub] = useState('');
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[idx % words.length];
    const speed = del ? 60 : 100;
    const t = setTimeout(() => {
      if (!del) {
        setSub(word.slice(0, sub.length + 1));
        if (sub.length + 1 === word.length) setTimeout(() => setDel(true), 1200);
      } else {
        setSub(word.slice(0, sub.length - 1));
        if (sub.length - 1 === 0) { setDel(false); setIdx(i => i + 1); }
      }
    }, speed);
    return () => clearTimeout(t);
  }, [sub, del, idx, words]);
  return <span className="text-cyan-400">{sub}<span className="animate-pulse">|</span></span>;
}

// ── Section wrapper ──
function Section({ id, children, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <section
      id={id}
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(60px)',
        transition: 'opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1)',
      }}
      className={className}
    >
      {children}
    </section>
  );
}

// ── Animated child reveal (staggered) ──
function RevealUp({ children, delay = 0 }) {
  const [ref, visible] = useInView(0.1);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(48px)',
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Skill badge ──
function SkillBadge({ skill }) {
  const [hov, setHov] = useState(false);
  return (
    <span onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={`px-3 py-1 rounded-full text-sm border cursor-default transition-all duration-300 font-mono
        ${hov ? 'bg-cyan-400 text-gray-900 border-cyan-400 scale-110 shadow-lg shadow-cyan-400/40' : 'bg-transparent text-cyan-300 border-cyan-700'}`}>
      {skill}
    </span>
  );
}

// ── Project card ──
const PROJECTS = [
  {
    title: 'Sistem Manajemen Stock & Kasir Terintegrasi, UMKM',
    date: 'Oct 2025 – Dec 2025',
    desc: 'Mengembangkan sistem berbasis web untuk mendigitalisasi operasional harian UMKM melalui integrasi manajemen inventaris dan transaksi. Fokus pada efisiensi pengelolaan data barang serta akurasi pencatatan kasir secara real-time.',
    tech: ['Web Development', 'Real-time System', 'Inventory Management'],
    color: 'from-cyan-500 to-blue-600',
    
    link: 'https://umkm-sales.aksivastudio.my.id',
    thumbnail: '/Sistem Manajemen UMKM.jpeg',
    thumbnailAlt: 'Stock & Kasir UMKM preview',
  },
  {
    title: 'Design User Interface Web SecondChoice, Nalar Dev',
    date: 'Oct 2025 – Nov 2025',
    desc: 'SecondChoice adalah platform jual beli barang bekas yang mempertemukan penjual dan pembeli. Memungkinkan pengguna menjelajahi produk, melihat profil, mengecek detail barang dan penjual, serta fitur layanan lengkap.',
    tech: ['UI/UX Design', 'Web Design', 'Marketplace'],
    color: 'from-purple-500 to-pink-600',
    
    link: '#',
    thumbnail: '/Design UI SecondChoice.png',
    thumbnailAlt: 'SecondChoice UI preview',
  },
  {
    title: 'Sistem Manajemen Pupuk Petani',
    date: 'Nov 2025 – Dec 2025',
    desc: 'Sistem manajemen pupuk untuk membantu petani mengelola distribusi, stok, dan penggunaan pupuk secara lebih efisien. Menganalisis kebutuhan pengguna, merancang alur intuitif, dan meningkatkan pengalaman pengguna.',
    tech: ['System Design', 'UI/UX', 'Agricultural Tech'],
    color: 'from-green-500 to-teal-600',
    icon: '🌱',
    link: '#',
    thumbnail: 'https://placehold.co/600x340/0c2e1a/22c55e?text=Pupuk+Petani+System',
    thumbnailAlt: 'Pupuk Petani System preview',
  },
];

function ProjectCard({ proj, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onClick(proj)}
      style={{ transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.3s ease' }}
      className={`relative rounded-2xl border bg-gray-900/90 backdrop-blur overflow-hidden cursor-pointer flex flex-col
        ${hov ? 'border-cyan-500 shadow-2xl shadow-cyan-500/25' : 'border-gray-700'}
      `}
      style={{ transform: hov ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)', transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.3s ease' }}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden h-44 bg-gray-800">
        <img
          src={proj.thumbnail}
          alt={proj.thumbnailAlt}
          className="w-full h-full object-cover"
          style={{ transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)', transform: hov ? 'scale(1.08)' : 'scale(1)' }}
        />
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent transition-opacity duration-300 ${hov ? 'opacity-80' : 'opacity-60'}`} />
        {/* Color top bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${proj.color}`} />
        {/* Icon badge */}
        <div className="absolute top-3 right-3 text-2xl bg-gray-900/70 backdrop-blur rounded-xl px-2 py-1 border border-gray-700">
          {proj.icon}
        </div>
        {/* Hover overlay: "Click to view" */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hov ? 'opacity-100' : 'opacity-0'}`}>
          <span className="bg-cyan-500/90 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg backdrop-blur">
            🔍 View Project
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-white font-bold text-sm leading-snug mb-1">{proj.title}</h3>
        <p className="text-cyan-500 text-xs font-mono mb-3">{proj.date}</p>
        <p className="text-gray-400 text-xs leading-relaxed flex-1 line-clamp-3">{proj.desc}</p>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {proj.tech.map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-cyan-300 border border-gray-700">{t}</span>
          ))}
        </div>
        <div className={`mt-4 flex items-center gap-1.5 text-xs font-semibold font-mono transition-colors duration-200 ${hov ? 'text-cyan-400' : 'text-gray-500'}`}>
          <span>View Project</span>
          <span style={{ transform: hov ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.25s ease', display: 'inline-block' }}>→</span>
        </div>
      </div>
    </div>
  );
}

// ── Modal ──
function Modal({ proj, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  if (!proj) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative bg-gray-900 border border-cyan-800 rounded-2xl max-w-lg w-full shadow-2xl shadow-cyan-500/20 z-10 overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalIn 0.35s cubic-bezier(0.22,1,0.36,1)' }}
      >
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        {/* Thumbnail header */}
        <div className="relative h-48 overflow-hidden">
          <img src={proj.thumbnail} alt={proj.thumbnailAlt} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${proj.color}`} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-900/80 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition flex items-center justify-center text-sm">
            ✕
          </button>
          <div className="absolute bottom-4 left-5 flex items-center gap-3">
            <span className="text-3xl">{proj.icon}</span>
            <div>
              <p className="text-white font-bold text-base leading-tight">{proj.title}</p>
              <p className="text-cyan-400 text-xs font-mono">{proj.date}</p>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="p-6">
          <p className="text-gray-300 text-sm leading-relaxed mb-5">{proj.desc}</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {proj.tech.map(t => <span key={t} className="text-xs px-3 py-1 rounded-full bg-gray-800 text-cyan-300 border border-cyan-900">{t}</span>)}
          </div>
          <div className="flex gap-3">
            <a href={proj.link} target="_blank" rel="noreferrer"
              className="flex-1 text-center py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-cyan-500/20">
               Visit Project
            </a>
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Nav ──
function Nav({ active }) {
  const links = ['home','about','skills','projects','contact'];
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  const handleNav = (e, id) => {
    e.preventDefault();
    smoothScrollTo(id);
  };
  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-gray-950/90 backdrop-blur border-b border-gray-800 shadow-lg' : ''}`}>
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
        <button onClick={(e) => handleNav(e, 'home')} className="font-mono font-bold text-cyan-400 text-lg tracking-widest hover:opacity-80 transition-opacity">
          Fansa<span className="text-white">.</span>
        </button>
        <div className="flex gap-6">
          {links.map(l => (
            <a
              key={l}
              href={`#${l}`}
              onClick={(e) => handleNav(e, l)}
              className={`relative text-sm font-mono capitalize transition-colors hover:text-cyan-400 group ${active === l ? 'text-cyan-400' : 'text-gray-400'}`}
            >
              {l}
              {/* active underline bar */}
              <span
                style={{
                  transform: active === l ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
                  transformOrigin: 'left',
                }}
                className="absolute -bottom-0.5 left-0 right-0 h-px bg-cyan-400 block"
              />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function Portfolio() {
  const [modal, setModal] = useState(null);
  const [active, setActive] = useState('home');

  useEffect(() => {
    const sections = ['home','about','skills','projects','contact'];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { threshold: 0.4 });
    sections.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const SKILLS = ['Software Developer','UI/UX Design','Network Security','Debugging Mindset',
    'Understanding AI Behavior','Consistency','Critical Thinking','Analytical Skills',
    'Independent Working','Prompt Writing','Curiosity','Time Management'];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <ParticleCanvas />
      <Nav active={active} />
      <Modal proj={modal} onClose={() => setModal(null)} />

      {/* ── HERO ── */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center z-10">
        <div className="mb-6 relative">
          <div className="w-32 h-32 rounded-full border-4 border-cyan-400 shadow-xl shadow-cyan-400/30 overflow-hidden mx-auto">
            <img src="/Dhifansa.jpeg" alt="Dhifansa" className="w-full h-full object-cover" />
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-gray-950 animate-pulse" />
        </div>
        <p className="font-mono text-cyan-500 text-sm tracking-widest mb-2 uppercase">Hello, World! </p>
        <h1 className="text-4xl md:text-6xl font-black mb-3 leading-tight">
          <GlitchText text="Dhifansa Pradibtya Rafi'" className="text-white" />
        </h1>
        <p className="text-xl md:text-2xl font-mono mb-6 h-8">
          <TypedText words={['Software Developer','UI/UX Designer','Network Security Enthusiast','AI Explorer']} />
        </p>
        <p className="text-gray-400 max-w-xl mb-8 text-sm leading-relaxed">
          Mahasiswa Sistem Informasi di Universitas Negeri Semarang yang berfokus pada clean code, keamanan sistem, dan pengalaman pengguna yang nyaman.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={() => smoothScrollTo('projects')} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30">
            View Projects
          </button>
          <button onClick={() => smoothScrollTo('contact')} className="px-6 py-3 rounded-xl border border-cyan-600 text-cyan-400 font-semibold hover:bg-cyan-950 transition-colors">
            Contact Me
          </button>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce text-gray-500 text-xs">
          <span>scroll</span>
          <span>↓</span>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <Section id="about" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <p className="font-mono text-cyan-500 text-xs tracking-widest uppercase mb-2">{/* about_me */}</p>
        <h2 className="text-3xl font-bold mb-10">About <span className="text-cyan-400">Me</span></h2>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-gray-300 leading-relaxed mb-4 text-sm">
              Saya <span className="text-cyan-400 font-semibold">Dhifansa Pradibtya Rafi&apos;</span>, seorang Software Developer dengan minat pada network security, UI/interface design, dan ekosistem Linux.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4 text-sm">
              Saya suka membangun aplikasi yang rapi, aman, dan mudah digunakan — mulai dari perancangan, implementasi, hingga optimasi — dengan fokus pada clean code, keamanan sistem, dan pengalaman pengguna yang nyaman.
            </p>
            <p className="text-gray-300 leading-relaxed text-sm">
              Saya terbuka untuk kolaborasi maupun peluang di bidang pengembangan software, security, dan produk digital.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-mono">
              {[['📅 Born','28 April 2006'],['📍 Location','Semarang, Indonesia'],['🎓 Education','Unnes – Info Systems'],['📧 Email','dhifansapradibtya@gmail.com']].map(([k,v]) => (
                <div key={k} className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">{k}</p>
                  <p className="text-white text-xs mt-0.5 truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 font-mono text-sm">
              <div className="flex gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"/>
                <span className="w-3 h-3 rounded-full bg-yellow-500"/>
                <span className="w-3 h-3 rounded-full bg-green-500"/>
              </div>
              <p className="text-gray-500">// developer.json</p>
              <pre className="text-xs leading-6 mt-2 text-gray-300">{`{
  "name": "Dhifansa Pradibtya Rafi'",
  "role": "Software Developer",
  "university": "Unnes",
  "focus": [
    "Clean Code",
    "Network Security",
    "UI/UX Design",
    "AI Exploration"
  ],
  "status": "open_to_work ✅"
}`}</pre>
            </div>
          </div>
        </div>
      </Section>

      {/* ── SKILLS ── */}
      <Section id="skills" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <p className="font-mono text-cyan-500 text-xs tracking-widest uppercase mb-2">{/* areas_of_expertise */}</p>
        <h2 className="text-3xl font-bold mb-10">Skills & <span className="text-cyan-400">Expertise</span></h2>
        <div className="flex flex-wrap gap-3 mb-12">
          {SKILLS.map(s => <SkillBadge key={s} skill={s} />)}
        </div>
       <div className="grid md:grid-cols-3 gap-6">
  {[
    { img: '/Developing.png',      title: 'Development', items: ['Web Applications','System Design','Clean Code','Debugging'] },
    { img: '/Design.png',   title: 'Design',      items: ['UI/UX Design','User Research','Wireframing','Prototyping'] },
    { img: '/cyber.png', title: 'Security',    items: ['Network Security','Linux Ecosystem','System Security','Security Analysis'] },
  ].map(({ img, title, items }) => (
    <div key={title} className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-cyan-700 transition-colors duration-300">
      
      {/* Bingkai foto — ganti rounded-xl jadi rounded-full untuk lingkaran */}
      <div className="w-65 h-35 rounded-xl overflow-hidden mb-3 border border-gray-700 group-hover:border-cyan-500 transition-colors duration-300 bg-gray-800 flex items-center justify-center">
  <img
    src={img}
    alt={title}
    width={112}
    height={80}
    className="w-full h-full object-cover"
  />
</div>

      <h3 className="text-white font-bold mb-3">{title}</h3>
      <ul className="space-y-1">
        {items.map(i => (
          <li key={i} className="text-gray-400 text-sm flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-cyan-400 group-hover:scale-150 transition-transform"/>
            {i}
          </li>
        ))}
      </ul>
    </div>
  ))}
</div>
      </Section>

      {/* ── PROJECTS ── */}
      <Section id="projects" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <p className="font-mono text-cyan-500 text-xs tracking-widest uppercase mb-2">{/* projects */}</p>
        <h2 className="text-3xl font-bold mb-10">My <span className="text-cyan-400">Projects</span></h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PROJECTS.map(p => <ProjectCard key={p.title} proj={p} onClick={setModal} />)}
        </div>
      </Section>

      {/* ── EDUCATION ── */}
      <Section id="education" className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <p className="font-mono text-cyan-500 text-xs tracking-widest uppercase mb-2">{/* education */}</p>
        <h2 className="text-3xl font-bold mb-8">Education</h2>
        <div className="relative border-l-2 border-cyan-800 pl-8">
          <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-cyan-500 border-2 border-gray-950 shadow-lg shadow-cyan-500/50" />
          <p className="text-xs text-cyan-500 font-mono mb-1">Aug 2024 – Present</p>
          <h3 className="text-white font-bold text-lg">Universitas Negeri Semarang</h3>
          <p className="text-gray-400 text-sm mb-3">S1 Sistem Informasi — Semarang, Indonesia</p>
          <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">
            Aktif mempelajari bagaimana merancang, mengembangkan, dan mengevaluasi sistem informasi yang efektif dan user-friendly, serta memahami dasar-dasar keamanan jaringan. Memiliki ketertarikan dalam eksplorasi AI dan sistem berbasis data.
          </p>
        </div>
      </Section>

      {/* ── CONTACT ── */}
      <Section id="contact" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <p className="font-mono text-cyan-500 text-xs tracking-widest uppercase mb-2">{/* contact */}</p>
        <h2 className="text-3xl font-bold mb-4">Get In <span className="text-cyan-400">Touch</span></h2>
        <p className="text-gray-400 text-sm mb-10 max-w-md">Terbuka untuk kolaborasi, kesempatan kerja, atau sekadar ngobrol tentang teknologi!</p>
        <div className="flex flex-wrap gap-4 mb-10">
          {[
            {  label: 'Email', href: 'mailto:dhifansapradibtya@gmail.com', value: 'dhifansapradibtya@gmail.com' },
            {  label: 'Phone', href: 'tel:081225028952', value: '081225028952' },
          ].map(({ icon, label, href, value }) => (
            <a key={label} href={href} className="flex items-center gap-3 px-5 py-3 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-cyan-600 hover:bg-gray-900 transition-all group">
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-white text-sm group-hover:text-cyan-400 transition-colors">{value}</p>
              </div>
            </a>
          ))}
        </div>
        <p className="font-mono text-gray-500 text-xs uppercase tracking-widest mb-4">{/* social_links */}</p>
 <div className="flex flex-wrap gap-4">
  {[
    { img: '/instagram-logo-instagram-icon-transparent-free-png.png', label: 'Instagram', href: 'https://www.instagram.com/dhifansapradibya?igsh=b3M3bW1vNGtvM284&utm_source=qr', size: 28 },
    { img: '/tiktok-logo-tik-tok-logo-icon-png-svg.png',              label: 'TikTok',    href: 'https://www.tiktok.com/@pasobesoo?_r=1&...',                                     size: 18 },
    { img: '/linkedin-logo-transparent-free-png.png',                 label: 'LinkedIn',  href: 'https://www.linkedin.com/in/dhifansa-pradibtya-rafi-a32531322/',                  size: 28 },
    { img: '/symbole-github-violet.png',                              label: 'GitHub',    href: 'https://github.com/dhifansa',                                                     size: 18 },
  ].map(({ img, label, href, size }, index) => (  
    <a key={`${label}-${index}`} href={href} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 px-5 py-2 border border-gray-700 rounded-full text-sm text-gray-300 hover:text-white hover:border-cyan-500 hover:bg-cyan-950/40 transition-all font-mono">
      <img
        src={img}
        alt={label}
        width={size}
        height={size}
        className="object-contain"
      />
      {label}
    </a>
  ))}
</div>

      </Section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 text-center py-8 border-t border-gray-900 text-gray-600 text-xs font-mono">
        <p>Designed & Built by <span className="text-cyan-500">Dhifansa Pradibtya Rafi&apos;</span> · 2026</p>
        <p className="mt-1 text-gray-700">Made with ❤️ + ☕</p>
      </footer>
    </div>
  );
}