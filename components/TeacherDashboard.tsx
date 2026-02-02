
import React, { useState, useRef, useMemo } from 'react';
import { Topic, BaseStudent, BaseProgress, RankLevel, KnowledgeRecord, GeoSkill, TagLevel, StudyGoal } from '../types';
import { GeminiService } from '../services/geminiService';

interface TeacherDashboardProps {
  topics: Topic[];
  baseStudents?: BaseStudent[];
  baseProgress?: BaseProgress[];
  onAddStudent?: (student: BaseStudent) => void;
  onUpdateProgress?: (newProgress: BaseProgress[]) => void;
  onDeleteStudent?: (id: string) => void;
  onClose?: () => void;
}

const fromSafeBase64 = (s: string) => {
  try {
    return decodeURIComponent(atob(s).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
  } catch (e) { return ""; }
};

const SKILL_KEYWORDS: Record<string, string[]> = {
  [GeoSkill.MAP]: ['BẢN ĐỒ', 'MAP', 'ATLAT', 'KHOẢNG CÁCH', 'VỊ TRÍ'],
  [GeoSkill.LOGIC]: ['MỐI QUAN HỆ', 'LOGIC', 'QUAN HỆ', 'NHÂN QUẢ', 'GIẢI THÍCH', 'TẠI SAO'],
  [GeoSkill.DATA]: ['KIẾN THỨC NỀN', 'DATA', 'DỮ LIỆU', 'SỐ LIỆU', 'BẢNG SỐ', 'MẬT ĐỘ', 'TỈ LỆ'],
  [GeoSkill.CHART]: ['BIỂU ĐỒ', 'CHART', 'VẼ', 'NHẬN XÉT', 'CỘT', 'ĐƯỜNG', 'TRÒN']
};

interface NeuralRadarProps {
  scores: Record<string, number>;
  potentialScores?: Record<string, number>;
  labels: string[];
  color: string;
  title: string;
  onNodeClick?: (label: string) => void;
  activeNode?: string | null;
}

const NeuralRadar: React.FC<NeuralRadarProps> = ({ scores, potentialScores, labels, color, title, onNodeClick, activeNode }) => {
  // Mở rộng quy mô Radar lên 320px để tạo khoảng cách an toàn giữa các đỉnh
  const size = 320;
  const center = size / 2;
  // Đẩy Radius lên 0.85 để các đỉnh tách xa nhau, sát biên giới SVG
  const radius = center * 0.85;
  
  const getPoints = (data: Record<string, number>) => {
    return labels.map((label, i) => {
      const angle = (i * 2 * Math.PI) / labels.length - Math.PI / 2;
      const val = Math.max(15, data[label] || 0) / 100;
      return {
        x: center + radius * val * Math.cos(angle),
        y: center + radius * val * Math.sin(angle),
        label
      };
    });
  };

  const currentPoints = getPoints(scores);
  const potentialPoints = potentialScores ? getPoints(potentialScores) : null;
  const polygonPath = currentPoints.map(p => `${p.x},${p.y}`).join(' ');
  const ghostPath = potentialPoints ? potentialPoints.map(p => `${p.x},${p.y}`).join(' ') : "";

  return (
    <div className="flex flex-col items-center group relative">
      <div className="absolute -inset-8 bg-gradient-to-b from-white/[0.02] to-transparent rounded-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
      
      <svg width={size} height={size} className="overflow-visible drop-shadow-[0_0_30px_rgba(0,0,0,0.6)]">
        <defs>
          <filter id="hologramGlow"><feGaussianBlur stdDeviation="4" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id={`grad-${title}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </radialGradient>
        </defs>

        {/* Lưới tọa độ kĩ thuật số */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((s, i) => (
          <path 
            key={i} 
            d={labels.map((_, idx) => {
              const angle = (idx * 2 * Math.PI) / labels.length - Math.PI / 2;
              return `${idx === 0 ? 'M' : 'L'} ${center + radius * s * Math.cos(angle)},${center + radius * s * Math.sin(angle)}`;
            }).join(' ') + ' Z'}
            fill="none" stroke="white" strokeOpacity={i === 4 ? "0.15" : "0.05"} strokeWidth={i === 4 ? "2" : "1"}
          />
        ))}

        {/* Trục kết nối từ tâm */}
        {labels.map((_, i) => {
          const angle = (i * 2 * Math.PI) / labels.length - Math.PI / 2;
          return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} stroke="white" strokeOpacity="0.05" strokeWidth="1" />;
        })}

        {/* Ghost Potential Layer */}
        {ghostPath && (
          <polygon points={ghostPath} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="6,6" />
        )}

        {/* Current Kinetic Layer */}
        <polygon 
          points={polygonPath} 
          fill={`url(#grad-${title})`} 
          stroke={color} 
          strokeWidth="3.5" 
          filter="url(#hologramGlow)" 
          className="animate-pulse-slow transition-all duration-1000" 
        />

        {/* Interactive High-Precision Nodes & Labels */}
        {currentPoints.map((p, i) => {
          const labelAngle = (i * 2 * Math.PI) / labels.length - Math.PI / 2;
          const labelX = center + (radius + 25) * Math.cos(labelAngle);
          const labelY = center + (radius + 20) * Math.sin(labelAngle);
          const isActive = activeNode === p.label;

          return (
            <g key={i} className="cursor-pointer group/node" onClick={() => onNodeClick?.(p.label)}>
              {/* Invisible Hitbox: Mở rộng diện tích click lên 40px để tránh click trượt */}
              <circle cx={p.x} cy={p.y} r="25" fill="transparent" />
              <circle cx={labelX} cy={labelY} r="35" fill="transparent" />

              {/* Node Visual */}
              <circle 
                cx={p.x} cy={p.y} r={isActive ? "10" : "7"} 
                fill={isActive ? color : "#05070a"} 
                stroke={color} strokeWidth="3.5"
                className="transition-all duration-500 shadow-2xl"
              />
              
              {isActive && (
                <>
                  <circle cx={p.x} cy={p.y} r="22" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="1.5" className="animate-ping" />
                  <circle cx={p.x} cy={p.y} r="15" fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1" />
                </>
              )}

              {/* Label: Biến nhãn thành nút bấm trực tiếp */}
              <text 
                x={labelX} 
                y={labelY} 
                textAnchor="middle" 
                fill={isActive ? color : "white"} 
                fillOpacity={isActive ? "1" : "0.4"} 
                fontSize={isActive ? "14" : "11"} 
                fontWeight="900" 
                className="uppercase italic tracking-[0.2em] pointer-events-none transition-all duration-300 group-hover/node:fill-opacity-100"
              >
                {p.label}
              </text>
              
              {/* Hover highlight for label */}
              {isActive && (
                <rect 
                  x={labelX - 25} y={labelY - 14} width="50" height="20" 
                  fill={color} fillOpacity="0.1" rx="6" 
                  className="pointer-events-none"
                />
              )}
            </g>
          );
        })}
      </svg>
      
      <div className="mt-8 text-center">
        <h5 className="text-[11px] font-black uppercase tracking-[0.45em] mb-1.5" style={{ color }}>{title}</h5>
        <div className="h-0.5 w-16 bg-white/10 mx-auto rounded-full overflow-hidden">
          <div className="h-full bg-current animate-loading-bar" style={{ backgroundColor: color }}></div>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ topics, baseStudents = [], baseProgress = [], onAddStudent, onUpdateProgress, onDeleteStudent, onClose }) => {
  const [viewMode, setViewMode] = useState<'MULTIVERSE' | 'DEEP_SCAN'>('MULTIVERSE');
  const [selectedStudent, setSelectedStudent] = useState<BaseStudent | null>(null);
  const [activeDrillNode, setActiveDrillNode] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<KnowledgeRecord | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [neuralVerdict, setNeuralVerdict] = useState<{ foundation: string, context: string, trap: string, formula: string } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleNodeClick = (label: string) => {
    setActiveDrillNode(prev => prev === label ? null : label);
  };

  const handleAudit = async (record: KnowledgeRecord) => {
    setSelectedRecord(record);
    if (record.aiAdvisory) {
      setNeuralVerdict(record.aiAdvisory);
      return;
    }
    setIsAuditing(true);
    setNeuralVerdict(null);
    try {
      const res = await GeminiService.auditStudentSynapse(record, "Teacher Legacy Audit");
      const parts = res.split(/\n\s*\n/).map(p => p.replace(/\[.*?\]:?\s*/, '').trim());
      setNeuralVerdict({
        foundation: parts[0] || "Đang truy xuất...",
        context: parts[1] || "Đang phân tích...",
        trap: parts[2] || "Đang xác định...",
        formula: parts[3] || "A+B->C"
      });
    } catch (e) { alert("AI Council Busy!"); }
    finally { setIsAuditing(false); }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      let dnaToken = lines.find(l => l.includes("DNA_TOKEN"))?.split(',')[1]?.trim() || "";
      dnaToken = dnaToken.replace(/^"|"$/g, '');
      if (dnaToken.includes("GEOAI-NEON-DNA-V17::")) {
        try {
          const rawPayload = dnaToken.split("::")[1];
          const decodedData = JSON.parse(fromSafeBase64(rawPayload)) as Topic[];
          const sName = lines.find(l => l.includes("STUDENT_NAME"))?.split(',')[1]?.replace(/^"|"$/g, '') || "NEW_NODE";
          const newId = `NODE-${Date.now().toString().slice(-4)}`;
          const sObj: BaseStudent = { id: newId, name: sName, className: "Alpha Cluster", school: "Neural Link", avatar: "", rank: RankLevel.DONG, rankPoints: 0, status: 'Đang ôn', joinDate: new Date().toLocaleDateString(), goal: StudyGoal.CHAMPION };
          onAddStudent?.(sObj);
          const prog: BaseProgress[] = decodedData.map(t => ({
            taskId: `T-${newId}-${t.topic_id}`, 
            studentId: newId, 
            topicId: t.topic_id, 
            status: 'Hoàn thành', 
            mastery: t.mastery_percent, 
            scores: t.competency_scores, 
            attachmentUrl: "", 
            updatedAt: new Date().toLocaleDateString(), 
            teacherNote: "DNA Synced", 
            knowledgeLedger: t.knowledge_ledger || [] 
          }));
          onUpdateProgress?.([...(baseProgress || []), ...prog]);
          setSelectedStudent(sObj);
          setViewMode('DEEP_SCAN');
        } catch (e) { alert("DNA hư hại!"); }
      }
    };
    reader.readAsText(file);
  };

  const filteredLedger = useMemo(() => {
    if (!selectedStudent || !baseProgress) return [];
    const studentProg = baseProgress.filter(p => p.studentId === selectedStudent.id);
    let allRecords: KnowledgeRecord[] = [];
    studentProg.forEach(p => {
      if (p.knowledgeLedger) allRecords = [...allRecords, ...p.knowledgeLedger];
    });

    if (!activeDrillNode) return allRecords;

    if (Object.values(TagLevel).includes(activeDrillNode as TagLevel)) {
      return allRecords.filter(r => {
        if (r.cognitiveLevel === activeDrillNode) return true;
        const tId = r.qid.split('-')[1];
        const topic = topics.find(t => t.topic_id.toString() === tId || t.knowledge_ledger?.some(lr => lr.qid === r.qid));
        return topic?.tag_level === activeDrillNode;
      });
    }

    if (SKILL_KEYWORDS[activeDrillNode]) {
      const keywords = SKILL_KEYWORDS[activeDrillNode];
      return allRecords.filter(r => {
        if (r.skillGroup === activeDrillNode) return true;
        const text = (r.prompt + " " + r.aiExplanation).toUpperCase();
        return keywords.some(k => text.includes(k));
      });
    }

    return allRecords;
  }, [selectedStudent, activeDrillNode, baseProgress, topics]);

  const studentMetrics = useMemo(() => {
    if (!selectedStudent || !baseProgress) return null;
    const studentProg = baseProgress.filter(p => p.studentId === selectedStudent.id);
    const count = studentProg.length || 1;
    const scores = { NB: 0, TH: 0, VD: 0, VDC: 0 };
    studentProg.forEach(p => {
      scores.NB += p.scores.NB; scores.TH += p.scores.TH; scores.VD += p.scores.VD; scores.VDC += p.scores.VDC;
    });
    const skills = { [GeoSkill.MAP]: 70, [GeoSkill.LOGIC]: 55, [GeoSkill.DATA]: 40, [GeoSkill.CHART]: 65 }; 
    return { cog: { NB: scores.NB/count, TH: scores.TH/count, VD: scores.VD/count, VDC: scores.VDC/count }, skills };
  }, [selectedStudent, baseProgress]);

  const galaxyStudents = useMemo(() => {
    const list = [...baseStudents];
    if (list.length < 14) {
      for (let i = list.length; i < 14; i++) {
        list.push({ id: `GHOST-${i}`, name: `Node ${i + 1}`, className: "Alpha Cluster", school: "Neural Link", avatar: "", rank: RankLevel.DONG, rankPoints: 0, status: 'Đang ôn', joinDate: "", goal: StudyGoal.CHAMPION });
      }
    }
    return list;
  }, [baseStudents]);

  return (
    <div className="h-full flex flex-col bg-background-dark font-display relative overflow-hidden pb-16 sm:pb-0">
      <div className="matrix-scanline" style={{ '--scan-color': '#00f5ff' } as any}></div>

      <header className="px-4 sm:px-10 py-4 sm:py-6 border-b border-white/5 bg-black/80 backdrop-blur-3xl flex flex-col sm:flex-row justify-between items-center z-50 gap-4 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="size-10 sm:size-14 rounded-xl sm:rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_30px_#00f5ff] shrink-0">
            <span className="material-symbols-outlined text-2xl sm:text-3xl animate-pulse">radar</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white tracking-tighter leading-none">Neural Geo-Command</h2>
            <p className="text-[7px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-[0.5em] mt-1 italic">Hệ thống giám sát tri thức HSG v4.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button onClick={() => { setViewMode('MULTIVERSE'); setSelectedStudent(null); setActiveDrillNode(null); }} className={`flex-1 sm:flex-none h-10 sm:h-12 px-6 sm:px-10 rounded-xl sm:rounded-3xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'MULTIVERSE' ? 'bg-primary text-black' : 'text-gray-500 bg-white/5'}`}>Galaxy View</button>
          <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          <button onClick={() => csvInputRef.current?.click()} className="flex-1 sm:flex-none h-10 sm:h-12 px-6 sm:px-10 bg-white/5 border border-white/10 text-primary rounded-xl sm:rounded-3xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all">Decrypt DNA</button>
          <button onClick={onClose} className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-danger-glow transition-all shrink-0"><span className="material-symbols-outlined text-gray-500">close</span></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-10 z-10 relative pb-24 sm:pb-32">
        {viewMode === 'MULTIVERSE' ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-6 sm:gap-12 items-center justify-center py-10 sm:py-20 animate-fade-in">
            {galaxyStudents.map((s, idx) => {
              const isGhost = s.id.startsWith('GHOST');
              const studentProg = baseProgress?.filter(p => p.studentId === s.id) || [];
              const mastery = studentProg.length > 0 ? studentProg.reduce((a, c) => a + c.mastery, 0) / topics.length : 0;
              const intensity = isGhost ? 0.05 : 0.2 + (mastery / 100) * 0.8;
              return (
                <button key={s.id} onClick={() => !isGhost && (setSelectedStudent(s), setViewMode('DEEP_SCAN'))} className={`relative flex flex-col items-center group transition-all duration-700 ${isGhost ? 'cursor-default' : 'hover:scale-125'}`}>
                   <div className="relative">
                      <div className={`absolute inset-0 blur-[20px] sm:blur-[40px] rounded-full transition-all duration-1000 ${mastery > 85 ? 'bg-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)]' : 'bg-primary shadow-[0_0_50px_rgba(0,245,255,0.5)]'}`} style={{ opacity: intensity }}></div>
                      <img src={isGhost ? `https://api.dicebear.com/7.x/bottts/svg?seed=GHOST-${idx}&backgroundColor=transparent` : `https://api.dicebear.com/7.x/bottts/svg?seed=${s.name}&backgroundColor=transparent`} className={`size-16 sm:size-24 rounded-3xl sm:rounded-[40px] bg-black/60 border-2 relative z-10 transition-all ${isGhost ? 'border-white/5 opacity-10' : 'border-white/20 group-hover:border-primary shadow-2xl'}`} />
                      {!isGhost && mastery > 90 && <span className="absolute -top-2 -right-2 material-symbols-outlined text-amber-500 fill-1 text-xl z-20 animate-bounce">workspace_premium</span>}
                   </div>
                   <span className={`mt-4 text-[9px] font-black uppercase tracking-widest truncate max-w-full px-1 ${isGhost ? 'text-gray-800' : 'text-gray-400 group-hover:text-primary'}`}>{s.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          selectedStudent && studentMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 animate-fade-in">
              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-black/80 p-8 sm:p-12 rounded-[56px] border border-white/10 flex flex-col items-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/5 to-transparent"></div>
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedStudent.name}&backgroundColor=transparent`} className="size-24 sm:size-40 rounded-[48px] border-4 border-primary/20 bg-black/40 relative z-10 shadow-2xl group-hover:scale-110 transition-transform duration-700 mb-8" />
                    <h3 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter text-center leading-none mb-2">{selectedStudent.name}</h3>
                    <div className="flex items-center gap-3">
                       <div className="size-2 bg-c4-green rounded-full animate-ping"></div>
                       <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] italic">Biometric Sync: ACTIVE</span>
                    </div>
                    <div className="w-full h-px bg-white/5 my-10"></div>
                    
                    <div className="flex flex-col gap-16 w-full items-center">
                       <NeuralRadar 
                        title="Cognitive Matrix" color="#00f5ff" labels={["NB", "TH", "VD", "VDC"]} 
                        scores={studentMetrics.cog} potentialScores={{ NB: 100, TH: 95, VD: 90, VDC: 85 }}
                        activeNode={activeDrillNode} onNodeClick={handleNodeClick}
                       />
                       <NeuralRadar 
                        title="Specialized GeoSkills" color="#00ff88" labels={[GeoSkill.MAP, GeoSkill.LOGIC, GeoSkill.DATA, GeoSkill.CHART]} 
                        scores={studentMetrics.skills} potentialScores={{ [GeoSkill.MAP]: 95, [GeoSkill.LOGIC]: 95, [GeoSkill.DATA]: 95, [GeoSkill.CHART]: 95 }}
                        activeNode={activeDrillNode} onNodeClick={handleNodeClick}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full mt-12">
                       <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                          <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest block mb-1">Latency</span>
                          <span className="text-lg font-black text-primary italic">2.4s</span>
                       </div>
                       <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                          <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest block mb-1">Volatility</span>
                          <span className="text-lg font-black text-amber-500 italic">LOW</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                 <div className="bg-[#0a0f16]/80 backdrop-blur-3xl border border-white/10 p-8 sm:p-12 rounded-[56px] shadow-2xl relative overflow-hidden">
                    <header className="mb-8"><h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] italic">Node Connectivity Map</h4></header>
                    <div className="grid grid-cols-6 sm:grid-cols-11 gap-3 sm:gap-5">
                       {topics.map(t => {
                         const p = baseProgress?.find(pg => pg.studentId === selectedStudent.id && pg.topicId === t.topic_id);
                         const mastered = (p?.mastery || 0) >= 85;
                         const practiced = (p?.mastery || 0) > 0;
                         return (
                           <div key={t.topic_id} className={`size-10 sm:size-14 rounded-2xl flex items-center justify-center transition-all duration-700 relative group/node
                             ${mastered ? 'bg-c4-green border border-white/30 shadow-[0_0_20px_rgba(0,255,136,0.3)]' : practiced ? 'bg-primary/20 border border-primary/40' : 'bg-white/5 opacity-10 grayscale scale-90'}`}>
                              <span className={`material-symbols-outlined text-xl sm:text-2xl ${mastered ? 'text-black' : practiced ? 'text-primary' : 'text-gray-800'}`}>{t.icon}</span>
                              {practiced && <div className="absolute -bottom-2 -right-2 size-6 sm:size-8 bg-black border border-white/10 rounded-xl text-[7px] sm:text-[9px] font-black flex items-center justify-center text-white shadow-xl z-20">{p?.mastery}%</div>}
                           </div>
                         );
                       })}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-6">
                       <h4 className="text-[12px] font-black uppercase text-white tracking-[0.4em] italic flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary animate-pulse">biotech</span> 
                          Forensic Link: {activeDrillNode || 'Quan sát toàn diện'}
                       </h4>
                       <div className="flex items-center gap-4">
                          {activeDrillNode && (
                             <button onClick={() => setActiveDrillNode(null)} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-gray-500 uppercase hover:text-white transition-all">Clear Filter</button>
                          )}
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{filteredLedger.length} Records</span>
                       </div>
                    </div>

                    {filteredLedger.length === 0 ? (
                      <div className="p-16 border-2 border-dashed border-white/5 rounded-[56px] flex flex-col items-center justify-center opacity-30 text-center">
                         <span className="material-symbols-outlined text-7xl mb-6 text-gray-700">query_stats</span>
                         <p className="text-[10px] font-black uppercase tracking-widest italic text-gray-600">
                           Hệ thống chưa phát hiện bằng chứng tri thức cho Node: {activeDrillNode}.
                         </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {filteredLedger.map((rec, i) => (
                           <div key={i} className={`p-8 sm:p-10 rounded-[48px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:scale-[1.01]
                             ${rec.isCorrect ? 'bg-c4-green/5 border-c4-green/20' : 'bg-danger-glow/5 border-danger-glow/20'}`}>
                              <div className="flex items-center gap-6 sm:gap-8 flex-1">
                                 <div className={`size-12 sm:size-16 rounded-[24px] flex items-center justify-center text-lg sm:text-xl font-black shrink-0 shadow-lg ${rec.isCorrect ? 'bg-c4-green text-black' : 'bg-danger-glow text-white'}`}>{rec.isCorrect ? 'OK' : 'ERR'}</div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                       <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Evidence Code: {rec.qid}</span>
                                       {rec.cognitiveLevel && (
                                         <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${rec.cognitiveLevel === TagLevel.VDC ? 'bg-danger-glow/20 text-danger-glow border border-danger-glow/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                                            LVL: {rec.cognitiveLevel}
                                         </span>
                                       )}
                                    </div>
                                    <p className="text-[14px] sm:text-lg font-bold text-gray-100 leading-relaxed italic">"{rec.prompt}"</p>
                                 </div>
                              </div>
                              <button onClick={() => handleAudit(rec)} className={`h-12 sm:h-14 px-8 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 shadow-xl ${rec.isCorrect ? 'bg-c4-green/10 text-c4-green border border-c4-green/30 hover:bg-c4-green hover:text-black' : 'bg-danger-glow/10 text-danger-glow border border-danger-glow/30 hover:bg-danger-glow hover:text-white'}`}>
                                 {rec.aiAdvisory ? 'Open Advisory' : 'Decode Synapse'}
                              </button>
                           </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )
        )}
      </main>

      {selectedRecord && (isAuditing || neuralVerdict) && (
        <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4 sm:p-10 bg-black/98 backdrop-blur-3xl animate-fade-in">
           <div className="relative w-full max-w-6xl h-[90vh] bg-[#0a0f16] border-2 border-white/10 rounded-[64px] shadow-[0_0_120px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
              <header className="p-8 sm:p-12 border-b border-white/5 flex justify-between items-center bg-black/40 shrink-0">
                 <div className="flex items-center gap-5">
                    <span className="material-symbols-outlined text-primary text-4xl sm:text-5xl">psychology</span>
                    <div><h3 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Neural Deep Scan</h3></div>
                 </div>
                 <button onClick={() => { setSelectedRecord(null); setNeuralVerdict(null); }} className="size-14 sm:size-16 rounded-3xl bg-white/5 hover:bg-danger-glow flex items-center justify-center transition-all border border-white/5"><span className="material-symbols-outlined text-white text-3xl">close</span></button>
              </header>
              <div className="flex-1 overflow-y-auto p-8 sm:p-16 space-y-12 no-scrollbar">
                 <div className="p-10 bg-white/[0.01] border border-white/5 rounded-[56px] italic text-lg sm:text-2xl font-bold text-gray-200">"{selectedRecord.prompt}"</div>
                 {isAuditing ? (
                   <div className="flex flex-col items-center justify-center py-20 space-y-8">
                      <div className="size-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-[12px] font-black text-primary uppercase tracking-[0.6em] animate-pulse">Neural Link Decrypting...</p>
                   </div>
                 ) : neuralVerdict && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
                      {[
                        { title: "1. Kiến thức nền", color: "#00f5ff", icon: "account_balance", text: neuralVerdict.foundation },
                        { title: "2. Mối quan hệ ngữ cảnh", color: "#6366f1", icon: "explore", text: neuralVerdict.context },
                        { title: "3. Bẫy tư duy logic", color: "#ff0055", icon: "crisis_alert", text: neuralVerdict.trap }
                      ].map((item, i) => (
                        <div key={i} className="p-8 sm:p-12 bg-black/40 border border-white/5 rounded-[48px]">
                           <h5 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-4" style={{ color: item.color }}>
                             <span className="material-symbols-outlined text-xl">{item.icon}</span> {item.title}
                           </h5>
                           <p className="text-[15px] sm:text-[17px] text-gray-400 leading-relaxed italic">{item.text}</p>
                        </div>
                      ))}
                      <div className="p-8 sm:p-12 bg-c4-green/5 border-2 border-c4-green/20 rounded-[48px] flex flex-col justify-center">
                         <h5 className="text-[11px] font-black text-c4-green uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                           <span className="material-symbols-outlined text-xl">biotech</span> 4. Công thức nén
                         </h5>
                         <div className="p-8 bg-black/60 rounded-[32px] border border-c4-green/30 text-center relative overflow-hidden group">
                            <p className="text-[20px] sm:text-[28px] text-white font-black italic tracking-tighter leading-tight relative z-10">{neuralVerdict.formula}</p>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-slow { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 50% { transform: translateX(0); } 100% { transform: translateX(100%); } }
        .animate-loading-bar { animation: loading-bar 2s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;
