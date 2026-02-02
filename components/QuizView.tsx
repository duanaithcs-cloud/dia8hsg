
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { QuizSession, Question, Topic, KnowledgeRecord, GeoSkill, TagLevel } from '../types';
import { GeminiService } from '../services/geminiService';

interface QuizViewProps {
  topic: Topic;
  session: QuizSession;
  onComplete: (answers: Record<string, string>, ledger: KnowledgeRecord[]) => void;
  onCancel: () => void;
  onToggleNotes?: () => void;
  onQuickDNAExport?: () => void;
  onUpdateTopicNotes?: (topicId: number, notes: string) => void;
}

const normalizeAnswer = (val: string | undefined): string => {
  if (!val) return "";
  const v = val.toUpperCase().trim();
  if (v === 'TRUE' || v === 'T' || v === 'ĐÚNG' || v === 'D') return 'TRUE';
  if (v === 'FALSE' || v === 'F' || v === 'SAI' || v === 'S') return 'FALSE';
  return v;
};

const getSkillGroupFromType = (type: string): string | undefined => {
  if (type === GeoSkill.MAP) return GeoSkill.MAP;
  if (type === GeoSkill.LOGIC) return GeoSkill.LOGIC;
  if (type === GeoSkill.DATA) return GeoSkill.DATA;
  if (type === GeoSkill.CHART) return GeoSkill.CHART;
  return undefined;
};

