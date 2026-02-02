
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppState, Topic, Timeframe, QuizSession, RankLevel, UIPreferences, ArenaStats, StudyGoal, TagLevel, CompetencyScores, KnowledgeRecord, KnowledgeAsset, GeoSkill, BaseStudent, BaseProgress } from './types';
import { MOCK_TOPICS } from './data';
import BubbleCanvas from './components/BubbleCanvas';
import TopicDrawer from './components/TopicDrawer';
import QuizView from './components/QuizView';
import ArenaMode from './components/ArenaMode';
import TeacherDashboard from './components/TeacherDashboard';
import Heatmap from './components/Heatmap';
import RankPanel from './components/RankPanel';
import CanvasOptionsDialog from './components/CanvasOptionsDialog';
import IdentityDialog from './components/IdentityDialog';
import InfographicModal from './components/InfographicModal'; 
import FloatingNotes from './components/FloatingNotes';
import StrategyHub from './components/StrategyHub';
import { GeminiService } from './services/geminiService';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const APP_STATE_KEY = 'dia_ai_neon_elite_v17'; 
const ARENA_STORE_KEY = 'arena_neon_v17';

const DRAGON_ORB_IDS = [2, 8, 15, 22, 27, 30, 33];

const defaultUI: UIPreferences = {
  bubbleScale: 1.0, 
  intensity: 55, 
  showBreathing: true, 
  breathAmp: 6, 
  glowIntensity: 75, 
  activeTheme: 'NEON', 
  saturation: 85, 
  driftForce: 25, 
  repulsion: 85, 
  fontSize: 13, 
  showRoadmap: true, 
  showTranslucentCore: false
};

