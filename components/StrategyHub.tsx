
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Topic, UserProfile } from '../types';
import { GeminiService } from '../services/geminiService';

interface StrategyHubProps {
  topics: Topic[];
  userProfile: UserProfile;
  onJumpToTopic: (id: number) => void;
}

const StrategyHub: React.FC<StrategyHubProps> = ({ topics, userProfile, onJumpToTopic }) => {
  const [analysis, setAnalysis] = useState<{ summary: string; connections: string[]; roadmap: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'MASTERED'>('ALL');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const notesList = useMemo(() => {
    return topics.filter(t => t.notes && t.notes.trim().length > 0)
      .sort((a, b) => b.mastery_percent - a.mastery_percent);
  }, [topics]);

  const filteredNotes = useMemo(() => {
    if (activeFilter === 'ALL') return notesList;
    if (activeFilter === 'CRITICAL') return notesList.filter(t => t.mastery_percent < 50);
    if (activeFilter === 'MASTERED') return notesList.filter(t => t.mastery_percent >= 85);
    return notesList;
  }, [notesList, activeFilter]);

  const handleGenerateStrategy = async () => {
    setIsLoading(true);
    try {
      const res = await GeminiService.analyzeGlobalStrategy(topics);
      setAnalysis(res);
    } catch (e) {
      alert("Hệ thống CCTV AI đang gặp sự cố đường truyền. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const CCTVOverlay = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-20">
       <div className="absolute top-0 left-0 right-0 h-px bg-primary/40 animate-scanline-cctv"></div>
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
       <div className="w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 2px)' }}></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background-dark text-white font-grotesk overflow-hidden relative">
      <div className="dragon-bg-container opacity-5 pointer-events-none"><div className="dragon-bg-image"></div></div>
      
      {/* CCTV TOP BAR INFO */}
      <div className="h-8 bg-black/80 flex items-center justify-between px-4 sm:px-10 border-b border-white/5 relative z-50 shrink-0">
         <div className="flex gap-4 sm:gap-10 items-center overflow-hidden">
            <span className="text-[7px] sm:text-[9px] font-black text-primary uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center gap-1.5 shrink-0">
               <div className="size-1 bg-danger-glow rounded-full animate-pulse"></div>
               REC
            </span>
            <span className="text-[7px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest truncate hidden sm:inline">CAM: NEON_EYE_v20</span>
            <span className="text-[7px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest truncate">NODE: {userProfile.school ? userProfile.school.substring(0, 10) : "ALPHA"}</span>
         </div>
         <div className="flex gap-4 items-center shrink-0">
            <span className="text-[7px] sm:text-[9px] font-black text-primary tabular-nums tracking-[0.1em]">{currentTime.toLocaleTimeString('en-GB')}</span>
         </div>
      </div>

      {/* COMMAND HEADER */}
      <header className="px-4 sm:px-10 py-4 sm:py-6 border-b border-white/10 bg-black/60 backdrop-blur-3xl flex flex-col lg:flex-row lg:items-center justify-between shrink-0 z-40 relative gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
           <div className="size-10 sm:size-14 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(0,245,255,0.2)] shrink-0">
              <span className="material-symbols-outlined text-2xl sm:text-3xl">videocam</span>
           </div>
           <div>
              <h2 className="text-lg sm:text-2xl font-black uppercase italic tracking-tighter text-white leading-none">CENTRAL NOTES PRO</h2>
              <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 italic line-clamp-1">Điều hành Ghi chú & Lộ trình Tác chiến AI</p>
           </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 w-full lg:w-auto">
           <div className="flex bg-white/5 rounded-xl sm:rounded-2xl p-1 border border-white/10 shadow-inner flex-1 lg:flex-none">
              {['ALL', 'CRITICAL', 'MASTERED'].map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f as any)} 
                  className={`flex-1 lg:flex-none px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-primary text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  {f === 'ALL' ? 'Tất cả' : (f === 'CRITICAL' ? 'Hổng' : 'OK')}
                </button>
              ))}
           </div>
           <button 
             onClick={handleGenerateStrategy}
             disabled={isLoading}
             className="h-10 sm:h-14 px-4 sm:px-10 bg-primary text-black font-black uppercase text-[8px] sm:text-[10px] tracking-widest rounded-xl sm:rounded-3xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 sm:gap-3 border-b-2 sm:border-b-4 border-black/40 shrink-0"
           >
              <span className={`material-symbols-outlined text-base sm:text-xl ${isLoading ? 'animate-spin' : ''}`}>{isLoading ? 'sync' : 'security'}</span>
              <span className="hidden sm:inline">{isLoading ? 'ĐANG QUÉT...' : 'RE-SCAN KNOWLEDGE'}</span>
              <span className="sm:hidden">{isLoading ? 'QUÉT...' : 'SCAN'}</span>
           </button>
        </div>
      </header>

      {/* CCTV MATRIX FEED */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 flex flex-col lg:flex-row gap-6 z-20 pb-24 sm:pb-32">
        
        {/* LEFT PANE: CCTV FEEDS GRID */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4 sm:gap-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.3em] sm:tracking-[0.4em] flex items-center gap-2">
                 <span className="material-symbols-outlined text-xs sm:text-sm">grid_view</span>
                 Cognitive Monitoring
              </h3>
              <div className="flex items-center gap-4">
                 <span className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest">{filteredNotes.length} CHANNELS</span>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {filteredNotes.length === 0 ? (
                <div className="col-span-full py-12 sm:py-20 border-2 border-dashed border-white/5 rounded-3xl sm:rounded-[48px] flex flex-col items-center justify-center opacity-20 text-center p-8 grayscale">
                   <span className="material-symbols-outlined text-6xl sm:text-9xl mb-4 sm:mb-8">videocam_off</span>
                   <h4 className="text-sm sm:text-xl font-black uppercase tracking-widest">No Active Feeds</h4>
                   <p className="text-[9px] sm:text-xs uppercase tracking-[0.2em] mt-4">Hãy thêm ghi chú tại Bubble Canvas</p>
                </div>
              ) : (
                filteredNotes.map(t => (
                  <div 
                    key={t.topic_id} 
                    onClick={() => onJumpToTopic(t.topic_id)}
                    className="aspect-video bg-black/60 border border-white/10 rounded-2xl sm:rounded-3xl relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all shadow-2xl"
                  >
                     <CCTVOverlay />
                     
                     <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex flex-col">
                           <span className="text-[7px] sm:text-[9px] font-black text-white/80 tabular-nums tracking-widest">CH_{t.topic_id.toString().padStart(2, '0')}</span>
                           <h5 className="text-[9px] sm:text-[11px] font-black text-primary uppercase italic tracking-tighter truncate max-w-[120px] sm:max-w-[150px]">{t.keyword_label}</h5>
                        </div>
                        <div className={`px-1.5 py-0.5 rounded text-[6px] sm:text-[8px] font-black uppercase border ${t.mastery_percent < 50 ? 'bg-danger-glow/20 border-danger-glow text-danger-glow' : 'bg-primary/20 border-primary text-primary'}`}>
                           {t.mastery_percent < 50 ? 'CRITICAL' : 'STABLE'}
                        </div>
                     </div>

                     <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8 pt-12 sm:pt-16">
                        <div className="w-full h-full bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 relative">
                           <p className="text-[11px] sm:text-[13px] text-gray-200 font-bold leading-relaxed font-mono italic line-clamp-4">
                              {t.notes && t.notes.length > 150 ? t.notes.substring(0, 150) + "..." : t.notes}
                           </p>
                        </div>
                     </div>

                     <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 flex justify-between items-end z-20 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex flex-col">
                           <span className="text-[6px] sm:text-[7px] font-black text-gray-500 uppercase tracking-widest">Mastery</span>
                           <div className="flex items-center gap-2">
                              <div className="w-16 sm:w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-primary" style={{ width: `${t.mastery_percent}%` }}></div>
                              </div>
                              <span className="text-[8px] sm:text-[10px] font-black tabular-nums text-white">{t.mastery_percent}%</span>
                           </div>
                        </div>
                        <span className="material-symbols-outlined text-white/10 text-2xl sm:text-4xl">{t.icon}</span>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* RIGHT PANE: AI STRATEGIC COMMAND */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 sm:gap-6 animate-slide-up lg:animate-slide-in-right">
           <div className="px-2">
              <h3 className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-2">
                 <span className="material-symbols-outlined text-xs sm:text-sm">psychology_alt</span>
                 AI Command Analysis
              </h3>
           </div>

           {!analysis ? (
             <div className="flex-1 min-h-[300px] bg-[#0a0f16] border border-white/10 rounded-3xl sm:rounded-[48px] flex flex-col items-center justify-center text-center p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 blur-[100px] pointer-events-none"></div>
                <div className="size-16 sm:size-24 rounded-2xl sm:rounded-[32px] bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6 sm:mb-8 animate-pulse shadow-xl shadow-primary/20">
                   <span className="material-symbols-outlined text-4xl sm:text-5xl">radar</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">Awaiting Data Stream</h2>
                <p className="max-w-[250px] text-[9px] sm:text-[11px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest">
                   Khởi động quét AI để nhận định toàn bộ chuyên đề.
                </p>
             </div>
           ) : (
             <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                
                <div className="flex-1 bg-[#0a0f16] border border-white/10 rounded-3xl sm:rounded-[48px] p-6 sm:p-8 flex flex-col gap-6 sm:gap-8 shadow-2xl relative">
                   <div>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                         <h4 className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.3em] sm:tracking-[0.4em]">AI Verdict Console</h4>
                         <span className="text-[7px] sm:text-[9px] font-black text-c4-green uppercase tracking-widest px-1.5 py-0.5 bg-c4-green/10 rounded">Validated</span>
                      </div>
                      <p className="text-sm sm:text-lg font-bold text-gray-100 leading-relaxed sm:leading-loose italic relative z-10">"{analysis.summary}"</p>
                   </div>
                   
                   <div className="h-px bg-white/10"></div>

                   <div className="space-y-4 sm:space-y-6 relative z-10">
                      <h4 className="text-[8px] sm:text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] sm:tracking-[0.4em]">Neural Linkages Detection</h4>
                      <div className="space-y-3 sm:space-y-4">
                         {analysis.connections.map((c, i) => (
                           <div key={i} className="p-4 sm:p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl sm:rounded-3xl flex items-start gap-3 sm:gap-4 hover:bg-amber-500/10 transition-all">
                              <span className="material-symbols-outlined text-amber-500 text-lg sm:text-xl shrink-0">account_tree</span>
                              <p className="text-[11px] sm:text-[12px] text-amber-100/90 font-bold leading-relaxed">{c}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="h-auto sm:h-80 bg-primary/5 border border-primary/20 rounded-3xl sm:rounded-[48px] p-6 sm:p-8 flex flex-col gap-4 sm:gap-5 shadow-2xl relative overflow-hidden shrink-0">
                   <h4 className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[0.3em] sm:tracking-[0.4em] flex items-center gap-2 sm:gap-3">
                      <div className="size-1.5 sm:size-2 bg-primary rounded-full animate-pulse"></div>
                      Tactical Directives
                   </h4>
                   <div className="space-y-3 sm:space-y-4 relative z-10">
                      {analysis.roadmap.map((step, i) => (
                        <div key={i} className="flex gap-4 sm:gap-5">
                           <span className="text-[10px] sm:text-[12px] font-black text-primary italic tabular-nums opacity-60">0{i + 1}</span>
                           <p className="flex-1 text-[10px] sm:text-[11px] text-gray-300 font-bold leading-relaxed pb-3 border-b border-white/5 last:border-0">
                              {step}
                           </p>
                        </div>
                      ))}
                   </div>
                </div>

             </div>
           )}
        </div>

      </main>

      <footer className="hidden sm:flex p-4 bg-black/90 border-t border-white/10 items-center justify-between px-10 z-50 shrink-0">
          <div className="flex items-center gap-4">
             <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">SYS: 100%</span>
          </div>
          <p className="text-[10px] font-black uppercase text-gray-700 tracking-[0.6em] flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">security</span> 
              COMMAND CONSOLE v2.0
          </p>
      </footer>
      
      <style>{`
        @keyframes scanline-cctv {
          0% { top: -10%; opacity: 0; }
          50% { opacity: 0.8; }
          100% { top: 110%; opacity: 0; }
        }
        .animate-scanline-cctv { animation: scanline-cctv 8s linear infinite; }
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-in-right { animation: slideInRight 0.16, 1, 0.3, 1 forwards; }
        @keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default StrategyHub;