const QuizView: React.FC<QuizViewProps> = ({ topic, session, onComplete, onCancel, onToggleNotes, onQuickDNAExport, onUpdateTopicNotes }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [advisoryResult, setAdvisoryResult] = useState<{ foundation: string, context: string, trap: string, formula: string } | null>(null);
  const [ledger, setLedger] = useState<KnowledgeRecord[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(session.time_limit_seconds || 0);
  const [isForging, setIsForging] = useState(false);
  const [isNoteSynced, setIsNoteSynced] = useState(false);

  const currentQuestion = session.questions[currentIndex];

  const parseInstantAdvisory = (explain: string) => {
    const parts = explain.split('|').map(p => p.trim());
    return {
      foundation: parts[0] || "Dữ liệu đang được truy xuất...",
      context: parts[1] || "Phân tích ngữ cảnh thực tế...",
      trap: parts[2] || "Xác định bẫy tư duy...",
      formula: parts[3] || "Đang nén công thức..."
    };
  };

  useEffect(() => {
    if (!session.time_limit_seconds || isForging) return;
    const timer = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timer); setIsForging(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session.time_limit_seconds, isForging]);

  const handleAction = async (val: string) => {
    if (showExplanation || !val.trim()) return;
    const correct = normalizeAnswer(val) === normalizeAnswer(currentQuestion.answer_key);
    
    const instantAdvisory = parseInstantAdvisory(currentQuestion.explain);
    setAdvisoryResult(instantAdvisory);

    const newRecord: KnowledgeRecord = {
      qid: currentQuestion.qid,
      timestamp: new Date().toISOString(),
      prompt: currentQuestion.prompt,
      userAnswer: val,
      correctAnswer: currentQuestion.answer_key,
      aiExplanation: currentQuestion.explain,
      isCorrect: correct,
      choices: currentQuestion.choices,
      skillGroup: getSkillGroupFromType(session.type), 
      cognitiveLevel: currentQuestion.skill_tag as TagLevel, // Cấy Metadata bậc nhận thức vào Ledger
      aiAdvisory: instantAdvisory 
    };

    setLedger(p => [...p, newRecord]);
    setAnswers(p => ({ ...p, [currentQuestion.qid]: val }));
    setUserAnswer(val);
    setShowExplanation(true);
    setIsNoteSynced(false);
  };

  const handleSyncToNotesPro = () => {
    if (!advisoryResult || !onUpdateTopicNotes) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const noteContent = `\n--- [NOTES PRO: ${timestamp}] ---\nQ: ${currentQuestion.prompt}\n🧠 CÔNG THỨC: ${advisoryResult.formula}\n⚠️ BẪY: ${advisoryResult.trap}\n--------------------------\n`;
    
    const updatedNotes = (topic.notes || "") + noteContent;
    onUpdateTopicNotes(topic.topic_id, updatedNotes);
    setIsNoteSynced(true);
  };

  const handleDeepAudit = async () => {
    setIsAuditing(true);
    try {
      const record = ledger[ledger.length - 1];
      await GeminiService.auditStudentSynapse(record, "Deep Forensic Audit");
      alert("Hội đồng AI: Phân tích sâu đã được ghi nhận vào Sổ cái.");
    } catch (e) { alert("Kết nối AI gián đoạn."); }
    finally { setIsAuditing(false); }
  };

  const handleNext = () => {
    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowExplanation(false);
      setAdvisoryResult(null);
      setUserAnswer("");
      setIsNoteSynced(false);
    } else {
      setIsForging(true);
    }
  };

  if (isForging) {
    return (
      <div className="fixed inset-0 z-[100000] bg-background-dark flex flex-col items-center justify-center p-4 sm:p-10 animate-fade-in">
        <div className="max-w-4xl w-full bg-card-dark border border-white/10 rounded-[32px] sm:rounded-[64px] p-6 sm:p-12 text-center space-y-8 sm:space-y-10 shadow-2xl overflow-y-auto no-scrollbar max-h-full">
          <header className="space-y-3">
            <span className="px-4 py-1.5 bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-[0.3em] rounded-full">KẾT THÚC PHIÊN LUYỆN</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Giải mã <span className="text-primary">DNA Tư duy</span></h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-6 sm:p-8 bg-white/5 rounded-3xl sm:rounded-[40px] border border-white/5 flex flex-col items-center">
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Chính xác</span>
              <div className="text-3xl sm:text-4xl font-black text-primary italic">{Math.round((ledger.filter(l => l.isCorrect).length / session.questions.length) * 100)}%</div>
            </div>
            <div className="p-6 sm:p-8 bg-white/5 rounded-3xl sm:rounded-[40px] border border-white/5 flex flex-col items-center">
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Đúng/Tổng</span>
              <div className="text-3xl sm:text-4xl font-black text-c4-green italic">{ledger.filter(l => l.isCorrect).length}/{session.questions.length}</div>
            </div>
            <div className="p-6 sm:p-8 bg-white/5 rounded-3xl sm:rounded-[40px] border border-white/5 flex flex-col items-center">
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">AI Decoded</span>
              <div className="text-3xl sm:text-4xl font-black text-amber-500 italic">{ledger.length}</div>
            </div>
          </div>
          <button onClick={() => onComplete(answers, ledger)} className="w-full h-16 sm:h-20 bg-primary text-black font-black uppercase rounded-2xl sm:rounded-[32px] hover:scale-[1.03] transition-all shadow-xl shadow-primary/20 text-sm sm:text-base">XÁC THỰC DNA & LƯU SỔ CÁI</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background-dark relative overflow-hidden">
      <header className="px-4 sm:px-10 py-4 sm:py-6 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-2xl z-50 shrink-0">
        <div className="flex items-center gap-3 sm:gap-6">
          <button onClick={onCancel} className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all active:scale-90"><span className="material-symbols-outlined text-xl sm:text-2xl">arrow_back</span></button>
          <div>
            <h3 className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em] sm:tracking-[0.4em] italic">{session.type}</h3>
            <h4 className="text-sm sm:text-xl font-black text-white italic uppercase truncate max-w-[120px] sm:max-w-none">{topic.keyword_label}</h4>
          </div>
        </div>
        <div className="flex gap-4 sm:gap-6 items-center">
           {session.time_limit_seconds && (
             <div className="px-3 sm:px-6 py-1.5 sm:py-2 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 flex items-center gap-2 sm:gap-3">
               <span className="material-symbols-outlined text-primary text-xs sm:text-sm">timer</span>
               <span className="text-base sm:text-xl font-black text-white tabular-nums">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
             </div>
           )}
           <div className="hidden sm:flex gap-1.5">
              {session.questions.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-8 bg-primary shadow-[0_0_10px_#00f5ff]' : (answers[session.questions[i].qid] ? (normalizeAnswer(answers[session.questions[i].qid]) === normalizeAnswer(session.questions[i].answer_key) ? 'w-1.5 bg-c4-green' : 'w-1.5 bg-danger-glow') : 'w-1.5 bg-white/10')}`}></div>
              ))}
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-10 flex flex-col items-center z-10 scroll-smooth no-scrollbar pb-24 sm:pb-32">
        <div className="w-full max-w-4xl space-y-6 sm:space-y-10 animate-slide-up">
           <div className="bg-white/[0.02] border border-white/5 p-6 sm:p-12 rounded-3xl sm:rounded-[56px] shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5"><span className="material-symbols-outlined text-7xl sm:text-9xl">quiz</span></div>
              <span className="px-3 py-1 bg-primary/20 text-primary text-[8px] sm:text-[10px] font-black uppercase rounded-lg mb-4 sm:mb-6 inline-block">HẠNG MỤC: {currentQuestion.skill_tag}</span>
              <h2 className="text-xl sm:text-3xl font-black text-white italic leading-tight relative z-10">{currentQuestion.prompt}</h2>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-6 sm:mt-10 relative z-10">
                 {currentQuestion.choices && Object.entries(currentQuestion.choices).map(([k, v]) => (
                   <button 
                     key={k} 
                     onClick={() => handleAction(k)}
                     disabled={showExplanation}
                     className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 text-left flex items-center gap-4 sm:gap-6 transition-all active:scale-95
                       ${userAnswer === k 
                         ? (normalizeAnswer(userAnswer) === normalizeAnswer(currentQuestion.answer_key) ? 'bg-c4-green/20 border-c4-green shadow-[0_0_20px_#00ff88]' : 'bg-danger-glow/20 border-danger-glow shadow-[0_0_20px_#ff0055]') 
                         : (showExplanation && k === normalizeAnswer(currentQuestion.answer_key) ? 'bg-c4-green/20 border-c4-green' : 'bg-white/5 border-white/10 hover:bg-white/10')
                       }`}
                   >
                     <span className={`size-8 sm:size-10 rounded-lg sm:rounded-xl border-2 flex items-center justify-center font-black shrink-0 ${userAnswer === k ? 'bg-white text-black' : 'text-gray-500'}`}>{k}</span>
                     <span className="text-sm sm:text-lg font-bold text-gray-200">{v}</span>
                   </button>
                 ))}
              </div>
           </div>

           {showExplanation && (
             <div className="bg-black/80 border border-white/10 rounded-3xl sm:rounded-[64px] p-6 sm:p-12 animate-pop-in space-y-8 sm:space-y-10 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 sm:pb-8 relative z-10 gap-6">
                   <div className="flex items-center gap-4 sm:gap-6">
                      <div className={`size-12 sm:size-16 rounded-2xl sm:rounded-3xl flex items-center justify-center shrink-0 ${normalizeAnswer(userAnswer) === normalizeAnswer(currentQuestion.answer_key) ? 'bg-c4-green/20 text-c4-green' : 'bg-danger-glow/20 text-danger-glow'}`}>
                         <span className="material-symbols-outlined text-3xl sm:text-4xl">{normalizeAnswer(userAnswer) === normalizeAnswer(currentQuestion.answer_key) ? 'verified' : 'crisis_alert'}</span>
                      </div>
                      <h4 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tighter">Neural Advisory</h4>
                   </div>
                   <div className="flex items-center justify-between sm:justify-end gap-4">
                      {onUpdateTopicNotes && (
                        <button 
                          onClick={handleSyncToNotesPro}
                          disabled={isNoteSynced}
                          className={`h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 font-black uppercase text-[8px] sm:text-[10px] tracking-widest transition-all ${isNoteSynced ? 'bg-c4-green text-black shadow-lg shadow-c4-green/20' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                          <span className="material-symbols-outlined text-sm sm:text-base">{isNoteSynced ? 'check_circle' : 'edit_note'}</span>
                          {isNoteSynced ? 'ĐÃ LƯU' : 'GHI CHÚ PRO'}
                        </button>
                      )}
                      <div className="text-right">
                          <span className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase">Correct DNA</span>
                          <div className="text-4xl sm:text-6xl font-black text-c4-green italic tracking-tighter">{currentQuestion.answer_key}</div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10">
                  <div className="p-6 sm:p-8 bg-[#111827]/80 border border-white/5 rounded-2xl sm:rounded-[40px] shadow-inner hover:border-primary/40 transition-all">
                     <h5 className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-3 flex items-center gap-2 sm:gap-3">
                        <span className="material-symbols-outlined text-xs sm:text-sm">account_balance</span> 1. KIẾN THỨC NỀN
                     </h5>
                     <p className="text-[12px] sm:text-[14px] text-gray-300 italic leading-relaxed font-medium">{advisoryResult?.foundation}</p>
                  </div>
                  <div className="p-6 sm:p-8 bg-[#111827]/80 border border-white/5 rounded-2xl sm:rounded-[40px] shadow-inner hover:border-indigo-400/40 transition-all">
                     <h5 className="text-[8px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-3 flex items-center gap-2 sm:gap-3">
                        <span className="material-symbols-outlined text-xs sm:text-sm">explore</span> 2. MỐI QUAN HỆ
                     </h5>
                     <p className="text-[12px] sm:text-[14px] text-gray-300 italic leading-relaxed font-medium">{advisoryResult?.context}</p>
                  </div>
                  <div className="p-6 sm:p-8 bg-[#1c1917]/80 border border-danger-glow/20 rounded-2xl sm:rounded-[40px] shadow-inner hover:border-danger-glow/50 transition-all">
                     <h5 className="text-[8px] sm:text-[10px] font-black text-danger-glow uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-3 flex items-center gap-2 sm:gap-3">
                        <span className="material-symbols-outlined text-xs sm:text-sm">crisis_alert</span> 3. BẪY TƯ DUY
                     </h5>
                     <p className="text-[12px] sm:text-[14px] text-gray-300 italic leading-relaxed font-medium">{advisoryResult?.trap}</p>
                  </div>
                  <div className="p-6 sm:p-8 bg-[#064e3b]/80 border border-c4-green/30 rounded-2xl sm:rounded-[40px] shadow-inner hover:border-c4-green transition-all">
                     <h5 className="text-[8px] sm:text-[10px] font-black text-c4-green uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-3 flex items-center gap-2 sm:gap-3">
                        <span className="material-symbols-outlined text-xs sm:text-sm">biotech</span> 4. CÔNG THỨC NÉN
                     </h5>
                     <p className="text-[14px] sm:text-[16px] text-white font-black italic bg-black/40 p-4 rounded-xl shadow-inner text-center leading-relaxed">{advisoryResult?.formula}</p>
                  </div>
                </div>

                <div className="pt-6 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 sm:gap-6 relative z-10">
                   <button onClick={handleDeepAudit} className="h-14 sm:h-16 bg-white/5 border border-white/10 text-gray-500 font-black uppercase rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 hover:text-white hover:bg-white/10 transition-all text-[10px] sm:text-xs">
                      <span className="material-symbols-outlined text-lg sm:text-xl">forensics</span> {isAuditing ? 'SCANNING...' : 'DEEP SCAN'}
                   </button>
                   <button onClick={handleNext} className="h-16 sm:h-20 bg-primary text-black font-black uppercase rounded-2xl sm:rounded-[32px] flex items-center justify-center gap-3 sm:gap-4 shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all text-sm sm:text-base">
                      TIẾP TỤC <span className="material-symbols-outlined">arrow_forward</span>
                   </button>
                </div>
             </div>
           )}
        </div>
      </main>
      <style>{`
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default QuizView;
