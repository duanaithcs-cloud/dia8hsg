
import React from 'react';
import { Topic } from '../types';

interface HeatmapProps {
  topics: Topic[];
  onTopicClick: (id: number) => void;
}

/**
 * Heatmap Matrix v2.5 - Công nghệ trực quan hóa mật độ tri thức
 * Tự động ánh xạ dữ liệu mastery_percent vào thang nhiệt màu sắc
 */
const Heatmap: React.FC<HeatmapProps> = ({ topics, onTopicClick }) => {
  // Nhóm các chủ đề theo chương (group_title) để dễ quan sát
  const groupedTopics = topics.reduce((acc, t) => {
    if (!acc[t.group_title]) acc[t.group_title] = [];
    acc[t.group_title].push(t);
    return acc;
  }, {} as Record<string, Topic[]>);

  const getHeatStyles = (m: number) => {
    // Thang màu 5 cấp độ: Xám (0) -> Đỏ (Lethal) -> Vàng (Amber) -> Indigo (Classic) -> Xanh lá (Elite)
    if (m === 0) return { bg: 'bg-white/5', border: 'border-white/5', text: 'text-gray-600', glow: '', color: '#333' };
    if (m <= 30) return { bg: 'bg-danger-glow/10', border: 'border-danger-glow/30', text: 'text-danger-glow', glow: 'shadow-[0_0_15px_rgba(255,0,85,0.2)]', color: '#ff0055' };
    if (m <= 60) return { bg: 'bg-c3-amber/10', border: 'border-c3-amber/30', text: 'text-c3-amber', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]', color: '#f59e0b' };
    if (m <= 85) return { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', glow: 'shadow-[0_0_15px_rgba(13,51,242,0.2)]', color: '#0d33f2' };
    return { bg: 'bg-c4-green/10', border: 'border-c4-green/30', text: 'text-c4-green', glow: 'shadow-[0_0_20px_rgba(0,255,136,0.3)]', color: '#00ff88' };
  };

  return (
    <div className="h-full overflow-y-auto px-10 py-12 no-scrollbar bg-[#05070a] relative">
      <div className="dragon-bg-container opacity-10 pointer-events-none"><div className="dragon-bg-image"></div></div>
      
      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg border border-primary/30 italic">Cognitive Dashboard</span>
            </div>
            <h3 className="text-4xl font-black uppercase italic text-white tracking-tighter">Knowledge Heat Matrix</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.4em] mt-3">Phân tích mật độ thấu hiểu của học sinh trên 33 chuyên đề</p>
          </div>
          
          <div className="flex items-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-3">
                <div className="size-4 rounded-md bg-white/10"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase">0%</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="size-4 rounded-md bg-danger-glow/40 border border-danger-glow/60"></div>
                <span className="text-[10px] font-black text-danger-glow uppercase">Yếu (&lt;30%)</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="size-4 rounded-md bg-c3-amber/40 border border-c3-amber/60"></div>
                <span className="text-[10px] font-black text-c3-amber uppercase">Cơ bản</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="size-4 rounded-md bg-c4-green/40 border border-c4-green/60"></div>
                <span className="text-[10px] font-black text-c4-green uppercase">Thành thạo</span>
             </div>
          </div>
        </header>

        {Object.entries(groupedTopics).map(([group, list]) => (
          <div key={group} className="space-y-6">
            <div className="flex items-center gap-6">
               <h4 className="text-[11px] font-black text-white/30 uppercase tracking-[0.6em] whitespace-nowrap">{group}</h4>
               <div className="h-px w-full bg-white/5"></div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Fix: Explicitly cast list to Topic[] to resolve 'Property map does not exist on type unknown' when using Object.entries in some environments */}
              {(list as Topic[]).map(t => {
                const styles = getHeatStyles(t.mastery_percent);
                const hasLedger = t.knowledge_ledger && t.knowledge_ledger.length > 0;
                
                return (
                  <div 
                    key={t.topic_id} 
                    onClick={() => onTopicClick(t.topic_id)}
                    className={`relative p-5 rounded-3xl border transition-all duration-700 cursor-pointer group flex flex-col justify-between h-40 overflow-hidden
                      ${styles.bg} ${styles.border} ${styles.glow} hover:scale-105 hover:z-20 hover:border-white/40 hover:bg-white/[0.08]
                    `}
                  >
                    {/* Visual Progress Sub-layer */}
                    <div 
                      className="absolute bottom-0 left-0 w-full transition-all duration-1000 origin-bottom pointer-events-none" 
                      style={{ height: `${t.mastery_percent}%`, backgroundColor: styles.color, opacity: 0.08 }}
                    ></div>

                    <div className="flex justify-between items-start relative z-10">
                      <span className={`text-[11px] font-black tabular-nums ${styles.text} opacity-50 group-hover:opacity-100`}>#{t.topic_id.toString().padStart(2, '0')}</span>
                      {hasLedger && (
                        <span className="material-symbols-outlined text-[14px] text-primary animate-pulse">verified_user</span>
                      )}
                    </div>

                    <div className="relative z-10">
                      <h5 className="text-[13px] font-black text-white group-hover:text-primary transition-colors leading-tight line-clamp-2 uppercase tracking-tighter">
                        {t.keyword_label}
                      </h5>
                    </div>

                    <div className="flex items-end justify-between relative z-10">
                      <div className="flex flex-col">
                        <span className={`text-2xl font-black italic tracking-tighter tabular-nums ${styles.text}`}>
                          {t.mastery_percent}%
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-white/5 group-hover:text-white/30 transition-all duration-500 text-3xl">
                        {t.icon}
                      </span>
                    </div>

                    {/* Hover Tooltip (Detailed View) */}
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-400 flex flex-col items-center justify-center p-6 text-center z-30 translate-y-4 group-hover:translate-y-0">
                       <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-3">COGNITIVE STATUS</span>
                       <div className="text-4xl font-black mb-3 text-white tracking-tighter">{t.mastery_percent}%</div>
                       
                       <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/5">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${t.mastery_percent}%`, backgroundColor: styles.color }}></div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 w-full">
                          <div className="flex flex-col gap-1">
                             <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Lượt học</span>
                             <span className="text-xs font-black text-white">{t.attempts_count}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Tăng trưởng</span>
                             <span className={`text-xs font-black ${t.delta >= 0 ? 'text-c4-green' : 'text-danger-glow'}`}>{t.delta >= 0 ? '▲' : '▼'}{Math.abs(t.delta)}%</span>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="h-40"></div>
    </div>
  );
};

export default Heatmap;
