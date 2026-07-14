export interface ChronoEvent {
  title: string;
  date: string;
  desc: string;
}

export interface ImageMetadata {
  caption: string;
  author: string;
  date: string;
  place: string;
  archiveId: string;
  category: string;
  detailedContext?: string;
}

export interface Milestone {
  id: string;
  year: string;
  title: string;
  subTitle?: string;
  brief: string;
  content: string;
  image?: string;
  imageMetadata?: ImageMetadata;
  details?: {
    narrative?: string;
    points?: string[];
    interactiveType?: "ballot" | "limitations4" | "breakthroughs" | "borderMap" | "limitations5" | "couponBook" | "politburo";
    chronoEvents?: ChronoEvent[];
    extraNarrative?: string;
  };
}

export interface DragItem {
  id: string;
  text: string;
  correctChest: "bao_cap" | "hach_toan";
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CollaborativeTask {
  role: "ai" | "human";
  title: string;
  details: string[];
}

export interface GalleryImage {
  id: string;
  src: string;
  title: string;
  caption: string;
  author: string;
  date: string;
  place: string;
  archiveId: string;
  category: string;
  detailedContext: string;
}

export interface FamilyStory {
  id: string;
  author: string;
  relation: string;
  title: string;
  content: string;
  tag: "🎫 Tem phiếu" | "🚲 Đời sống" | "🗳️ Sự kiện" | "💡 Đổi mới";
  color: "cream" | "yellow" | "mint" | "pink";
  likes: number;
  date: string;
  isCustom?: boolean;
  stamp?: "ticket" | "bicycle" | "radio" | "letter" | "vote";
}

