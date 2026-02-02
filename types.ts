
export enum TagLevel {
  NB = 'NB',
  TH = 'TH',
  VD = 'VD',
  VDC = 'VDC'
}

export enum GeoSkill {
  MAP = 'Bản đồ',
  LOGIC = 'Mối quan hệ',
  DATA = 'Kiến thức nền',
  CHART = 'Biểu đồ'
}

export enum Timeframe {
  D7 = '7d',
  D30 = '30d',
  D90 = '90d',
  HKI = 'HKI',
  HKII = 'HKII',
  ALL = 'ALL'
}

export enum RankLevel {
  DONG = 'Đồng',
  BAC = 'Bạc',
  VANG = 'Vàng',
  BACH_KIM = 'Bạch Kim',
  KIM_CUONG = 'Kim Cương',
  CAO_THU = 'Cao Thủ',
  THACH_DAU = 'Thách Đấu'
}

export enum StudyGoal {
  CHAMPION = 'Trạng Nguyên (Vô địch)',
  FIRST_PRIZE = 'Bảng Nhãn (Giải Nhất)',
  SECOND_PRIZE = 'Thám Hoa (Giải Nhì)',
  THIRD_PRIZE = 'Giải Ba / Khuyến Khích'
}

export type AppleTheme = 'ZALO' | 'NEON' | 'AURORA' | 'SUNSET' | 'DARK';

export interface UIPreferences {
  bubbleScale: number;
  intensity: number;
  showBreathing: boolean;
  breathAmp: number;
  glowIntensity: number;
  activeTheme: AppleTheme;
  saturation: number;
  driftForce: number;
  repulsion: number;
  fontSize: number;
  showRoadmap: boolean; 
  showTranslucentCore: boolean;
}

export interface CompetencyScores {
  NB: number;
  TH: number;
  VD: number;
  VDC: number;
}

export interface KnowledgeRecord {
  qid: string;
  timestamp: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  aiExplanation: string;
  isCorrect: boolean;
  choices?: Record<string, string>; 
  isLearned?: boolean;
  skillGroup?: string; 
  cognitiveLevel?: TagLevel; // Bậc nhận thức cụ thể của câu hỏi (NB, TH, VD, VDC)
  aiAdvisory?: {
    foundation: string;
    context: string;
    trap: string;
    formula: string;
  };
}

export interface KnowledgeAsset {
  id: string;
  type: 'ARTICLE' | 'IMAGE_OCR' | 'LINK' | 'DOCUMENT';
  title: string;
  content: string;
  sourceUrl?: string;
  timestamp: string;
  tags: string[];
}

export interface SearchResult {
  summary: string;
  sources: { title: string; uri: string }[];
}

export interface HistoryEntry {
  id: string;
  type: 'TOPIC_VIEW' | 'QUIZ_COMPLETE' | 'INSIGHT_GEN';
  timestamp: string;
  topicId: number;
  topicLabel: string;
  details?: string;
}

export interface Topic {
  topic_id: number;
  group_id: number;
  group_title: string;
  tag_level: TagLevel;
  keyword_label: string;
  short_label: string;
  full_text: string;
  mastery_percent: number;
  scale: number;
  delta: number;
  attempts_count: number;
  avg_time_sec: number;
  competency_scores: CompetencyScores;
  last_attempt_at: string | null;
  error_tags: string[];
  pinned: boolean;
  history_mastery: {
    day: number;
    week: number;
    month: number;
    three_months: number;
  };
  icon: string;
  color: string;
  pulse_type?: 'correct' | 'decay' | 'achievement' | 'marble' | null;
  pokemon_id?: string | null;
  infographic_url?: string;
  deadline?: string; 
  binary_map?: string; 
  ai_verdict?: string;
  knowledge_ledger?: KnowledgeRecord[];
  personal_assets?: KnowledgeAsset[];
  notes?: string;
}

export interface ArenaStats {
  star_level: number;
  matches_played: number;
  best_accuracy: number;
  last_match_at: string | null;
  last_result: {
    correct_count: number;
    wrong_count: number;
    accuracy: number;
  } | null;
}

export interface BaseStudent {
  id: string;
  name: string;
  className: string;
  school: string;
  avatar: string;
  goal: StudyGoal;
  rank: RankLevel;
  rankPoints: number;
  status: 'Đang ôn' | 'Dừng';
  joinDate: string;
}

export interface BaseProgress {
  taskId: string;
  studentId: string;
  topicId: number;
  status: 'Mới giao' | 'Đang làm' | 'Hoàn thành' | 'Trễ hạn';
  mastery: number;
  scores: CompetencyScores;
  attachmentUrl: string;
  updatedAt: string;
  teacherNote: string;
  knowledgeLedger?: KnowledgeRecord[];
}

export interface UserProfile {
  school: string;
  level: string;
  fullName?: string;
  className?: string;
  goal?: StudyGoal;
  role: 'STUDENT' | 'TEACHER';
  rank: RankLevel;
  rankPoints: number;
  streak: number;
  preferences: UIPreferences;
  teacherWalletId?: string;
}

export interface AppState {
  user_profile: UserProfile;
  timeframe: Timeframe;
  topics: Topic[];
  pokemon_collection: any[];
  session_log: HistoryEntry[];
  missions: any[];
  has_started?: boolean;
  view_mode: 'STUDENT_CANVAS' | 'TEACHER_DASHBOARD' | 'ARENA_MODE' | 'MATRIX_VIEW' | 'STRATEGY_HUB';
  decodedTopicIds?: number[];
  baseStudents?: BaseStudent[];
  baseProgress?: BaseProgress[];
}

export interface Question {
  qid: string;
  topic_id: string;
  skill_tag: TagLevel;
  type: 'MCQ' | 'TF' | 'FILL';
  difficulty: number;
  prompt: string;
  choices?: Record<string, string>; 
  answer_key: string; 
  explain: string;
}

export interface QuizSession {
  topic_id: number;
  type: 'Luyện 10' | 'Luyện 25' | 'ARENA_COMBAT' | 'MISSION' | GeoSkill;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  time_limit_seconds?: number;
}
