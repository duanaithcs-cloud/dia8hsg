
import { Topic, UIPreferences, ArenaStats, AppleTheme, StudyGoal, TagLevel } from '../types';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GeminiService } from '../services/geminiService';

interface PhysicsState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  targetR: number;
  color: string;
  icon: string;
  mastery: number;
  pulse_type?: 'correct' | 'decay' | 'achievement' | 'marble' | 'danger' | null;
  seed: number;
  isDragging: boolean;
  el: HTMLDivElement | null;
}

interface BubbleCanvasProps {
  topics: Topic[];
  preferences: UIPreferences;
  generatingTopicId: number | null;
  celebrationTopicId: number | null;
  arenaStore?: Record<number, ArenaStats>;
  decodedTopicIds?: number[];
  dragonOrbIds?: number[];
  userGoal?: StudyGoal;
  activeLevels?: TagLevel[];
  onBubbleClick: (id: number) => void;
}

const getDeviceEntropySeed = () => {
  let persistentId = localStorage.getItem('DEVICE_ENTROPY_ID');
  if (!persistentId) {
    persistentId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('DEVICE_ENTROPY_ID', persistentId);
  }
  const fingerprint = persistentId + navigator.userAgent + window.screen.width + window.screen.height;
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getGaussianRandom = (seed: number, mean = 1, stdDev = 0.08) => {
  const u1 = seededRandom(seed);
  const u2 = seededRandom(seed + 1);
  const rand = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
  return mean + rand * stdDev;
};

const BubbleCanvas: React.FC<BubbleCanvasProps> = ({ 
  topics, 
  preferences, 
  generatingTopicId, 
  celebrationTopicId, 
  arenaStore = {},
  decodedTopicIds = [],
  dragonOrbIds = [],
  userGoal,
  activeLevels = [TagLevel.NB, TagLevel.TH, TagLevel.VD, TagLevel.VDC],
  onBubbleClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<PhysicsState[]>([]);
  const requestRef = useRef<number>(null);
  const prefRef = useRef<UIPreferences>(preferences);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  
  const [ready, setReady] = useState(false);
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight - 64 });
  const [deviceEntropy] = useState(() => getDeviceEntropySeed());
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiChat, setAiChat] = useState<{ q: string, a: string }[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [orbPos, setOrbPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
  const [isDraggingOrb, setIsDraggingOrb] = useState(false);
  const [isOrbIdle, setIsOrbIdle] = useState(true);
  
  const orbTimerRef = useRef<any>(null);

  useEffect(() => {
    prefRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [aiChat, isAiLoading]);

  useEffect(() => {
    if (showAiAssistant) {
      setTimeout(() => chatInputRef.current?.focus(), 300);
    }
  }, [showAiAssistant]);

  useEffect(() => {
    const handleResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight - 64;
      setDimensions({ w: newW, h: newH });
      setOrbPos(prev => ({
        x: prev.x > newW / 2 ? newW - 70 : 16,
        y: Math.min(Math.max(16, prev.y), newH - 80)
      }));
    };
    window.addEventListener('resize', handleResize);

    const w = dimensions.w;
    const h = dimensions.h;
    const cols = Math.ceil(Math.sqrt(topics.length * (w / h)));
    const rows = Math.ceil(topics.length / cols);
    const cellW = w / cols;
    const cellH = h / rows;

    physicsRef.current = topics.map((t, idx) => {
      const bubbleEntropy = deviceEntropy + t.topic_id;
      const gScale = getGaussianRandom(bubbleEntropy, 1, 0.07);
      const initialR = (window.innerWidth < 640 ? 25 + t.scale * 12 : 35 + t.scale * 20) * (prefRef.current.bubbleScale || 1.0) * gScale;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const jitterX = (seededRandom(bubbleEntropy) - 0.5) * cellW * 0.8;
      const jitterY = (seededRandom(bubbleEntropy + 50) - 0.5) * cellH * 0.8;
      const startX = (col + 0.5) * cellW + jitterX;
      const startY = (row + 0.5) * cellH + jitterY;
      return {
        id: t.topic_id, x: startX, y: startY, vx: (seededRandom(bubbleEntropy + 100) - 0.5) * 4, vy: (seededRandom(bubbleEntropy + 200) - 0.5) * 4,
        r: initialR, targetR: initialR, color: t.color, icon: t.icon, mastery: t.mastery_percent, pulse_type: t.pulse_type,
        seed: (bubbleEntropy % 1000), isDragging: false, el: null
      };
    });
    setReady(true);
    return () => window.removeEventListener('resize', handleResize);
  }, [topics, deviceEntropy, dimensions.w, dimensions.h]);

  useEffect(() => {
    if (!ready) return;
    const update = () => {
      const p = physicsRef.current;
      if (p.length === 0) { requestRef.current = requestAnimationFrame(update); return; }
      const currentPrefs = prefRef.current;
      const intensity = (currentPrefs.intensity / 45) || 1.0;
      const centralGravity = 0.00015 * intensity; 
      const localGravity = 0.0001 * intensity;
      const driftSpeed = (currentPrefs.driftForce / 100) * 0.1 * intensity; 
      const springStrength = (currentPrefs.repulsion / 80) * 0.07;
      const friction = 0.985;
      const w = dimensions.w; const h = dimensions.h;
      const centerX = w / 2; const centerY = h / 2;
      const summonY = h * 0.8; 
      const anchors = p.filter(b => b.r > 80);

      for (let i = 0; i < p.length; i++) {
        const b1 = p[i];
        if (b1.id === generatingTopicId) {
          const targetX = centerX; const targetY = summonY;
          b1.x += (targetX - b1.x) * 0.15; b1.y += (targetY - b1.y) * 0.15;
          b1.vx = 0; b1.vy = 0; const expandedR = b1.targetR * 1.5; b1.r += (expandedR - b1.r) * 0.1;
          continue; 
        }
        const bubbleEntropy = deviceEntropy + b1.id;
        const gScale = getGaussianRandom(bubbleEntropy, 1, 0.07);
        const baseSizeFactor = window.innerWidth < 640 ? 12 : 20;
        const originalBaseR = (window.innerWidth < 640 ? 25 : 35) + (topics.find(t => t.topic_id === b1.id)?.scale || 1.0) * baseSizeFactor;
        b1.targetR = originalBaseR * currentPrefs.bubbleScale * gScale;
        b1.r += (b1.targetR - b1.r) * 0.15;
        if (!b1.isDragging) {
          b1.vx += (centerX - b1.x) * centralGravity; b1.vy += (centerY - b1.y) * centralGravity;
          if (anchors.length > 0 && b1.r < 80) {
            let closestAnchor = anchors[0];
            let minDist = Math.hypot(anchors[0].x - b1.x, anchors[0].y - b1.y);
            for(let a = 1; a < anchors.length; a++) {
              const d = Math.hypot(anchors[a].x - b1.x, anchors[a].y - b1.y);
              if (d < minDist) { minDist = d; closestAnchor = anchors[a]; }
            }
            if (minDist < 400) { b1.vx += (closestAnchor.x - b1.x) * localGravity; b1.vy += (closestAnchor.y - b1.y) * localGravity; }
          }
          if (generatingTopicId) {
            const distToSummon = Math.hypot(centerX - b1.x, summonY - b1.y);
            const pushForce = 3800 / (distToSummon + 140);
            const angle = Math.atan2(b1.y - summonY, b1.x - centerX);
            b1.vx += Math.cos(angle) * pushForce; b1.vy += Math.sin(angle) * pushForce;
          }
          const margin = window.innerWidth < 640 ? 20 : 40;
          if (b1.x - b1.r < margin) b1.vx += (margin - (b1.x - b1.r)) * 0.05;
          else if (b1.x + b1.r > w - margin) b1.vx -= (b1.x + b1.r - (w - margin)) * 0.05;
          if (b1.y - b1.r < margin) b1.vy += (margin - (b1.y - b1.r)) * 0.05;
          else if (b1.y + b1.r > h - margin) b1.vy -= (b1.y + b1.r - (h - margin)) * 0.05;
        }
        for (let j = i + 1; j < p.length; j++) {
          const b2 = p[j]; if (b2.id === generatingTopicId) continue; 
          const dx = b2.x - b1.x; const dy = b2.y - b1.y;
          const distSq = dx * dx + dy * dy;
          const cushionFactor = (b1.r + b2.r > 150) ? 1.05 : 0.95;
          const minDist = (b1.r + b2.r) * (cushionFactor + currentPrefs.repulsion / 250);
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 0.1; const overlap = (minDist - dist);
            const nx = dx / dist; const ny = dy / dist; const force = overlap * springStrength;
            if (!b1.isDragging) { b1.vx -= nx * force; b1.vy -= ny * force; b1.x -= nx * overlap * 0.5; b1.y -= ny * overlap * 0.5; }
            if (!b2.isDragging) { b2.vx += nx * force; b2.vy += ny * force; b2.x += nx * overlap * 0.5; b2.y += ny * overlap * 0.5; }
          }
        }
      }
      p.forEach((b) => {
        if (!b.isDragging && b.id !== generatingTopicId) {
          const time = Date.now() * 0.0008;
          b.vx += (Math.sin(time + b.seed) + Math.sin(time * 0.5 + b.seed * 0.3)) * driftSpeed;
          b.vy += (Math.cos(time * 0.7 + b.seed) + Math.cos(time * 1.2 + b.seed * 0.8)) * driftSpeed;
          b.vx *= friction; b.vy *= friction; b.x += b.vx; b.y += b.vy;
        }
        if (b.el) {
          b.el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`;
          b.el.style.width = `${b.r * 2}px`; b.el.style.height = `${b.r * 2}px`;
        }
      });
      requestRef.current = requestAnimationFrame(update);
    };
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [ready, dimensions, generatingTopicId, deviceEntropy, topics]);

  const handlePointerDown = (id: number, e: React.PointerEvent) => {
    if (generatingTopicId) return; 
    const b = physicsRef.current.find(i => i.id === id);
    if (b) {
      b.isDragging = true;
      const startX = e.clientX; const startY = e.clientY; const initialX = b.x; const initialY = b.y;
      let lastTime = Date.now();
      const onMove = (me: PointerEvent) => {
        const now = Date.now(); const dt = now - lastTime;
        if (dt > 0) { b.vx = (me.clientX - b.x) / dt * 10; b.vy = (me.clientY - b.y) / dt * 10; }
        b.x = initialX + (me.clientX - startX); b.y = initialY + (me.clientY - startY); lastTime = now;
      };
      const onUp = () => {
        b.isDragging = false; window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp); onBubbleClick(id);
      };
      window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    }
  };

  const handleOrbPointerDown = (e: React.PointerEvent) => {
    if (generatingTopicId) return;
    setIsDraggingOrb(true); setIsOrbIdle(false);
    if (orbTimerRef.current) clearTimeout(orbTimerRef.current);
    const startX = e.clientX; const startY = e.clientY; const initialPos = { ...orbPos }; let hasMoved = false;
    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX; const dy = me.clientY - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
      setOrbPos({ x: initialPos.x + dx, y: initialPos.y + dy });
    };
    const onUp = () => {
      setIsDraggingOrb(false); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      if (!hasMoved) setShowAiAssistant(!showAiAssistant);
      setOrbPos(prev => {
        const screenW = window.innerWidth; const screenH = window.innerHeight;
        const targetX = prev.x > screenW / 2 ? screenW - 70 : 16;
        const targetY = Math.min(Math.max(16, prev.y), screenH - (window.innerWidth < 640 ? 120 : 150));
        return { x: targetX, y: targetY };
      });
      orbTimerRef.current = setTimeout(() => setIsOrbIdle(true), 3000);
    };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); });
  };

  const handleSendMessage = async () => {
    const message = currentInput.trim(); if (!message || isAiLoading) return;
    setCurrentInput(""); setIsAiLoading(true);
    setAiChat(prev => [...prev, { q: message, a: "Cố vấn đang phân tích dữ liệu địa lí chuyên sâu..." }]);
    try { 
      const response = await GeminiService.fetchTopicInsights({ keyword_label: message } as any); 
      setAiChat(prev => prev.map(chat => chat.q === message ? { q: message, a: response.summary } : chat)); 
    } catch (e) { 
      setAiChat(prev => prev.map(chat => chat.q === message ? { q: message, a: "Hệ thống AI đang bận. Hãy thử lại sau." } : chat)); 
    } finally { setIsAiLoading(false); }
  };

  const getThemeColor = (baseColor: string, theme: AppleTheme) => {
    switch (theme) { case 'DARK': return '#333'; case 'SUNSET': return '#ff4d4d'; case 'AURORA': return '#00ffcc'; case 'NEON': return baseColor; default: return '#0d33f2'; }
  };

  const getMasteryDisplayColor = (m: number) => { if (m >= 90) return 'text-[#ffbf00]'; if (m >= 30) return 'text-white'; return 'text-[#ff0055] opacity-80'; };

  const renderDragonStars = (topicId: number, isActive: boolean) => {
    const orbIndex = dragonOrbIds.indexOf(topicId);
    if (orbIndex === -1) return null;
    const starCount = orbIndex + 1;
    const starColor = isActive ? '#1e293b' : 'rgba(255,255,255,0.15)';
    const orbitRadius = 25; 
    const angleOffset = (Date.now() / 2000) % (Math.PI * 2);

    return (
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-full">
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent animate-pulse pointer-events-none"></div>
        )}
        {Array.from({ length: starCount }).map((_, i) => {
          const angle = (i * (Math.PI * 2) / starCount) + angleOffset;
          const left = 50 + Math.cos(angle) * orbitRadius;
          const top = 30 + Math.sin(angle) * (orbitRadius * 0.6); 
          return (
            <span 
              key={i} 
              className={`material-symbols-outlined absolute text-[10px] sm:text-[14px] fill-1 transition-all duration-300 ${isActive ? 'animate-star-flicker' : ''}`}
              style={{ 
                left: `${left}%`, top: `${top}%`,
                transform: 'translate(-50%, -50%)',
                color: starColor, opacity: isActive ? 1 : 0.4
              }}
            >
              star
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-background-dark select-none touch-none theme-${preferences.activeTheme.toLowerCase()} ${generatingTopicId ? 'pointer-events-none' : ''}`}
    >
      <div className="dragon-bg-container">
          <div className="dragon-bg-image"></div>
          {/* Cập nhật độ đục tối đa thấp hơn để lộ rồng thần rực rỡ hơn */}
          <div className={`dragon-bg-overlay transition-opacity duration-1000 ${generatingTopicId ? 'opacity-90 blur-sm' : ''}`} style={{ opacity: generatingTopicId ? 0.95 : (0.6 - (preferences.glowIntensity / 250)) }}></div>
      </div>

      {generatingTopicId && (
        <div 
          className="fixed left-1/2 -translate-x-1/2 z-[3500] pointer-events-none flex flex-col items-center justify-center"
          style={{ top: '80%' }}
        >
           <div className="relative">
              <div className="w-[3.3px] h-[3.3px] bg-white rounded-full shadow-[0_0_15px_5px_#00f5ff] animate-pearl-forge relative z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 bg-c1-cyan/10 rounded-full blur-2xl animate-pulse"></div>
           </div>
        </div>
      )}

      {preferences.showRoadmap && ready && (
        <svg className={`absolute inset-0 pointer-events-none z-[1] w-full h-full overflow-visible transition-opacity duration-500 ${generatingTopicId ? 'opacity-0' : 'opacity-100'}`}>
          <defs>
            <filter id="roadmap-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          {physicsRef.current.sort((a, b) => a.id - b.id).map((b, idx, arr) => {
            if (idx === 0) return null;
            const prev = arr[idx - 1];
            const isCompleted = (decodedTopicIds || []).includes(b.id) && (decodedTopicIds || []).includes(prev.id);
            const lineColor = isCompleted ? '#00ff88' : 'rgba(13,51,242,0.3)';
            return (
              <g key={`roadmap-segment-${b.id}`}>
                 <line x1={prev.x} y1={prev.y} x2={b.x} y2={b.y} stroke={lineColor} strokeWidth={isCompleted ? "3" : "1"} strokeDasharray={isCompleted ? "none" : "5,10"} filter={isCompleted ? "url(#roadmap-glow)" : "none"} className={isCompleted ? "animate-pulse" : "animate-roadmap-flow"} style={{ opacity: isCompleted ? 0.8 : 0.4 }} />
              </g>
            );
          })}
        </svg>
      )}

      <div 
        className={`fixed z-[5200] pointer-events-auto transition-opacity duration-500 ${generatingTopicId ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
        style={{ left: orbPos.x, top: orbPos.y, transition: isDraggingOrb ? 'none' : 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
         {showAiAssistant && (
            <div className={`absolute bottom-16 sm:bottom-20 right-0 w-[500px] max-w-[95vw] h-[80vh] sm:h-[700px] max-h-[85vh] bg-[#0b0e11]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-pop-in ${orbPos.x < window.innerWidth / 2 ? 'left-0' : 'right-0'}`}>
               <header className="p-4 sm:p-5 bg-primary/10 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">school</span>
                     <div className="flex flex-col">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white leading-none">Cố vấn HSG Địa lí</span>
                        <span className="text-[7px] sm:text-[8px] font-bold text-gray-500 uppercase italic tracking-tighter mt-1">Geographic Insights</span>
                     </div>
                  </div>
                  <button onClick={() => setShowAiAssistant(false)} className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all shrink-0">
                    <span className="material-symbols-outlined text-lg text-gray-500">close</span>
                  </button>
               </header>
               <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 no-scrollbar scroll-smooth">
                  {aiChat.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-10">
                        <span className="material-symbols-outlined text-5xl sm:text-7xl mb-4 sm:mb-6 text-primary animate-pulse">explore</span>
                        <h4 className="text-[12px] sm:text-[14px] font-black uppercase tracking-[0.2em] text-white mb-3 italic">GIẢI MÃ ĐỊA LÍ 8?</h4>
                        <p className="text-[9px] sm:text-[11px] font-bold text-gray-400 leading-loose uppercase tracking-widest">
                           Chào học viên! Tôi là Cố vấn AI Đội tuyển. Bạn thắc mắc gì về <b>Tự nhiên & Biển đảo VN</b> không? Hãy đặt câu hỏi ngay!
                        </p>
                     </div>
                  )}
                  {aiChat.map((chat, i) => (
                     <div key={i} className="space-y-3 animate-fade-in">
                        <div className="flex flex-col items-start gap-1 max-w-[90%] sm:max-w-[85%]">
                          <span className="text-[8px] font-black uppercase text-primary tracking-widest px-2 opacity-60">Bạn hỏi</span>
                          <div className="px-4 py-3 bg-primary/20 rounded-2xl rounded-tl-none text-[12px] sm:text-[13px] font-bold text-white border border-primary/20 shadow-lg leading-relaxed">{chat.q}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 relative">
                          <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest px-2 text-right opacity-60">AI Cố vấn</span>
                          <div className="w-full p-4 sm:p-6 bg-white/[0.03] rounded-2xl sm:rounded-3xl rounded-tr-none text-[12px] sm:text-[13px] leading-relaxed text-gray-200 border border-white/5 shadow-inner relative group/bubble">
                            <div className="whitespace-pre-wrap font-medium">{chat.a}</div>
                            <button onClick={() => handleCopyText(chat.a, i)} className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg border transition-all flex items-center gap-1.5 sm:opacity-0 group-hover/bubble:opacity-100 bg-black/40 border-white/10 text-gray-500 hover:text-white`}>
                              <span className="material-symbols-outlined text-[14px]">{copiedIndex === i ? 'check' : 'content_copy'}</span>
                              <span className="text-[8px] font-black uppercase tracking-tighter">{copiedIndex === i ? 'Xong' : 'Chép'}</span>
                            </button>
                          </div>
                        </div>
                     </div>
                  ))}
                  {isAiLoading && <div className="flex justify-center py-4"><div className="flex gap-2 items-center"><div className="size-1.5 rounded-full bg-primary animate-bounce"></div><div className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div><div className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div></div></div>}
               </div>
               <div className="p-4 sm:p-5 bg-white/[0.02] border-t border-white/5 flex gap-2 sm:gap-3 backdrop-blur-md">
                  <div className="flex-1 bg-black/50 rounded-2xl sm:rounded-3xl border border-white/10 px-4 sm:px-6 flex items-center focus-within:border-primary/50 shadow-inner">
                    <input ref={chatInputRef} type="text" value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Hỏi AI Địa lí tại đây..." className="flex-1 bg-transparent border-none text-[13px] sm:text-[14px] focus:ring-0 text-white placeholder:text-gray-600 font-bold py-3 sm:py-4.5" />
                  </div>
                  <button onClick={handleSendMessage} disabled={!currentInput.trim() || isAiLoading} className={`size-10 sm:size-12 rounded-full flex items-center justify-center transition-all shrink-0 ${!currentInput.trim() || isAiLoading ? 'bg-white/5 text-gray-700' : 'bg-primary text-black shadow-[0_8px_25px_rgba(13,51,242,0.4)] hover:scale-105 active:scale-95'}`}><span className="material-symbols-outlined text-xl sm:text-2xl">send</span></button>
               </div>
            </div>
         )}
         <button onPointerDown={handleOrbPointerDown} className={`size-12 sm:size-16 rounded-full backdrop-blur-[20px] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-white/20 flex items-center justify-center transition-all relative overflow-hidden group/orb active:scale-90 ${isOrbIdle && !isDraggingOrb && !showAiAssistant ? 'opacity-30' : 'opacity-100 shadow-[0_0_30px_rgba(13,51,242,0.3)]'} ${isDraggingOrb ? 'cursor-grabbing' : 'cursor-grab'}`} style={{ backgroundColor: isOrbIdle && !isDraggingOrb && !showAiAssistant ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
            <span className="material-symbols-outlined text-2xl sm:text-3xl text-white drop-shadow-md">{showAiAssistant ? 'close' : 'psychology'}</span>
            {!showAiAssistant && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-10 sm:size-12 bg-primary/20 rounded-full blur-xl animate-pulse"></div>}
         </button>
      </div>

      {topics.map((topic) => {
        const b = physicsRef.current.find(p => p.id === topic.topic_id);
        const stats = arenaStore[topic.topic_id];
        const starsCount = stats?.star_level || 0;
        const isGenerating = topic.topic_id === generatingTopicId;
        const isDecoded = (decodedTopicIds || []).includes(topic.topic_id);
        const isFiltered = !activeLevels.includes(topic.tag_level);
        const isAmber = isDecoded && starsCount >= 1 && !isGenerating;
        const isMarble = isDecoded && starsCount === 0 && !isGenerating;
        const isDanger = topic.deadline && new Date(topic.deadline).getTime() < (Date.now() + 86400000 * 2) && topic.mastery_percent < 90;
        const currentR = b ? b.r : (window.innerWidth < 640 ? 25 : 35);
        const themeColor = getThemeColor(topic.color, preferences.activeTheme);
        const skinClass = preferences.showTranslucentCore ? 'translucent-core-skin' : 'crypto-bubble-skin';
        const zIndexBase = isGenerating ? 3000 : (currentR > 80 ? 500 : (currentR > 40 ? 100 : 10));

        return (
          <div
            key={topic.topic_id} ref={(el) => { if (b) b.el = el; }}
            onPointerDown={(e) => !isFiltered && handlePointerDown(topic.topic_id, e)}
            className={`bubble-container will-change-transform cursor-pointer group ${isDanger && !isGenerating ? 'animate-danger-pulse' : ''} ${(generatingTopicId && !isGenerating) || (isFiltered && !isGenerating) ? 'opacity-10 grayscale pointer-events-none scale-75 blur-xl transition-all duration-1000' : 'opacity-100'}`}
            style={{ width: currentR * 2, height: currentR * 2, ['--neon-color' as any]: themeColor, ['--core-color' as any]: themeColor, zIndex: zIndexBase, left: 0, top: 0, transform: b ? `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)` : 'translate3d(-500px, -500px, 0)', position: 'absolute' }}
          >
            <div className={`w-full h-full rounded-full overflow-hidden ${isGenerating ? 'opacity-20 blur-md border-none shadow-none' : (isAmber ? 'amber-orb-skin' : (isMarble ? 'marble-stone-skin' : skinClass))} ${preferences.showBreathing && !isGenerating && !isFiltered ? 'animate-breathing-dynamic' : ''}`}
                 style={{ filter: (isMarble || isGenerating) ? 'none' : `brightness(${preferences.glowIntensity / 55}) saturate(${preferences.saturation / 65})`, ['--breath-scale' as any]: 1 + (preferences.breathAmp / 200), boxShadow: isGenerating ? 'none' : `0 ${currentR/15}px ${currentR/2}px -${currentR/30}px rgba(0,0,0,0.6), 0 0 ${currentR/4}px -2px var(--neon-color)`, border: isGenerating ? 'none' : (isDanger ? '2px solid #ff0055' : undefined) }}>
              <div className="glass-sheen"></div>
              {(isAmber || isMarble) && renderDragonStars(topic.topic_id, isAmber)}
              <div className="flex flex-col items-center justify-between p-1.5 sm:p-2 text-center relative z-10 transition-transform group-hover:scale-110 duration-500 w-full h-[88%]">
                <span className={`material-symbols-outlined transition-all duration-500 ${isMarble ? 'text-black/50' : 'text-white'} ${isGenerating ? 'opacity-0' : ''}`} style={{ fontSize: currentR * 0.6 }}>
                  {isGenerating ? '' : (isDanger ? 'warning' : topic.icon)}
                </span>
                {!isGenerating && (
                   <>
                    <div className="flex-1 flex items-center justify-center w-full px-1 overflow-hidden">
                      <span className="font-black uppercase tracking-tight leading-none text-halo text-center block text-white drop-shadow-lg line-clamp-1" style={{ fontSize: (preferences.fontSize * 1.0) * (currentR / (window.innerWidth < 640 ? 35 : 58)) }}>{topic.keyword_label}</span>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <span className={`font-grotesk font-black tabular-nums tracking-tighter leading-none text-halo drop-shadow-md ${getMasteryDisplayColor(topic.mastery_percent)}`} style={{ fontSize: (preferences.fontSize * 1.2) * (currentR / (window.innerWidth < 640 ? 35 : 58)) }}>{topic.mastery_percent}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes pearl-forge {
          0%, 100% { transform: scale(1); filter: brightness(1); opacity: 0.7; }
          50% { transform: scale(2.2); filter: brightness(2.5); opacity: 1; }
        }
        .animate-pearl-forge { animation: pearl-forge 0.3s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }
        @keyframes breathing-dynamic { 0%, 100% { transform: scale(1); } 50% { transform: scale(var(--breath-scale, 1.05)); } }
        .animate-breathing-dynamic { animation: breathing-dynamic 3s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
export default BubbleCanvas;