const toSafeBase64 = (str: string) => {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
  } catch (e) {
    return "";
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(APP_STATE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      user_profile: { school: "Neon Elite HSG", level: "HSG", role: 'STUDENT', rank: RankLevel.DONG, rankPoints: 0, streak: 0, preferences: defaultUI },
      timeframe: Timeframe.D7,
      topics: MOCK_TOPICS.map(t => ({...t, deadline: null, personal_assets: [], notes: ""})),
      pokemon_collection: [], session_log: [], missions: [], has_started: false, is_demo: true, view_mode: 'STUDENT_CANVAS', 
      decodedTopicIds: [], 
      baseStudents: [], baseAssignments: {}, baseProgress: [], global_notes: ""
    };
  });

  const [arenaStore, setArenaStore] = useState<Record<number, ArenaStats>>(() => {
    const saved = localStorage.getItem(ARENA_STORE_KEY);
    if (saved) return JSON.parse(saved);
    const store: Record<number, ArenaStats> = {};
    MOCK_TOPICS.forEach(t => { store[t.topic_id] = { star_level: 0, matches_played: 0, best_accuracy: 0, last_match_at: null, last_result: null }; });
    return store;
  });

  const [showIdentityDialog, setShowIdentityDialog] = useState(false);
  const [isCanvasSettingsOpen, setIsCanvasSettingsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [generatingTopicId, setGeneratingTopicId] = useState<number | null>(null);
  
  // Trạng thái khôi phục Infographic
  const [activeInfographic, setActiveInfographic] = useState<{ url: string; name: string } | null>(null);
  
  const [isRankingsOpen, setIsRankingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeLevels, setActiveLevels] = useState<TagLevel[]>([TagLevel.NB, TagLevel.TH, TagLevel.VD, TagLevel.VDC]);
  const [isGlobalNotesOpen, setIsGlobalNotesOpen] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<'NORMAL' | 'EXHAUSTED' | 'NOT_FOUND'>('NORMAL');

  useEffect(() => { localStorage.setItem(APP_STATE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => { localStorage.setItem(ARENA_STORE_KEY, JSON.stringify(arenaStore)); }, [arenaStore]);

  const handleUpdateUIPreference = (key: keyof UIPreferences, value: any) => {
    setState(prev => ({ ...prev, user_profile: { ...prev.user_profile, preferences: { ...prev.user_profile.preferences, [key]: value } } }));
  };

  const handleBubbleClick = (id: number) => {
    if (!state.has_started) { setShowIdentityDialog(true); return; }
    setSelectedTopicId(id); setIsDrawerOpen(true);
  };

  const handleAddAsset = (topicId: number, asset: KnowledgeAsset) => {
    setState(prev => ({
      ...prev,
      topics: prev.topics.map(t => t.topic_id === topicId ? { ...t, personal_assets: [...(t.personal_assets || []), asset] } : t)
    }));
  };

  const handleRemoveAsset = (topicId: number, assetId: string) => {
    setState(prev => ({
      ...prev,
      topics: prev.topics.map(t => t.topic_id === topicId ? { ...t, personal_assets: (t.personal_assets || []).filter(a => a.id !== assetId) } : t)
    }));
  };

  const handleUpdateTopicNotes = (topicId: number, notes: string) => {
    setState(prev => ({
      ...prev,
      topics: prev.topics.map(t => t.topic_id === topicId ? { ...t, notes } : t)
    }));
  };

  const handleUpdateGlobalNotes = (notes: string) => {
    setState(prev => ({ ...prev, global_notes: notes }));
  };

  const handleExportDNACSV = useCallback(() => {
    if (!state.user_profile.fullName) { setShowIdentityDialog(true); return; }
    setIsSyncing(true);
    
    setTimeout(() => {
      try {
        const token = `GEOAI-NEON-DNA-V17::${toSafeBase64(JSON.stringify(state.topics))}`;
        const headers = ["ID", "CHUYÊN ĐỀ", "TRẠNG THÁI", "MASTERY (%)", "C1", "C2", "C3", "C4", "GHI CHÚ"];
        const rows = state.topics.map(t => {
          let statusEmoji = "⚪";
          if (t.mastery_percent >= 90) statusEmoji = "💎";
          else if (t.mastery_percent >= 60) statusEmoji = "🟢";
          else if (t.mastery_percent > 0) statusEmoji = "🔴";
          return [t.topic_id, `"${t.keyword_label}"`, statusEmoji, t.mastery_percent, t.competency_scores.C1, t.competency_scores.C2, t.competency_scores.C3, t.competency_scores.C4, `"${(t.notes || "").replace(/"/g, '""')}"`].join(',');
        });

        const csvLines = ["PROTOCOL,v17.5_NEON_ELITE", `STUDENT_NAME,${state.user_profile.fullName}`, `CLASS_NODE,${state.user_profile.className}`, `DNA_TOKEN,${token}`, "", "--- BẢN THẨM ĐỊNH CHI TIẾT ---", headers.join(','), ...rows];
        const blob = new Blob(["\ufeff" + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute('download', `DNA_ELITE_VAULT_${state.user_profile.fullName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } finally {
        setIsSyncing(false);
      }
    }, 800);
  }, [state.topics, state.user_profile]);

  const handleIdentityConfirm = (fullName: string, className: string, goal: StudyGoal, teacherWalletId: string) => {
    setState(prev => ({
      ...prev,
      user_profile: { ...prev.user_profile, fullName, className, goal, teacherWalletId },
      topics: prev.topics.map(t => ({
        ...t,
        mastery_percent: 0,
        competency_scores: { C1: 0, C2: 0, C3: 0, C4: 0 },
        knowledge_ledger: [],
        attempts_count: 0
      })),
      decodedTopicIds: [], 
      has_started: true, 
      is_demo: false
    }));
    
    const resetArena: Record<number, ArenaStats> = {};
    MOCK_TOPICS.forEach(t => { resetArena[t.topic_id] = { star_level: 0, matches_played: 0, best_accuracy: 0, last_match_at: null, last_result: null }; });
    setArenaStore(resetArena);

    setShowIdentityDialog(false);
  };

  const handleApiKeyChange = async () => {
    await window.aistudio?.openSelectKey();
    setQuotaStatus('NORMAL');
  };

  const executeStartQuiz = async (topicId: number, count: 10 | 25 | GeoSkill, isArena: boolean = false) => {
    setGeneratingTopicId(topicId); setIsDrawerOpen(false);
    try {
      const topic = state.topics.find(t => t.topic_id === topicId);
      if (!topic) return;
      const questions = await GeminiService.generateQuiz(topic, typeof count === 'number' ? count : 10, isArena, typeof count === 'string' ? count as GeoSkill : undefined);
      setQuizSession({ 
        topic_id: topicId, type: isArena ? 'ARENA_COMBAT' : (typeof count === 'string' ? count as GeoSkill : (count === 10 ? 'Luyện 10' : 'Luyện 25')), 
        questions, currentQuestionIndex: 0, answers: {}, time_limit_seconds: isArena ? 300 : (count === 10 ? 600 : 1200) 
      });
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED") setQuotaStatus('EXHAUSTED');
      else if (err.message === "NOT_FOUND") setQuotaStatus('NOT_FOUND');
      else alert("Lỗi hệ thống Neural Link. Thử lại sau!");
    } finally { setGeneratingTopicId(null); }
  };

  const handleQuizComplete = (finalAnswers: Record<string, string>, ledger: KnowledgeRecord[]) => {
    if (!quizSession) return;
    let correct = 0;
    quizSession.questions.forEach(q => { if (finalAnswers[q.qid]?.toUpperCase() === q.answer_key.toUpperCase()) correct++; });
    const accuracy = (correct / quizSession.questions.length) * 100;
    
    const isDragonOrb = DRAGON_ORB_IDS.includes(quizSession.topic_id);

    setState(prev => {
      const newDecoded = (isDragonOrb && accuracy >= 50 && !prev.decodedTopicIds?.includes(quizSession.topic_id))
        ? [...(prev.decodedTopicIds || []), quizSession.topic_id]
        : (prev.decodedTopicIds || []);

      return {
        ...prev,
        decodedTopicIds: newDecoded,
        topics: prev.topics.map(t => t.topic_id === quizSession.topic_id ? { 
          ...t, 
          mastery_percent: Math.min(100, t.mastery_percent + Math.floor(accuracy / 5)), 
          attempts_count: t.attempts_count + 1,
          knowledge_ledger: [...(t.knowledge_ledger || []), ...ledger]
        } : t)
      };
    });

    if (isDragonOrb && accuracy >= 80) {
      setArenaStore(prev => ({
        ...prev,
        [quizSession.topic_id]: {
          ...prev[quizSession.topic_id],
          star_level: Math.min(7, (prev[quizSession.topic_id]?.star_level || 0) + 1)
        }
      }));
    }

    setQuizSession(null);
  };

  const navItems = [
    { id: 'STUDENT_CANVAS', icon: 'bubble_chart', label: 'Canvas' },
    { id: 'MATRIX_VIEW', icon: 'grid_view', label: 'Matrix' },
    { id: 'STRATEGY_HUB', icon: 'edit_note', label: 'Notes Pro' },
    { id: 'ARENA_MODE', icon: 'swords', label: 'Arena' },
    { id: 'TEACHER_DASHBOARD', icon: 'school', label: 'Teacher' }
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-background-dark text-white font-display overflow-hidden safe-area-inset pb-[calc(var(--sab)+64px)] sm:pb-0">
      {showIdentityDialog && <IdentityDialog onConfirm={handleIdentityConfirm} onCancel={() => setShowIdentityDialog(false)} />}
      
      {quotaStatus !== 'NORMAL' && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="max-w-md w-full bg-card-dark border border-white/10 rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 text-center space-y-6 sm:space-y-8 animate-pop-in shadow-2xl">
             <div className={`size-16 sm:size-20 rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center shadow-lg ${quotaStatus === 'EXHAUSTED' ? 'bg-danger-glow/20 border border-danger-glow/40 text-danger-glow' : 'bg-primary/20 border border-primary/40 text-primary'}`}>
                <span className="material-symbols-outlined text-3xl sm:text-4xl">{quotaStatus === 'EXHAUSTED' ? 'history_toggle_off' : 'vpn_key_off'}</span>
             </div>
             <div>
                <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter">{quotaStatus === 'EXHAUSTED' ? 'QUOTA LIMIT REACHED' : 'KEY ACCESS DENIED'}</h3>
                <p className="text-[12px] sm:text-sm text-gray-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                   {quotaStatus === 'EXHAUSTED' 
                     ? "Đạt giới hạn yêu cầu (15 req/min). Hãy chờ 15-30 giây để hệ thống phục hồi."
                     : "API Key hiện tại không thể kết nối. Vui lòng chọn lại Key."}
                </p>
             </div>
             <div className="space-y-3 sm:space-y-4">
                <button onClick={() => setQuotaStatus('NORMAL')} className="w-full h-12 sm:h-14 border border-white/10 text-white font-black uppercase rounded-2xl sm:rounded-3xl hover:bg-white/5 transition-all">TIẾP TỤC ĐỢI</button>
                <button onClick={handleApiKeyChange} className="w-full h-14 sm:h-16 bg-primary text-black font-black uppercase rounded-2xl sm:rounded-3xl hover:scale-[1.03] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
                   <span className="material-symbols-outlined">vpn_key</span> KEY MỚI
                </button>
             </div>
          </div>
        </div>
      )}

      <header className="flex items-center backdrop-blur-3xl p-2 px-4 sm:px-6 justify-between z-[5000] border-b border-white/10 h-14 sm:h-16 bg-background-dark/95">
        <div className="flex items-center gap-3 sm:gap-5 relative">
          <button onClick={() => setIsCanvasSettingsOpen(true)} className="size-9 sm:size-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(0,245,255,0.2)]">
            <span className="material-symbols-outlined text-xl sm:text-2xl">tune</span>
          </button>
          <div className="flex flex-col"><h2 className="text-[11px] sm:text-[13px] font-black uppercase tracking-widest text-primary leading-tight text-neon-glow">ĐỊA AI</h2><span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Elite HSG v21</span></div>
        </div>
        
        <nav className="hidden md:flex items-center bg-white/5 rounded-2xl p-1 gap-1 border border-white/10 backdrop-blur-xl">
          {navItems.map(m => (
            <button key={m.id} onClick={() => setState(p => ({...p, view_mode: m.id as any}))} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.view_mode === m.id ? 'bg-primary text-black shadow-[0_0_20px_rgba(0,245,255,0.4)]' : 'text-gray-500 hover:text-white'}`}>
              {m.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
           <button onClick={handleApiKeyChange} className="size-9 sm:h-10 sm:px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-gray-400 flex items-center justify-center sm:gap-2">
              <span className="material-symbols-outlined text-sm">key</span>
              <span className="hidden sm:inline">Key</span>
           </button>
           <button onClick={handleExportDNACSV} className={`h-9 sm:h-10 px-3 sm:px-5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${isSyncing ? 'bg-primary text-black animate-pulse' : 'bg-primary/10 text-primary border border-primary/30'}`}>
             {isSyncing ? 'SYNC...' : <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">sync</span> <span className="hidden sm:inline">PROFESSOR SYNC</span><span className="sm:hidden">SYNC</span></span>}
           </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden h-full">
        {quizSession ? (
          <QuizView 
            topic={state.topics.find(t => t.topic_id === quizSession.topic_id)!} 
            session={quizSession} 
            onComplete={handleQuizComplete} 
            onCancel={() => setQuizSession(null)} 
            onToggleNotes={() => setIsGlobalNotesOpen(!isGlobalNotesOpen)}
            onQuickDNAExport={handleExportDNACSV}
            onUpdateTopicNotes={handleUpdateTopicNotes}
          />
        ) : (
          <div className="h-full w-full">
            {state.view_mode === 'STUDENT_CANVAS' && <BubbleCanvas topics={state.topics} generatingTopicId={generatingTopicId} celebrationTopicId={null} preferences={state.user_profile.preferences} arenaStore={arenaStore} decodedTopicIds={state.decodedTopicIds} dragonOrbIds={DRAGON_ORB_IDS} onBubbleClick={handleBubbleClick} activeLevels={activeLevels} />}
            {state.view_mode === 'MATRIX_VIEW' && <Heatmap topics={state.topics} onTopicClick={handleBubbleClick} />}
            {state.view_mode === 'STRATEGY_HUB' && <StrategyHub topics={state.topics} userProfile={state.user_profile} onJumpToTopic={handleBubbleClick} />}
            {state.view_mode === 'ARENA_MODE' && <ArenaMode topics={state.topics} userProfile={state.user_profile} arenaStore={arenaStore} decodedTopicIds={state.decodedTopicIds || []} onStartMatch={(id) => executeStartQuiz(id, 10, true)} />}
            {state.view_mode === 'TEACHER_DASHBOARD' && (
              <TeacherDashboard 
                topics={state.topics} 
                baseStudents={state.baseStudents} 
                baseProgress={state.baseProgress}
                onAddStudent={(s) => setState(p => ({...p, baseStudents: [...(p.baseStudents || []), s]}))}
                onUpdateProgress={(pg) => setState(p => ({...p, baseProgress: pg}))}
                onDeleteStudent={(id) => setState(p => ({...p, baseStudents: (p.baseStudents || []).filter(s => s.id !== id)}))}
                onClose={() => setState(p => ({...p, view_mode: 'STUDENT_CANVAS'}))}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {!quizSession && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background-dark/95 backdrop-blur-3xl border-t border-white/10 z-[5000] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map(m => (
            <button 
              key={m.id} 
              onClick={() => setState(p => ({...p, view_mode: m.id as any}))}
              className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full ${state.view_mode === m.id ? 'text-primary' : 'text-gray-500'}`}
            >
              <span className={`material-symbols-outlined text-2xl ${state.view_mode === m.id ? 'fill-1 animate-pulse' : ''}`}>{m.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest">{m.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      )}

      {isCanvasSettingsOpen && <CanvasOptionsDialog preferences={state.user_profile.preferences} onUpdate={handleUpdateUIPreference} onClose={() => setIsCanvasSettingsOpen(false)} />}
      
      {/* Khôi phục TopicDrawer với tính năng Infographic được kích hoạt */}
      {isDrawerOpen && selectedTopicId && (
        <TopicDrawer 
          topic={state.topics.find(t => t.topic_id === selectedTopicId)!} 
          decodedTopicIds={state.decodedTopicIds || []} 
          history={state.session_log.filter(e => e.topicId === selectedTopicId)} 
          arenaStore={arenaStore} 
          onClose={() => setIsDrawerOpen(false)} 
          onStartLuyen10={() => executeStartQuiz(selectedTopicId, 10)} 
          onStartLuyen25={() => executeStartQuiz(selectedTopicId, 25)} 
          onStartArena={() => executeStartQuiz(selectedTopicId, 10, true)} 
          onStartSkill={(skill) => executeStartQuiz(selectedTopicId, skill)} 
          onFetchInsights={(topic) => GeminiService.fetchTopicInsights(topic)} 
          onShowInfographic={() => {
            const topic = state.topics.find(t => t.topic_id === selectedTopicId);
            if (topic?.infographic_url) {
              setActiveInfographic({ url: topic.infographic_url, name: topic.keyword_label });
            }
          }} 
          onAddAsset={(asset) => handleAddAsset(selectedTopicId, asset)} 
          onRemoveAsset={(assetId) => handleRemoveAsset(selectedTopicId, assetId)} 
          onUpdateNotes={(notes) => handleUpdateTopicNotes(selectedTopicId, notes)} 
          onToggleNotes={() => setIsGlobalNotesOpen(!isGlobalNotesOpen)} 
        />
      )}
      
      {/* Hiển thị Infographic Modal */}
      {activeInfographic && (
        <InfographicModal 
          url={activeInfographic.url} 
          topicName={activeInfographic.name} 
          onClose={() => setActiveInfographic(null)} 
          onToggleNotes={() => setIsGlobalNotesOpen(!isGlobalNotesOpen)}
        />
      )}
      
      {isGlobalNotesOpen && (
        <FloatingNotes 
          topic={selectedTopicId ? state.topics.find(t => t.topic_id === selectedTopicId) : undefined} 
          globalNotes={state.global_notes}
          onUpdateNotes={(notes) => selectedTopicId ? handleUpdateTopicNotes(selectedTopicId, notes) : handleUpdateGlobalNotes(notes)} 
          onClose={() => setIsGlobalNotesOpen(false)} 
        />
      )}
    </div>
  );
};
export default App;
