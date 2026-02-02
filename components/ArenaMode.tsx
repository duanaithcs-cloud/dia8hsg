
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Topic, UserProfile, ArenaStats, RankLevel } from '../types';

interface ArenaModeProps {
  topics: Topic[];
  userProfile: UserProfile;
  arenaStore?: Record<number, ArenaStats>;
  decodedTopicIds: number[];
  onStartMatch: (topicId: number) => void;
  onDevUpdateLP?: (lp: number) => void;
  onDevUpdateStars?: (topicId: number, stars: number) => void;
  onSimulateResult?: (topicId: number, accuracy: number) => void;
  onDevSetMastery?: (topicId: number, mastery: number) => void;
}

const CompetencyBar: React.FC<{ label: string, score: number, color: string }> = ({ label, score, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center px-1">
      <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{label}</span>
      <span className="text-[10px] font-black italic" style={{ color }}>{score}%</span>
    </div>
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
    </div>
  </div>
);

const ArenaMode: React.FC<ArenaModeProps> = ({ topics, userProfile, arenaStore = {}, decodedTopicIds = [], onStartMatch, onDevUpdateLP, onDevUpdateStars, onSimulateResult, onDevSetMastery }) => {
  const [phase, setPhase] = useState<'LOBBY' | 'BAN_PICK'>('LOBBY');
  const [selectedTopicId, setSelectedTopicId] = useState<number>(topics[0]?.topic_id || 1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [countdown, setCountdown] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const GOLD = "#c89b3c";
  const BLUE_HEXTECH = "#00c8c8";
  const DARK_BG = "#010a13";

  const selectedTopic = useMemo(() => 
    topics.find(t => t.topic_id === selectedTopicId) || topics[0], 
  [selectedTopicId, topics]);

  const aiOpponent = useMemo(() => {
    const names = ["GEO-BOT-X9", "NEXUS-ALPHA", "TERRA-UNIT-01", "CORE-DRIVE-Z", "ATLAS-AI"];
    const seed = selectedTopicId % names.length;
    const mastery = selectedTopic.mastery_percent;
    
    let threat = { label: "VULNERABLE", color: "#00ff88", desc: "Dễ hạ gục" };
    if (mastery < 30) threat = { label: "LETHAL", color: "#ff0055", desc: "Nguy hiểm tột độ" };
    else if (mastery < 60) threat = { label: "NIGHTMARE", color: "#f59e0b", desc: "Ác mộng" };
    else if (mastery < 85) threat = { label: "CHALLENGING", color: "#3b82f6", desc: "Thử thách" };

    return {
      name: names[seed],
      threat,
      power: Math.min(100, Math.max(20, 100 - mastery + (selectedTopicId % 20))),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${names[seed]}&backgroundColor=transparent`
    };
  }, [selectedTopicId, selectedTopic.mastery_percent]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleStartSequence = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => onStartMatch(selectedTopicId), 800);
      return () => clearTimeout(timer);
    }
  }, [countdown, onStartMatch, selectedTopicId]);

  const pokemonEvo = useMemo(() => {
    const rank = userProfile.rank;
    if (rank === RankLevel.DONG || rank === RankLevel.BAC) {
      return { id: 447, name: "Riolu", stage: "MẦM NON", aura: "rgba(0, 245, 255, 0.25)", effect: "", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/447.png" };
    } else if (rank === RankLevel.VANG || rank === RankLevel.BACH_KIM) {
      return { id: 448, name: "Lucario", stage: "TRƯỞNG THÀNH", aura: "rgba(200, 155, 60, 0.4)", effect: "animate-breathing", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" };
    } else if (rank === RankLevel.KIM_CUONG || rank === RankLevel.CAO_THU) {
      return { id: 448, name: "Lucario", stage: "CHIẾN BINH", aura: "rgba(99, 102, 241, 0.5)", effect: "animate-lightning", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" };
    } else {
      return { id: 10059, name: "Mega Lucario", stage: "HUYỀN THOẠI", aura: "rgba(255, 0, 85, 0.6)", effect: "animate-lightning", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10059.png" };
    }
  }, [userProfile.rank]);

  const countdownMessages = ["ĐANG ĐỒNG BỘ MA TRẬN...", "KÍCH HOẠT HỆ THỐNG...", "MỤC TIÊU XÁC ĐỊNH!"];

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`h-full relative flex flex-col items-center justify-center bg-[${DARK_BG}] overflow-hidden select-none pb-24 sm:pb-0`}
    >
      {countdown !== null && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl transition-all duration-500">
          <div className="relative p-6 text-center">
             <div className="absolute inset-0 blur-[60px] sm:blur-[100px] bg-primary/20 animate-pulse"></div>
             {countdown > 0 ? (
               <div className="text-center space-y-4 sm:space-y-8 animate-ignition-pop">
                 <div className="text-7xl sm:text-9xl font-black italic text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                    {countdown}
                 </div>
                 <p className="text-sm sm:text-xl font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-primary animate-glitch-text">
                    {countdownMessages[3 - countdown]}
                 </p>
               </div>
             ) : (
               <div className="text-center animate-fight-burst">
                 <h2 className="text-7xl sm:text-[12rem] font-black italic uppercase text-danger-glow drop-shadow-[0_0_80px_#ff0055]">FIGHT!</h2>
               </div>
             )}
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(200,155,60,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(200,155,60,0.05)_1px,transparent_1px)] bg-[size:30px_30px] sm:bg-[size:50px_50px] transition-transform duration-700 ease-out"
          style={{ transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 25}px) scale(1.1)` }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] sm:size-[800px] blur-[100px] sm:blur-[200px] opacity-20 pointer-events-none rounded-full transition-all duration-1000"
          style={{ backgroundColor: pokemonEvo.aura }}
        ></div>
      </div>

      {phase === 'LOBBY' ? (
        <div className="max-w-xl w-full text-center space-y-6 sm:space-y-10 animate-slide-up relative z-10 p-6">
           <div className="relative group">
              <div 
                className={`absolute inset-0 blur-[40px] sm:blur-[80px] rounded-full animate-pulse transition-all duration-1000 ${userProfile.rank === RankLevel.THACH_DAU ? 'rank-challenger-aura' : ''}`} 
                style={{ backgroundColor: pokemonEvo.aura, transform: `translate(${mousePos.x * 45}px, ${mousePos.y * 45}px) scale(1.4)` }}
              ></div>
              <div className="relative z-10 transition-transform duration-300 ease-out flex flex-col items-center" style={{ transform: `perspective(1000px) rotateY(${mousePos.x * 12}deg) rotateX(${mousePos.y * -12}deg)` }}>
                <div className="relative">
                   <img src={pokemonEvo.url} className={`size-48 sm:size-64 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] ${pokemonEvo.effect}`} alt={pokemonEvo.name} />
                </div>
                <div className={`mt-4 px-5 py-1.5 bg-[${GOLD}] text-black text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] rounded-full shadow-[0_0_20px_rgba(200,155,60,0.8)] border-b-2 border-black/20 shrink-0`}>
                  {pokemonEvo.name} • {pokemonEvo.stage}
                </div>
              </div>
           </div>
           
           <div className="space-y-2 sm:space-y-4">
              <h2 className={`text-4xl sm:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)]`}>Sảnh <span style={{ color: GOLD }}>Thi Đấu</span></h2>
              <p className={`font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-[8px] sm:text-[10px] animate-pulse`} style={{ color: GOLD }}>Season 1: Kỷ Nguyên Số</p>
           </div>

           <div className="grid grid-cols-2 gap-4 sm:gap-6 px-2 sm:px-6">
              <div className="glass-panel p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border-white/5 bg-white/5 backdrop-blur-2xl relative overflow-hidden group hover:scale-105 transition-transform flex flex-col items-center">
                 <p className="text-[8px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 italic">Xếp Hạng</p>
                 <h4 className={`text-xl sm:text-3xl font-black uppercase tracking-tight text-center`} style={{ color: GOLD }}>{userProfile.rank}</h4>
              </div>
              <div className="glass-panel p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border-white/5 bg-white/5 backdrop-blur-2xl relative overflow-hidden group hover:scale-105 transition-transform flex flex-col items-center">
                 <p className="text-[8px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 italic">Arena Win</p>
                 <h4 className="text-xl sm:text-3xl font-black text-cyan-400 uppercase tracking-tight">{userProfile.streak} 🔥</h4>
              </div>
           </div>

           <div className="px-2 sm:px-6 pt-2">
              <button onClick={() => setPhase('BAN_PICK')} className={`group relative w-full h-16 sm:h-20 text-white font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] rounded-full shadow-[0_15px_45px_rgba(200,155,60,0.3)] hover:scale-[1.03] active:scale-95 transition-all text-base sm:text-lg border-b-4 border-black/50 overflow-hidden shrink-0`} style={{ backgroundColor: GOLD }}>
                BẮT ĐẦU
              </button>
           </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col lg:flex-row relative z-10 overflow-hidden animate-fade-in">
           <div className="w-full lg:w-[450px] shrink-0 border-b lg:border-r border-white/5 bg-black/60 backdrop-blur-3xl p-6 sm:p-8 flex flex-col overflow-y-auto no-scrollbar max-h-[40vh] lg:max-h-full">
              <div className="flex-1 space-y-6 sm:space-y-8 animate-fade-in-left">
                  <div className="bg-danger-glow/5 border border-danger-glow/20 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 relative overflow-hidden group">
                      <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                          <div className="size-14 sm:size-20 rounded-xl sm:rounded-2xl bg-black/60 border border-danger-glow/30 flex items-center justify-center p-2 shrink-0">
                             <img src={aiOpponent.avatar} className="size-full object-contain animate-pulse" alt="AI Bot" />
                          </div>
                          <div className="overflow-hidden">
                             <span className="text-[8px] sm:text-[10px] font-black uppercase text-danger-glow tracking-widest block mb-1">AI OPPONENT</span>
                             <h4 className="text-base sm:text-xl font-black text-white italic truncate">{aiOpponent.name}</h4>
                          </div>
                      </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 relative overflow-hidden group">
                      <div className="flex items-center gap-4 sm:gap-5">
                          <div className="size-14 sm:size-20 rounded-xl sm:rounded-2xl bg-black/60 border border-primary/30 flex items-center justify-center p-2 shrink-0">
                             <img src={pokemonEvo.url} className={`size-full object-contain ${pokemonEvo.effect}`} alt="User Hero" />
                          </div>
                          <div className="overflow-hidden">
                             <span className="text-[8px] sm:text-[10px] font-black uppercase text-primary tracking-widest block mb-1">CHALLENGER</span>
                             <h4 className="text-base sm:text-xl font-black text-white italic truncate">{userProfile.fullName || 'Học viên'}</h4>
                          </div>
                      </div>
                  </div>

                  <div className="text-center p-4 sm:p-6 bg-white/5 rounded-[24px] sm:rounded-[32px] border border-white/5">
                      <span className="text-[8px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 sm:mb-3 block">Target Topic</span>
                      <h2 className="text-lg sm:text-2xl font-black italic uppercase text-white leading-tight mb-2 truncate">{selectedTopic.keyword_label}</h2>
                  </div>
              </div>

              <div className="pt-6 sm:pt-8 shrink-0">
                  <button 
                    onClick={handleStartSequence}
                    className={`w-full h-14 sm:h-18 text-black font-black uppercase tracking-[0.2em] sm:tracking-[0.35em] rounded-full shadow-[0_12px_45px_rgba(200,155,60,0.3)] hover:brightness-110 active:scale-95 transition-all border-b-4 border-black/40 flex items-center justify-center gap-3 sm:gap-4 text-sm sm:text-base shrink-0`}
                    style={{ backgroundColor: GOLD }}
                  >
                    <span className="material-symbols-outlined text-xl sm:text-2xl">swords</span>
                    TRẬN ĐẤU
                  </button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-14 no-scrollbar bg-black/30 pb-32">
              <div className="mb-6 sm:mb-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black italic uppercase text-white tracking-widest leading-none">CHIẾN TRƯỜNG</h3>
                    <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] mt-2">Matrix 33 Chuyên đề Địa Lí 8</p>
                  </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-6">
                  {topics.map(t => {
                    const isDecoded = decodedTopicIds.includes(t.topic_id);
                    const stars = isDecoded ? (arenaStore[t.topic_id]?.star_level || 0) : 0;
                    const isActive = selectedTopicId === t.topic_id;

                    return (
                      <button 
                        key={t.topic_id}
                        onClick={() => setSelectedTopicId(t.topic_id)}
                        className={`aspect-square relative rounded-2xl sm:rounded-[2rem] border-2 transition-all group p-2 sm:p-4 flex flex-col items-center justify-between overflow-hidden ${isActive ? 'bg-gradient-to-br from-[#c89b3c]/30 to-black scale-105 shadow-xl' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                        style={{ borderColor: isActive ? GOLD : 'rgba(255,255,255,0.05)' }}
                      >
                         <div className="flex gap-0.5 sm:gap-1 relative z-10 w-full justify-center">
                            {[1,2,3,4,5,6,7].map(idx => (
                              <div key={idx} className={`size-0.5 sm:size-1 rounded-full ${idx <= stars ? 'bg-[#c89b3c]' : 'bg-white/10'}`}></div>
                            ))}
                         </div>

                         <span className={`material-symbols-outlined text-2xl sm:text-3xl transition-all duration-300 relative z-10 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} style={{ color: isActive ? '#fff' : t.color }}>
                           {t.icon}
                         </span>

                         <div className="relative z-10 w-full">
                            <span className={`block text-[7px] sm:text-[9px] font-black uppercase text-center line-clamp-1 tracking-tighter ${isActive ? 'text-white' : 'text-gray-500'}`}>
                              {t.keyword_label}
                            </span>
                         </div>
                      </button>
                    );
                  })}
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes ignition-pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-ignition-pop { animation: ignition-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        @keyframes fight-burst { 0% { transform: scale(0.1); opacity: 0; filter: blur(20px); } 50% { transform: scale(1.2); opacity: 1; filter: blur(0); } 100% { transform: scale(1); opacity: 1; } }
        .animate-fight-burst { animation: fight-burst 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes glitch-text { 0%, 100% { transform: translate(0); } 33% { transform: translate(-1px, 1px); } 66% { transform: translate(1px, -1px); } }
        .animate-glitch-text { animation: glitch-text 0.1s infinite; }
      `}</style>
    </div>
  );
};

export default ArenaMode;
