import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, 
  ArrowDown, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Award, 
  Activity, 
  FileText, 
  ChevronRight, 
  RotateCcw, 
  Info, 
  Vote, 
  Building, 
  TrendingUp, 
  MapPin, 
  HelpCircle, 
  Sparkles, 
  Check, 
  X,
  BookOpen,
  ArrowRight,
  Shield,
  Zap,
  Target,
  Bot,
  UserCheck,
  Pin,
  Heart,
  Trash2,
  MessageSquare,
  Bike,
  Radio as RadioIcon,
  Mail,
  Ticket,
  Download,
  Upload,
  Settings,
  Key,
  Database,
  AlertCircle
} from "lucide-react";
import { MILESTONES, DRAG_ITEMS, QUIZ_QUESTIONS, COLLABORATIVE_TASKS, GALLERY_IMAGES, INITIAL_STORIES } from "./data";
import { DragItem, GalleryImage, FamilyStory } from "./types";
import { db, isFirebaseEnabled, firebaseConfig, saveCustomFirebaseConfig, clearCustomFirebaseConfig } from "./firebase";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export default function App() {
  // Theme & Layout state
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelYear, setTravelYear] = useState(2026);
  const [hasTraveled, setHasTraveled] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "timeline" | "gallery" | "stories" | "interactive" | "report">("home");
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  // Family Stories state with LocalStorage persistence
  const [stories, setStories] = useState<FamilyStory[]>(() => {
    const saved = localStorage.getItem("vnr201_family_stories");
    return saved ? JSON.parse(saved) : INITIAL_STORIES;
  });

  // Selected tag/type filter for Story Wall
  const [selectedStoryFilter, setSelectedStoryFilter] = useState<string>("Tất cả");

  // Form key to force re-mount after submit (resets radio defaultChecked values)
  const [storyFormKey, setStoryFormKey] = useState(0);

  // Toast notification after pinning
  const [storyToastMsg, setStoryToastMsg] = useState<string | null>(null);

  // Ref to auto-scroll to corkboard after submit
  const corkboardRef = useRef<HTMLDivElement>(null);

  // Save stories changes to local storage and broadcast across tabs for instant realtime sync
  useEffect(() => {
    localStorage.setItem("vnr201_family_stories", JSON.stringify(stories));
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel("vnr201_family_stories_channel");
        channel.postMessage({ type: "STORIES_UPDATED", stories });
        channel.close();
      } catch (err) {
        // Ignore BroadcastChannel errors in unsupported environments
      }
    }
  }, [stories]);

  // Cross-tab realtime synchronization for offline/LocalStorage fallback mode
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "vnr201_family_stories" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setStories(parsed);
          }
        } catch (err) {
          console.error("Storage sync error:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("vnr201_family_stories_channel");
      channel.onmessage = (event) => {
        if (event.data && event.data.type === "STORIES_UPDATED" && Array.isArray(event.data.stories)) {
          setStories(event.data.stories);
        }
      };
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (channel) channel.close();
    };
  }, []);

  // Firebase Firestore realtime synchronization
  useEffect(() => {
    if (!isFirebaseEnabled || !db) return;

    try {
      const q = query(collection(db, "stories"), orderBy("timestamp", "desc"));
      // Listen with includeMetadataChanges so optimistic local writes appear instantly without waiting for network
      const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, async (snapshot) => {
        if (snapshot.empty) {
          // Firestore is empty! Seed with INITIAL_STORIES to provide sample data immediately
          console.log("Seeding empty Cloud Firestore collection 'stories'...");
          const colRef = collection(db, "stories");
          for (const item of INITIAL_STORIES) {
            try {
              await addDoc(colRef, {
                author: item.author,
                relation: item.relation,
                title: item.title,
                content: item.content,
                tag: item.tag,
                color: item.color,
                stamp: item.stamp || "default",
                likes: item.likes,
                date: item.date,
                timestamp: serverTimestamp()
              });
            } catch (err) {
              console.error("Failed to seed story:", err);
            }
          }
          return;
        }

        const firebaseStories: any[] = [];
        snapshot.forEach((docSnap) => {
          // Estimate serverTimestamps on pending optimistic writes so new posts don't have null timestamp
          const data = docSnap.data({ serverTimestamps: "estimate" });
          let timeMs = Date.now();
          if (data.timestamp && typeof data.timestamp.toMillis === "function") {
            timeMs = data.timestamp.toMillis();
          } else if (data.timestamp instanceof Date) {
            timeMs = data.timestamp.getTime();
          } else if (typeof data.timestamp === "number") {
            timeMs = data.timestamp;
          }

          firebaseStories.push({
            id: docSnap.id,
            author: data.author || "",
            relation: data.relation || "",
            title: data.title || "",
            content: data.content || "",
            tag: data.tag || "🎫 Tem phiếu",
            color: data.color || "cream",
            stamp: data.stamp || "default",
            likes: typeof data.likes === "number" ? data.likes : 0,
            date: data.date || new Date().toLocaleDateString("vi-VN"),
            isCustom: true,
            _timeMs: timeMs
          });
        });

        // Ensure strictly sorted descending by timestamp/timeMs so newly posted items stay at top
        firebaseStories.sort((a, b) => (b._timeMs || 0) - (a._timeMs || 0));

        setStories(prev => {
          // Merge any unsynced local custom items that haven't appeared in Firestore yet
          const localOnly = prev.filter(p => p.id.startsWith("custom-") && !firebaseStories.some(fs => fs.title === p.title && fs.author === p.author && fs.content === p.content));
          return [...localOnly, ...firebaseStories];
        });
      }, (error) => {
        console.error("Firestore subscription error:", error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Failed to setup Firestore connection:", err);
    }
  }, []);

  // Gallery and Lightbox states
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState("Tất cả");
  const [activeLightboxImage, setActiveLightboxImage] = useState<GalleryImage | null>(null);

  // CRT TV Active Slide index state
  const [crtActiveImageIdx, setCrtActiveImageIdx] = useState(0);

  // Auto-slide effect for the CRT TV Mockup on the Homepage
  useEffect(() => {
    if (activeTab !== "home") return;
    const interval = setInterval(() => {
      setCrtActiveImageIdx((prev) => (prev + 1) % GALLERY_IMAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Red Archival Seal Component helper
  const renderArchivalSeal = (text: string, year: string) => (
    <div className="absolute top-3 right-3 flex items-center justify-center pointer-events-none select-none rotate-12 opacity-80 shrink-0 z-20">
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-500/80 flex flex-col items-center justify-center text-red-500/80 font-display font-black text-[8px] uppercase tracking-tighter bg-white/60 backdrop-blur-[0.5px] leading-none">
        <span>{text}</span>
        <span className="text-[6px] mt-0.5 border-t border-red-500/50 border-dashed pt-0.5 px-0.5">{year}</span>
      </div>
    </div>
  );

  // Milestone Image rendering helper
  const renderMilestoneImage = (milestoneId: string) => {
    const milestone = MILESTONES.find(m => m.id === milestoneId);
    if (!milestone || !milestone.image) return null;

    return (
      <div className="mt-4 mb-5 border border-retro-charcoal/20 rounded-xl overflow-hidden bg-retro-cream p-3 shadow-inner">
        <div className="relative group overflow-hidden border-2 border-retro-charcoal rounded-lg bg-[#faf7f0] shadow-sm">
          <img 
            src={milestone.image} 
            alt={milestone.imageMetadata?.caption || milestone.title}
            className="w-full h-auto max-h-[350px] object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
            onClick={() => {
              const galleryItem = GALLERY_IMAGES.find(img => img.src === milestone.image);
              if (galleryItem) {
                setActiveLightboxImage(galleryItem);
              } else if (milestone.imageMetadata) {
                // Ảnh không có trong gallery → tạo GalleryImage tạm từ imageMetadata
                setActiveLightboxImage({
                  id: milestone.id + "-lightbox",
                  src: milestone.image!,
                  title: milestone.title,
                  caption: milestone.imageMetadata.caption,
                  author: milestone.imageMetadata.author,
                  date: milestone.imageMetadata.date,
                  place: milestone.imageMetadata.place,
                  archiveId: milestone.imageMetadata.archiveId,
                  category: milestone.imageMetadata.category,
                  detailedContext: milestone.imageMetadata.detailedContext,
                });
              }
            }}
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-center">
            <span className="bg-retro-charcoal/90 text-white font-display text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/20 shadow-md flex items-center gap-1">
              🔍 Xem phóng to tư liệu
            </span>
          </div>
          <span className="absolute bottom-2 right-2 bg-retro-charcoal/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm">
            {milestone.imageMetadata?.archiveId}
          </span>
        </div>
        {milestone.imageMetadata && (
          <div className="mt-2.5 text-xs font-sans text-retro-gray leading-relaxed">
            <div className="font-semibold text-retro-charcoal flex items-start gap-1 font-sans text-[12.5px] leading-relaxed">
              <span>🖼️</span>
              <span>{milestone.imageMetadata.caption}</span>
            </div>
            <div className="mt-2 pt-1.5 border-t border-dashed border-retro-border flex items-center justify-between font-mono text-[8px] text-retro-gray uppercase tracking-wider">
              <span>Nguồn: {milestone.imageMetadata.author}</span>
              <span>Ký hiệu: {milestone.imageMetadata.archiveId}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Time machine activation helper
  const activateTimeMachine = () => {
    setIsTraveling(true);
    let currentYear = 2026;
    const interval = setInterval(() => {
      currentYear -= 3;
      if (currentYear <= 1975) {
        currentYear = 1975;
        clearInterval(interval);
        setTimeout(() => {
          setIsTraveling(false);
          setHasTraveled(true);
          setActiveTab("timeline");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 800);
      }
      setTravelYear(currentYear);
    }, 120);
  };

  // Story handlers
  const handleAddStory = async (newStory: { author: string; relation: string; title: string; content: string; tag: any; color: any; stamp: any }) => {
    const cleanAuthor = (newStory.author || "").trim();
    const cleanTitle = (newStory.title || "").trim();
    const cleanContent = (newStory.content || "").trim();
    const cleanRelation = newStory.relation || "Lời kể của Ông ngoại";
    const cleanTag = newStory.tag || "🎫 Tem phiếu";
    const cleanColor = newStory.color || "cream";
    const cleanStamp = newStory.stamp || "default";

    // Always add to local state IMMEDIATELY for instant UI feedback
    const story: FamilyStory = {
      author: cleanAuthor,
      relation: cleanRelation,
      title: cleanTitle,
      content: cleanContent,
      tag: cleanTag,
      color: cleanColor,
      stamp: cleanStamp,
      id: "custom-" + Date.now(),
      likes: 0,
      date: new Date().toLocaleDateString("vi-VN"),
      isCustom: true
    };
    setStories(prev => [story, ...prev]);

    // Send to Firebase immediately if enabled
    if (isFirebaseEnabled && db) {
      try {
        await addDoc(collection(db, "stories"), {
          author: cleanAuthor,
          relation: cleanRelation,
          title: cleanTitle,
          content: cleanContent,
          tag: cleanTag,
          color: cleanColor,
          stamp: cleanStamp,
          likes: 0,
          date: story.date,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error("Firebase write failed:", err);
      }
    }
  };

  const handleLikeStory = async (id: string) => {
    // Optimistically update UI first
    setStories(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, likes: (s.likes || 0) + 1 };
      }
      return s;
    }));

    if (isFirebaseEnabled && db && !id.startsWith("custom-") && !id.startsWith("imported-")) {
      try {
        const storyRef = doc(db, "stories", id);
        const target = stories.find(s => s.id === id);
        if (target) {
          await updateDoc(storyRef, { likes: (target.likes || 0) + 1 });
        }
      } catch (err) {
        console.error("Failed to like story in Firebase:", err);
      }
    }
  };

  const handleDeleteStory = async (id: string) => {
    // Optimistically remove from local state immediately
    setStories(prev => prev.filter(s => s.id !== id));

    if (isFirebaseEnabled && db && !id.startsWith("custom-") && !id.startsWith("imported-")) {
      try {
        const storyRef = doc(db, "stories", id);
        await deleteDoc(storyRef);
      } catch (err) {
        console.error("Failed to delete story from Firebase:", err);
      }
    }
  };

  // Export custom stories as JSON file
  const handleExportStories = () => {
    const customStories = stories.filter(s => s.isCustom);
    if (customStories.length === 0) {
      alert("Bạn chưa đăng ký bất kỳ câu chuyện tự tạo nào để xuất dữ liệu!");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customStories, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "ky_uc_bao_cap_vnr201.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import custom stories from JSON file
  const handleImportStories = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          alert("Định dạng file không hợp lệ! File import phải là một mảng danh sách câu chuyện.");
          return;
        }
        
        const validStories: FamilyStory[] = parsed.filter((s: any) => {
          return s && typeof s.title === "string" && typeof s.content === "string" && typeof s.author === "string";
        }).map((s: any) => ({
          ...s,
          id: "imported-" + s.id + "-" + Date.now(),
          isCustom: true // Ensure they are marked custom
        }));

        if (validStories.length === 0) {
          alert("Không tìm thấy câu chuyện nào hợp lệ trong tệp tải lên.");
          return;
        }

        // If Firebase is active, import directly into Cloud Firestore
        if (isFirebaseEnabled && db) {
          const colRef = collection(db, "stories");
          for (const s of validStories) {
            try {
              await addDoc(colRef, {
                author: s.author,
                relation: s.relation,
                title: s.title,
                content: s.content,
                tag: s.tag,
                color: s.color,
                stamp: s.stamp || "default",
                likes: s.likes,
                date: s.date,
                timestamp: new Date()
              });
            } catch (err) {
              console.error("Failed to import story to Firebase:", err);
            }
          }
          alert(`Đã nhập thành công ${validStories.length} câu chuyện ký ức lên Cloud Firestore!`);
          return;
        }

        setStories(prev => {
          const filteredPrev = prev.filter(p => !validStories.some(v => v.title === p.title && v.content === p.content));
          return [...validStories, ...filteredPrev];
        });
        alert(`Đã nhập thành công ${validStories.length} câu chuyện ký ức vào bảng tin cục bộ!`);
      } catch (err) {
        alert("Lỗi đọc file! Vui lòng kiểm tra lại cấu trúc file JSON.");
      }
    };
    fileReader.readAsText(file);
    e.target.value = "";
  };

  // Milestone interactive states
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  const toggleMilestone = (id: string) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Milestone 1 ballot step
  const [activeBallotStep, setActiveBallotStep] = useState(0);
  const [hasCompletedMilestoneV, setHasCompletedMilestoneV] = useState(false);

  useEffect(() => {
    if (activeBallotStep === 4) {
      setHasCompletedMilestoneV(true);
    }
  }, [activeBallotStep]);

  // Milestone 2 limitations toggle
  const [showM2Limitations, setShowM2Limitations] = useState(false);

  // Milestone 3 breakthrough active tab
  const [activeBreakthroughTab, setActiveBreakthroughTab] = useState(0);

  // Milestone 4 Border area selection
  const [activeBorderArea, setActiveBorderArea] = useState<"tay_nam" | "phia_bac" | null>("tay_nam");

  // Milestone 5 limitations toggle
  const [showM5Limitations, setShowM5Limitations] = useState(false);

  // Milestone 6 Coupon Booklet toggle
  const [couponDecongested, setCouponDecongested] = useState(false);

  // Drag and Drop Game State
  const [sortedCards, setSortedCards] = useState<Record<string, "pending" | "bao_cap" | "hach_toan">>({});
  const [gameScore, setGameScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [wrongFeedbackId, setWrongFeedbackId] = useState<string | null>(null);

  // Drag handlers (HTML5)
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetChest: "bao_cap" | "hach_toan") => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    sortCard(itemId, targetChest);
  };

  // Dynamic sorter logic
  const sortCard = (itemId: string, chest: "bao_cap" | "hach_toan") => {
    const item = DRAG_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (item.correctChest === chest) {
      if (sortedCards[itemId] !== chest) {
        setSortedCards(prev => ({ ...prev, [itemId]: chest }));
        setGameScore(prev => prev + 1);
      }
    } else {
      // Show error feedback
      setWrongFeedbackId(itemId);
      setTimeout(() => setWrongFeedbackId(null), 800);
    }
  };

  // Check if game complete
  useEffect(() => {
    const sortedCount = Object.keys(sortedCards).length;
    if (sortedCount === DRAG_ITEMS.length) {
      setGameFinished(true);
    }
  }, [sortedCards]);

  const resetGame = () => {
    setSortedCards({});
    setGameScore(0);
    setGameFinished(false);
  };

  // Multiple Choice Quiz State
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizCumulativeScore, setQuizCumulativeScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleQuizOptionClick = (optionIdx: number) => {
    if (quizSubmitted) return;
    setQuizSelectedOption(optionIdx);
  };

  const submitQuizAnswer = () => {
    if (quizSelectedOption === null || quizSubmitted) return;
    setQuizSubmitted(true);
    if (quizSelectedOption === QUIZ_QUESTIONS[currentQuizIdx].correctAnswer) {
      setQuizCumulativeScore(prev => prev + 1);
    }
  };

  const nextQuizQuestion = () => {
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
    if (currentQuizIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuizIdx(0);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
    setQuizCumulativeScore(0);
    setQuizCompleted(false);
  };



  return (
    <div id="root-container" className="min-h-screen bg-retro-cream text-retro-charcoal selection:bg-retro-orange selection:text-white relative overflow-x-hidden">
      
      {/* TIME TRAVEL SHIP EFFECT OVERLAY */}
      <AnimatePresence>
        {isTraveling && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#12131A] text-white flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background cyber grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#E03E3E_1px,transparent_1px)] [background-size:16px_16px] opacity-20 animate-pulse"></div>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center relative z-10 px-4"
            >
              <div className="w-24 h-24 bg-retro-red rounded-full mx-auto flex items-center justify-center mb-6 border border-white/20 animate-ping absolute -top-4 left-1/2 -transform -translate-x-1/2 opacity-30"></div>
              <div className="w-20 h-20 bg-retro-red rounded-full mx-auto flex items-center justify-center mb-6 border-2 border-white relative z-20 shadow-xl">
                <Clock className="w-10 h-10 text-white animate-spin" />
              </div>
              
              <h2 className="text-xl font-mono text-retro-orange tracking-widest uppercase mb-2">
                Kích hoạt cỗ máy thời gian
              </h2>
              
              <div className="text-7xl md:text-8xl font-display font-extrabold tracking-tighter my-4 text-white drop-shadow-lg">
                {travelYear}
              </div>
              
              <p className="text-sm text-yellow-200 uppercase tracking-wider max-w-sm mx-auto mt-2 font-mono">
                {travelYear > 1986 ? "Duyệt qua các giai đoạn hiện đại" : "Đang tiến vào thời kỳ tiền Đổi Mới"}
              </p>

              <div className="mt-8 space-y-1 text-xs text-gray-400 font-mono">
                <div>THIẾT LẬP KINH TẾ TRUNG ƯƠNG BAO CẤP... 100%</div>
                <div>ĐANG TRUY LỤC BIÊN NIÊN SỬ CHỦ NGHĨA XÃ HỘI...</div>
                <div className="text-retro-mint">ĐIỂM ĐẾN KHÓA: NĂM 1975</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER RAIL - INFO */}
      <header className="sticky top-0 z-40 bg-retro-cream/95 backdrop-blur-md border-b-2 border-retro-border/80 px-4 py-3 sm:px-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Left Side: Brand Logo & Title */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="w-8 h-8 rounded bg-retro-red flex items-center justify-center text-white font-display font-extrabold text-sm shadow-sm select-none">
            🇻🇳
          </div>
          <div>
            <h1 className="text-sm font-display font-bold tracking-tight text-retro-charcoal sm:text-base leading-none">
              HÀNH TRÌNH ĐỔI MỚI <span className="text-retro-red">1975 - 1986</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-retro-gray font-mono hidden sm:block mt-0.5">
              Tư liệu lịch sử Đảng & bước chuyển đổi tư duy kinh tế Việt Nam
            </p>
          </div>
        </div>

        {/* Right Side: Tabs list */}
        <nav className="flex items-center gap-2.5 overflow-x-auto w-full md:w-auto py-2.5 px-1.5 scrollbar-none snap-x snap-mandatory">
          {[
            { id: "home", label: "Trang chủ" },
            { id: "timeline", label: "Dòng lịch sử" },
            { id: "gallery", label: "Tư liệu ảnh" },
            { id: "stories", label: "Bảng ký ức" },
            { id: "interactive", label: "Khu ôn tập" },
            { id: "report", label: "Báo cáo đề án" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id as any); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold border-2 transition-all cursor-pointer whitespace-nowrap snap-align-start ${
                activeTab === t.id
                  ? "bg-retro-red text-white border-retro-charcoal shadow-[3px_3px_0px_#1e1f22] -translate-y-0.5 scale-102"
                  : "bg-white text-retro-charcoal border-retro-charcoal shadow-[2px_2px_0px_rgba(30,31,34,0.12)] hover:border-retro-charcoal hover:bg-[#FEFDF9] hover:shadow-[3px_3px_0px_#1e1f22] hover:-translate-y-0.5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* HERO SECTION / TẦNG 1 */}
      {activeTab === "home" && (
        <section className="relative min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 border-b-4 border-retro-charcoal bg-[radial-gradient(rgba(224,62,62,0.04)_1.5px,transparent_1.5px)] [background-size:24px_24px] flex flex-col justify-center">
          {/* Dynamic decorative backdrop circles representing historical spotlight */}
          <div className="absolute top-1/4 right-[-10%] w-96 h-96 rounded-full bg-retro-orange/5 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 left-[-5%] w-80 h-80 rounded-full bg-retro-yellow/10 blur-3xl pointer-events-none"></div>

          <div className="max-w-6xl mx-auto w-full">
            
            {/* Two-Column Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left Column: Title, description, quote and stats */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                {/* Historical flag label */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-retro-red/10 border-2 border-retro-red/30 mb-6 select-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-retro-red animate-ping"></span>
                  <span className="text-xs font-mono font-extrabold text-retro-red tracking-widest uppercase">
                    Tài liệu chuyên đề học tập & tương tác
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-retro-charcoal leading-none mb-4 uppercase">
                  HÀNH TRÌNH ĐỔI MỚI
                  <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-retro-red to-retro-orange">
                    1975 — 1986
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-retro-gray max-w-xl leading-relaxed mb-6 font-sans font-light">
                  Trải nghiệm hành trình lịch sử Đảng Cộng sản Việt Nam đầy quả cảm. Tái hiện sống động từ việc hoàn thành thống nhất đất nước về mặt Nhà nước, bảo vệ vững chắc biên cương Tổ quốc đến bước chuyển đổi tư duy kinh tế xóa bao cấp bứt phá ngoạn mục.
                </p>

                {/* Historical Quote Block */}
                <div className="border-l-4 border-retro-red pl-4 py-2 bg-retro-red/5 rounded-r-lg max-w-xl text-left select-none mb-6">
                  <p className="text-xs italic font-sans text-retro-charcoal leading-relaxed">
                    "Nhìn thẳng vào sự thật, đánh giá đúng sự thật, nói rõ sự thật để đổi mới tư duy và kiến thiết đất nước."
                  </p>
                  <span className="text-[9px] font-mono text-retro-red uppercase tracking-wider block mt-1 font-bold">— Báo cáo chính trị Ban Chấp hành Trung ương, Đại hội VI (1986)</span>
                </div>

                {/* Activation button */}
                <div className="mb-8 w-full sm:w-auto">
                  <button
                    onClick={activateTimeMachine}
                    className="w-full sm:w-auto px-8 py-3.5 bg-retro-red hover:bg-retro-red-dark text-white font-display font-bold text-base rounded-xl shadow-[4px_4px_0px_#1e1f22] border-2 border-retro-charcoal transition-all active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#1e1f22] flex items-center justify-center gap-3 group cursor-pointer"
                  >
                    <Zap className="w-5 h-5 text-retro-yellow group-hover:scale-125 transition-transform" />
                    KÍCH HOẠT CỖ MÁY THỜI GIAN
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Project stats counters grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-dashed border-retro-border w-full max-w-xl text-left select-none">
                  {[
                    { val: "06", desc: "Mốc sử liệu cốt lõi" },
                    { val: "100%", desc: "Dữ liệu Đảng chuẩn" },
                    { val: "08", desc: "Ảnh hiện vật quý" },
                    { val: "02", desc: "Thử thách ôn tập" }
                  ].map((stat, idx) => (
                    <div key={idx} className="border-r border-dashed border-retro-border last:border-r-0 pr-2">
                      <div className="text-xl md:text-2xl font-display font-black text-retro-red leading-none">{stat.val}</div>
                      <div className="text-[9px] text-retro-gray font-mono mt-1.5 leading-tight uppercase font-semibold">{stat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Vintage CRT TV Image Slideshow Mockup */}
              <div className="lg:col-span-5 w-full">
                <div className="bg-[#8C6D58] border-4 border-retro-charcoal rounded-3xl p-4 shadow-[6px_6px_0px_#1e1f22] relative w-full aspect-[4/3] max-w-md mx-auto overflow-hidden">
                  {/* Outer wooden border styling details */}
                  <div className="absolute top-2 left-4 text-[9px] font-mono text-amber-950 uppercase tracking-widest font-extrabold opacity-60 select-none">TELEVISION RECEIVER MODEL 1980</div>
                  <div className="absolute top-2 right-4 flex gap-1 items-center select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-950 opacity-40"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-950 opacity-40"></span>
                  </div>

                  <div className="w-full h-full flex bg-[#2D2E30] rounded-xl p-2.5 border-3 border-retro-charcoal shadow-inner justify-between items-stretch gap-2.5">
                    
                    {/* TV Screen Casing */}
                    <div className="flex-1 bg-black rounded-lg relative overflow-hidden border-2 border-retro-charcoal flex items-center justify-center">
                      
                      {/* Scanlines Sweep Layer */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-20 animate-scanline"></div>
                      
                      {/* CRT Screen Glow tint */}
                      <div className="absolute inset-0 bg-retro-mint/5 pointer-events-none mix-blend-overlay z-20"></div>

                      {/* Screen Glass glare overlay */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_60%)] pointer-events-none z-20"></div>

                      {/* Slideshow of images */}
                      <div className="w-full h-full relative z-10 flex items-center justify-center bg-zinc-900">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={crtActiveImageIdx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="w-full h-full relative"
                          >
                            <img
                              src={GALLERY_IMAGES[crtActiveImageIdx].src}
                              alt={GALLERY_IMAGES[crtActiveImageIdx].title}
                              className="w-full h-full object-cover opacity-90 contrast-110 saturate-110"
                            />
                            
                            {/* Slide description label overlay at the bottom */}
                            <div className="absolute bottom-0 inset-x-0 bg-black/85 border-t border-retro-charcoal p-1.5 text-center">
                              <p className="text-[9px] font-mono text-retro-mint truncate uppercase font-bold tracking-wider">
                                📺 {GALLERY_IMAGES[crtActiveImageIdx].title} ({GALLERY_IMAGES[crtActiveImageIdx].date})
                              </p>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                    </div>

                    {/* TV Physical Control Panel */}
                    <div className="w-12 bg-[#3E3F40] border-2 border-retro-charcoal rounded-md p-1.5 flex flex-col justify-between items-center select-none shadow-sm">
                      
                      {/* Speaker grill dashes */}
                      <div className="w-full space-y-1 mt-1 opacity-80">
                        <div className="h-0.5 w-full bg-retro-charcoal"></div>
                        <div className="h-0.5 w-full bg-retro-charcoal"></div>
                        <div className="h-0.5 w-full bg-retro-charcoal"></div>
                        <div className="h-0.5 w-full bg-retro-charcoal"></div>
                        <div className="h-0.5 w-full bg-retro-charcoal"></div>
                      </div>

                      {/* Channel dial knobs */}
                      <div className="flex flex-col items-center gap-1.5">
                        {/* Knob 1 */}
                        <div className="w-7 h-7 rounded-full bg-retro-charcoal border-2 border-[#5A5C5E] flex items-center justify-center shadow-md relative">
                          <div className="w-1 h-3 bg-white absolute top-0.5 rounded-full rotate-45 transform origin-bottom"></div>
                        </div>
                        
                        {/* Knob 2 */}
                        <div className="w-7 h-7 rounded-full bg-retro-charcoal border-2 border-[#5A5C5E] flex items-center justify-center shadow-md relative">
                          <div className="w-1 h-3 bg-white absolute top-0.5 rounded-full -rotate-12 transform origin-bottom"></div>
                        </div>
                      </div>

                      {/* Power switch & Indicator light */}
                      <div className="flex flex-col items-center gap-1 pb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-black shadow-[0_0_4px_#ef4444] animate-pulse"></div>
                        <span className="text-[7px] font-mono text-[#FCF9F2] uppercase opacity-70">POWER</span>
                      </div>

                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Onboarding Steps Section */}
            <div className="mt-16 pt-10 border-t-2 border-retro-charcoal/20">
              <h3 className="text-center font-display font-black text-base md:text-lg text-retro-charcoal uppercase tracking-wider mb-8 flex items-center justify-center gap-2 select-none">
                <Sparkles className="w-4 h-4 text-retro-red" />
                Hướng dẫn lộ trình trải nghiệm học tập
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: "01", title: "Du hành thời gian", desc: "Bấm nút khởi động máy để cỗ máy thời gian đưa bạn lùi về năm 1975 để bắt đầu hành trình." },
                  { step: "02", title: "Khám phá sử liệu", desc: "Xem chi tiết biên niên sử 1975-1986, lật xem hiện vật mậu dịch và chia sẻ kỷ niệm gia đình." },
                  { step: "03", title: "Kiểm tra nhận thức", desc: "Chinh phục thử thách phân loại chính sách kinh tế và hoàn thành bài trắc nghiệm nhanh sử Đảng." }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border-2 border-retro-charcoal rounded-xl p-5 shadow-[3px_3px_0px_#1e1f22] relative transition-transform hover:-translate-y-0.5 select-none">
                    <span className="absolute top-[-14px] left-5 px-2 bg-retro-red text-white font-mono text-xs font-bold border-2 border-retro-charcoal rounded">Bước {item.step}</span>
                    <h4 className="font-display font-bold text-sm uppercase text-retro-charcoal mb-1.5 mt-2">{item.title}</h4>
                    <p className="text-xs text-retro-gray leading-relaxed font-sans">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* CORE HISTORICAL SECTIONS CONTAINER */}
      {activeTab === "timeline" && (
        <main id="timeline-section" className="relative py-16 px-4 md:px-8 max-w-6xl mx-auto">
        <h2 className="text-center font-display font-extrabold text-3xl md:text-5xl uppercase text-retro-charcoal tracking-tight mb-4">
          Xây dựng chủ nghĩa xã hội và bảo vệ Tổ quốc (1975-1986)
        </h2>
        <p className="text-center text-retro-gray max-w-xl mx-auto mb-16 text-sm sm:text-base">
          Nhấn để mở rộng chi tiết các mốc lịch sử chính yếu. Các thông tin được thẩm tra 100% dựa trên tài liệu lịch sử Đảng Cộng sản Việt Nam.
        </p>

        {/* TIMELINE CONTAINER STUCK Y-AXIS */}
        <div className="relative">
          {/* Vertical central path line */}
          <div className="absolute left-4 md:left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-retro-red via-retro-orange to-retro-mint transform md:-translate-x-1/2 z-0"></div>

          {/* Render individual Milestones sequentially according to chronology */}
          <div className="space-y-16">
            
            {/* MILESTONE 1 */}
            <div className="relative z-10 flex flex-col md:flex-row items-stretch gap-6 md:gap-0">
              {/* Year indicator left */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="md:w-1/2 flex justify-start md:justify-end md:pr-12 md:pt-4"
              >
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-retro-red text-white font-display font-bold text-xl md:text-2xl rounded shadow-[3px_3px_0px_#1e1f22] border-2 border-retro-charcoal select-none">
                    1975 - 1976
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-retro-red border-4 border-retro-cream ring-2 ring-retro-red scale-110 hidden md:block"></span>
                </div>
              </motion.div>

              {/* Box middle content */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                className="md:w-1/2 pl-4 md:pl-12"
              >
                <div className="bg-white border-2 border-retro-charcoal rounded-xl shadow-[6px_6px_0px_rgba(30,31,34,0.1)] hover:shadow-[6px_6px_0px_rgba(224,62,62,0.15)] transition-all p-6 relative">
                  {renderArchivalSeal("QUỐC GIA", "1976")}
                  
                  {/* Clickable Header Area */}
                  <div 
                    onClick={() => toggleMilestone("milestone-1")}
                    className="cursor-pointer select-none group flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      {/* Decorative corner paperclip */}
                      <div className="text-xs font-mono text-retro-red flex items-center gap-1 uppercase mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-retro-red"></span>
                        Mốc 1
                      </div>

                      <h3 className="text-xl md:text-2xl font-display font-bold text-retro-charcoal tracking-tight group-hover:text-retro-red transition-colors">
                        Hoàn thành thống nhất đất nước về mặt nhà nước
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-retro-charcoal bg-retro-cream text-retro-charcoal group-hover:bg-retro-red group-hover:text-white transition-colors shrink-0 mt-4 md:mt-1">
                      <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${expandedMilestones["milestone-1"] ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  <AnimatePresence initial={false}>
                    {expandedMilestones["milestone-1"] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-base text-retro-gray leading-relaxed mb-4">
                          {MILESTONES[0].brief}
                        </p>

                        <div className="bg-retro-cream p-4 rounded-lg border border-retro-border text-sm text-retro-charcoal leading-relaxed mb-5">
                          <strong className="text-retro-charcoal block mb-1 font-semibold">Nội dung kế hoạch:</strong>
                          {MILESTONES[0].content}
                        </div>

                        {renderMilestoneImage("milestone-1")}

                        {/* INTERACTIVE TAP TRIGGER: BALLOT BOX */}
                        <div className="bg-retro-yellow-light border-2 border-dashed border-retro-yellow rounded-xl p-5 mb-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-retro-yellow border border-retro-charcoal flex items-center justify-center text-retro-charcoal shadow-sm">
                              <Vote className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-base font-display font-semibold text-retro-charcoal">
                                Tiến trình Thống nhất hành chính
                              </h4>
                              <p className="text-xs text-retro-gray uppercase tracking-wider font-mono">
                                Chọn các mốc sự kiện dưới đây để xem tư liệu chính thức
                              </p>
                            </div>
                          </div>

                          {/* Step buttons selector */}
                          <div className="grid grid-cols-5 gap-1 mb-4">
                            {["Mốc I", "Mốc II", "Mốc III", "Mốc IV", "Mốc V"].map((label, idx) => (
                              <button
                                key={label}
                                onClick={() => setActiveBallotStep(idx)}
                                className={`py-1.5 px-1 rounded text-xs font-mono font-bold border transition-all ${
                                  activeBallotStep === idx 
                                    ? "bg-retro-red text-white border-retro-charcoal shadow-sm" 
                                    : "bg-white text-retro-gray border-retro-border hover:bg-amber-50"
                                  }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Render active ballot step document content */}
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeBallotStep}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="bg-white rounded-lg border border-retro-border p-4 shadow-inner"
                            >
                              <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                                <span className="text-[10px] font-mono font-bold text-retro-red uppercase tracking-wider">
                                  {MILESTONES[0].details?.chronoEvents?.[activeBallotStep].date}
                                </span>
                                <span className="text-[10px] font-mono bg-retro-cream px-1.5 py-0.5 rounded text-retro-gray">
                                  Hồ sơ lưu trữ
                                </span>
                              </div>
                              <h5 className="font-display font-bold text-base text-retro-charcoal mb-1">
                                {MILESTONES[0].details?.chronoEvents?.[activeBallotStep].title}
                              </h5>
                              <p className="text-sm text-retro-gray leading-relaxed whitespace-pre-line">
                                {MILESTONES[0].details?.chronoEvents?.[activeBallotStep].desc}
                              </p>
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        {/* MEANING & ACHIEVEMENTS PANEL */}
                        <AnimatePresence>
                          {hasCompletedMilestoneV && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.4 }}
                              className="border-t pt-4 mt-2 overflow-hidden"
                            >
                              <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-retro-red mb-2 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-retro-mint" />
                                Ý nghĩa thành tựu lịch sử:
                              </h4>
                              <p className="text-sm text-retro-gray leading-relaxed italic">
                                "Hoàn thành thống nhất nước nhà về mặt nhà nước là cơ sở vững chắc để thống nhất đất nước trên tất cả lĩnh vực khác, nhanh chóng tạo ra sức mạnh dân tộc tổng hợp; là điều kiện tiên quyết nhất để đưa cả nước hướng tới thời kỳ quá độ chủ nghĩa xã hội. Điều này chứng minh tư duy phản ứng chính trị nhạy bén của tập thể Đảng."
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </motion.div>
            </div>

            {/* MILESTONE 2 */}
            <div className="relative z-10 flex flex-col md:flex-row items-stretch gap-6 md:gap-0">
              
              {/* Box Content - Left on MD */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                className="md:w-1/2 pr-4 md:pr-12 order-2 md:order-1"
              >
                <div className="bg-white border-2 border-retro-charcoal rounded-xl shadow-[6px_6px_0px_rgba(30,31,34,0.1)] hover:shadow-[6px_6px_0px_rgba(224,62,62,0.15)] transition-all p-6 relative">
                  {renderArchivalSeal("ĐẠI HỘI IV", "12/1976")}
                  
                  {/* Clickable Header Area */}
                  <div 
                    onClick={() => toggleMilestone("milestone-2")}
                    className="cursor-pointer select-none group flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      {/* Decorative corner tag */}
                      <div className="text-xs font-mono text-retro-red flex items-center gap-1 uppercase mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-retro-red"></span>
                        Mốc 2
                      </div>

                      <h3 className="text-xl md:text-2xl font-display font-bold text-retro-charcoal tracking-tight group-hover:text-retro-red transition-colors">
                        {MILESTONES[1].title}
                      </h3>
                      {MILESTONES[1].subTitle && (
                        <p className="text-base text-retro-red font-semibold mt-1">
                          {MILESTONES[1].subTitle}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-retro-charcoal bg-retro-cream text-retro-charcoal group-hover:bg-retro-red group-hover:text-white transition-colors shrink-0 mt-4 md:mt-1">
                      <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${expandedMilestones["milestone-2"] ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  <AnimatePresence initial={false}>
                    {expandedMilestones["milestone-2"] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-base text-retro-gray leading-relaxed mb-4">
                          {MILESTONES[1].brief}
                        </p>

                        <p className="text-sm text-retro-gray bg-retro-cream border border-retro-border rounded-lg p-3 leading-relaxed mb-5 font-sans">
                          <strong className="text-retro-charcoal font-display">Nội dung cốt lõi:</strong> {MILESTONES[1].content}
                        </p>

                        {/* Highlights section rendering dynamic narrative */}
                        {MILESTONES[1].details?.narrative && (
                          <div className="space-y-3.5 mb-5">
                            <div className="text-xs font-mono text-retro-gray uppercase tracking-wider font-extrabold flex items-center gap-1.5 mb-2">
                              <BookOpen className="w-3.5 h-3.5 text-retro-red" />
                              Định hướng & Quyết sách Đại hội IV:
                            </div>
                            <div className="space-y-3">
                              {MILESTONES[1].details.narrative.split("\n\n").map((para, pIdx) => {
                                if (para.includes("đặc điểm lớn")) {
                                  return (
                                    <div key={pIdx} className="bg-gradient-to-r from-amber-50 to-orange-50/40 p-4 rounded-xl border border-retro-border border-l-4 border-l-retro-red shadow-[4px_4px_0px_rgba(230,57,70,0.06)] text-sm leading-relaxed text-retro-charcoal transition-all">
                                      <strong className="block font-display font-bold text-retro-red mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                        <Activity className="w-4 h-4 text-retro-red animate-pulse" />
                                        Ba đặc điểm cách mạng nước ta giai đoạn này:
                                      </strong>
                                      <div className="whitespace-pre-line tracking-wide font-sans text-retro-charcoal font-medium leading-relaxed">
                                        {para}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                const parts = para.split(": ");
                                if (parts.length > 1 && parts[0].length < 35) {
                                  return (
                                    <div key={pIdx} className="p-3.5 rounded-lg bg-orange-50/30 border border-retro-border text-sm">
                                      <strong className="block text-retro-charcoal mb-1 uppercase font-mono text-[11px]">
                                        {parts[0]}:
                                      </strong>
                                      <p className="text-retro-gray leading-relaxed font-sans">{parts.slice(1).join(": ")}</p>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={pIdx} className="p-3.5 rounded-lg bg-retro-cream border border-retro-border text-sm text-retro-gray leading-relaxed font-sans">
                                    {para}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* INTERACTIVE CLICK: REVEAL HISTORICAL LIMITATIONS */}
                        {MILESTONES[1].details?.extraNarrative && (
                          <div className="border border-retro-border rounded-xl overflow-hidden mt-4">
                            <button
                              onClick={() => setShowM2Limitations(!showM2Limitations)}
                              className="w-full text-left bg-orange-100 hover:bg-orange-200 transition-colors px-4 py-3 flex items-center justify-between border-b border-retro-border"
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4.5 h-4.5 text-retro-red" />
                                <span className="text-xs font-mono font-bold tracking-tight text-retro-charcoal uppercase">
                                  ⚠️ Xem các hạn chế mang tính lịch sử (1976)
                                </span>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-retro-gray transition-transform ${showM2Limitations ? "rotate-90" : ""}`} />
                            </button>

                            <AnimatePresence>
                              {showM2Limitations && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden bg-retro-cream text-retro-charcoal border-t border-retro-border"
                                >
                                  <div className="p-4 text-sm font-sans tracking-wide leading-relaxed space-y-2">
                                    {MILESTONES[1].details.extraNarrative.split("\n").map((line, lIdx) => {
                                      if (line.includes("• Nhận thức mô hình:")) {
                                        return (
                                          <p key={lIdx} className="leading-6 flex items-start gap-1">
                                            <span>•</span>
                                            <span>
                                              <span className="text-retro-red font-bold bg-retro-red/10 text-xs px-1.5 py-0.5 rounded border border-retro-red/20 mr-1 shadow-sm font-sans">Nhận thức mô hình:</span>
                                              <span className="text-retro-gray">{line.substring(line.indexOf("Nhận thức mô hình:") + "Nhận thức mô hình:".length)}</span>
                                            </span>
                                          </p>
                                        );
                                      }
                                      if (line.includes("• Mục tiêu và thời gian:")) {
                                        return (
                                          <p key={lIdx} className="leading-6 flex items-start gap-1">
                                            <span>•</span>
                                            <span>
                                              <span className="text-retro-red font-bold bg-retro-red/10 text-xs px-1.5 py-0.5 rounded border border-retro-red/20 mr-1 shadow-sm font-sans">Mục tiêu và thời gian:</span>
                                              <span className="text-retro-gray">{line.substring(line.indexOf("Mục tiêu và thời gian:") + "Mục tiêu và thời gian:".length)}</span>
                                            </span>
                                          </p>
                                        );
                                      }
                                      if (line.includes("• Chỉ tiêu kinh tế:")) {
                                        return (
                                          <p key={lIdx} className="leading-6 flex items-start gap-1">
                                            <span>•</span>
                                            <span>
                                              <span className="text-retro-red font-bold bg-retro-red/10 text-xs px-1.5 py-0.5 rounded border border-retro-red/20 mr-1 shadow-sm font-sans">Chỉ tiêu kinh tế:</span>
                                              <span className="text-retro-gray">{line.substring(line.indexOf("Chỉ tiêu kinh tế:") + "Chỉ tiêu kinh tế:".length)}</span>
                                            </span>
                                          </p>
                                        );
                                      }
                                      return (
                                        <p key={lIdx} className={line.startsWith("⚠️") ? "text-retro-orange font-bold text-xs uppercase tracking-widest pb-1 font-mono" : "text-retro-gray pl-3.5"}>
                                          {line}
                                        </p>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </motion.div>

              {/* Year indicator right */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="md:w-1/2 flex justify-start md:pl-12 md:pt-4 order-1 md:order-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-retro-red border-4 border-retro-cream ring-2 ring-retro-red scale-110 hidden md:block"></span>
                  <div className="px-4 py-2 bg-retro-red text-white font-display font-bold text-xl md:text-2xl rounded shadow-[3px_3px_0px_#1e1f22] border-2 border-retro-charcoal select-none">
                    1976
                  </div>
                </div>
              </motion.div>

            </div>

            {/* MILESTONE 3 */}
            <div className="relative z-10 flex flex-col md:flex-row items-stretch gap-6 md:gap-0">
              
              {/* Year indicator left */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="md:w-1/2 flex justify-start md:justify-end md:pr-12 md:pt-4"
              >
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-retro-orange text-white font-display font-bold text-xl md:text-2xl rounded shadow-[3px_3px_0px_#1e1f22] border-2 border-retro-charcoal select-none">
                    1979 - 1981
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-retro-orange border-4 border-retro-cream ring-2 ring-retro-orange scale-110 hidden md:block"></span>
                </div>
              </motion.div>

              {/* Box Content - Right */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                className="md:w-1/2 pl-4 md:pl-12"
              >
                <div className="bg-white border-2 border-retro-charcoal rounded-xl shadow-[6px_6px_0px_rgba(30,31,34,0.1)] hover:shadow-[6px_6px_0px_rgba(255,107,74,0.15)] transition-all p-6 relative">
                  {renderArchivalSeal("ĐỘT PHÁ", "1979-1981")}
                  
                  {/* Clickable Header Area */}
                  <div 
                    onClick={() => toggleMilestone("milestone-3")}
                    className="cursor-pointer select-none group flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      {/* Decorative corner paperclip */}
                      <div className="text-xs font-mono text-retro-orange flex items-center gap-1 uppercase mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-retro-orange"></span>
                        Mốc 3
                      </div>

                      <h3 className="text-xl md:text-2xl font-display font-bold text-retro-charcoal tracking-tight group-hover:text-retro-orange transition-colors">
                        Những bước đột phá kinh tế đầu tiên
                      </h3>
                      <p className="text-base text-retro-orange font-semibold mt-1">
                        Thử nghiệm vượt rào và khởi đầu tháo gỡ rào cản hành chính
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-retro-charcoal bg-retro-cream text-retro-charcoal group-hover:bg-retro-orange group-hover:text-white transition-colors shrink-0 mt-4 md:mt-1">
                      <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${expandedMilestones["milestone-3"] ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  <AnimatePresence initial={false}>
                    {expandedMilestones["milestone-3"] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-base text-retro-gray leading-relaxed mb-4">
                          {MILESTONES[2].brief}
                        </p>

                        <p className="text-sm text-retro-gray bg-retro-cream border border-retro-border rounded-lg p-3 leading-relaxed mb-5 font-sans">
                          <strong className="text-retro-charcoal font-display font-semibold">Quyết sách cốt lõi:</strong> {MILESTONES[2].content}
                        </p>

                        {renderMilestoneImage("milestone-3")}

                        {/* INTERACTIVE BREAKTHROUGHS SELECTOR */}
                        <div className="bg-retro-mint-light border-2 border-retro-mint rounded-xl p-4 mb-3">
                          <div className="text-xs font-mono text-retro-mint mb-3 uppercase tracking-wider font-extrabold flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-retro-mint" />
                            3 Quyết định đột phá nông - công nghiệp
                          </div>

                          {/* Tab Navigation buttons */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {["1. Hội nghị Trung ương 6", "2. Chỉ thị 100", "3. Quyết định 25&26"].map((label, idx) => (
                              <button
                                key={label}
                                onClick={() => setActiveBreakthroughTab(idx)}
                                className={`px-3 py-1.5 text-xs rounded-lg font-display font-bold border transition-all ${
                                  activeBreakthroughTab === idx
                                    ? "bg-retro-mint text-white border-retro-charcoal shadow-sm"
                                    : "bg-white text-retro-gray border-retro-border hover:bg-emerald-50"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          <AnimatePresence mode="wait">
                            {activeBreakthroughTab === 0 && (
                              <motion.div
                                key="bt-0"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-white p-4 rounded-lg border border-retro-border text-sm leading-relaxed"
                              >
                                <div className="font-bold text-retro-charcoal mb-1 flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-retro-red/10 text-retro-red font-mono text-[10px]">Tháng 8/1979</span>
                                  Hội nghị Trung ương 6 (Bước đột phá số 1)
                                </div>
                                <p className="text-retro-gray mb-2">
                                  Đề xuất sửa chữa sai lầm quản trị, tháo bỏ dây xích cấm đoán để cho <strong className="text-retro-red">"sản xuất bung ra"</strong> một cách tự nhiên.
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-sm text-retro-gray font-sans">
                                  <li>Miễn thuế toàn bộ cho đất mới khai hoang, phục hóa.</li>
                                  <li>Cho phép người dân hưởng trọn vẹn sản phẩm thừa tự làm ra.</li>
                                  <li>Bắt đầu dỡ bỏ các trạm kiểm soát rườm rà để tự do thông thương.</li>
                                </ul>
                              </motion.div>
                            )}

                            {activeBreakthroughTab === 1 && (
                              <motion.div
                                key="bt-1"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-white p-4 rounded-lg border border-retro-border text-sm leading-relaxed"
                              >
                                <div className="font-bold text-retro-charcoal mb-1 flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-retro-red/10 text-retro-red font-mono text-[10px]">Tháng 1/1981</span>
                                  Chỉ thị số 100-CT/Trung ương (Khoán mẫu Nông nghiệp)
                                </div>
                                <p className="text-retro-gray mb-2">
                                  Chính thức thừa nhận và nhân rộng hình thức khoán sản phẩm đến nhóm và người lao động (sau hiện tượng <strong className="text-retro-red">"khoán chui"</strong>).
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-sm text-retro-gray">
                                  <li>Giao khoán sản phẩm trực tiếp đến nhóm và cá nhân người nông dân.</li>
                                  <li>Người dân tự chủ các khâu gieo cấy, trực tiếp chăm sóc và tự gặt thu hoạch.</li>
                                  <li>Hưởng trọn phần việc vượt mức khoán, được mua bán tự do ngoài chợ đen cũ.</li>
                                </ul>
                                <div className="mt-2 text-retro-mint font-bold text-[10px] uppercase">
                                  Kết quả: Thắng lợi to lớn, sản lượng lúa lương thực vọt dốc lịch sử!
                                </div>
                              </motion.div>
                            )}

                            {activeBreakthroughTab === 2 && (
                              <motion.div
                                key="bt-2"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-white p-4 rounded-lg border border-retro-border text-sm leading-relaxed"
                              >
                                <div className="font-bold text-retro-charcoal mb-1 flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-retro-red/10 text-retro-red font-mono text-[10px]">Tháng 1/1981</span>
                                  Quyết định 25-CP & 26-CP (Quyền chủ động Xí nghiệp)
                                </div>
                                <p className="text-retro-gray mb-3">
                                  • Cho phép các xí nghiệp quốc doanh lớn được tự chủ về hoạt động công nghệ và tài chính.
                                </p>
                                <p className="text-retro-gray leading-relaxed">
                                  • Mở rộng hình thức trả lương khoán, lương sản phẩm và vận dụng hình thức tiền thưởng trong các đơn vị sản xuất kinh doanh của Nhà nước.
                                </p>
                                <div className="mt-2 text-retro-mint font-bold text-[10px] uppercase">
                                  Kết quả: Sản xuất công nghiệp vượt kịch bản dự kiến!
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </motion.div>

            </div>

            {/* MILESTONE 4 */}
            <div className="relative z-10 flex flex-col md:flex-row items-stretch gap-6 md:gap-0">
              
              {/* Box Content - Left on MD */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                className="md:w-1/2 pr-4 md:pr-12 order-2 md:order-1"
              >
                <div className="bg-white border-2 border-retro-charcoal rounded-xl shadow-[6px_6px_0px_rgba(30,31,34,0.1)] hover:shadow-[6px_6px_0px_rgba(220,50,49,0.15)] transition-all p-6 relative">
                  {renderArchivalSeal("BIÊN CƯƠNG", "1978-1979")}
                  
                  {/* Clickable Header Area */}
                  <div 
                    onClick={() => toggleMilestone("milestone-4")}
                    className="cursor-pointer select-none group flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      {/* Decorative corner tag */}
                      <div className="text-xs font-mono text-retro-red flex items-center gap-1 uppercase mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-retro-red"></span>
                        Mốc 4
                      </div>

                      <h3 className="text-xl md:text-2xl font-display font-bold text-retro-charcoal tracking-tight group-hover:text-retro-red transition-colors">
                        {MILESTONES[3].title}
                      </h3>
                      {MILESTONES[3].subTitle && (
                        <p className="text-sm text-retro-red font-semibold mt-1">
                          {MILESTONES[3].subTitle}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-retro-charcoal bg-retro-cream text-retro-charcoal group-hover:bg-retro-red group-hover:text-white transition-colors shrink-0 mt-4 md:mt-1">
                      <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${expandedMilestones["milestone-4"] ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  <AnimatePresence initial={false}>
                    {expandedMilestones["milestone-4"] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-base text-retro-gray leading-relaxed mb-4">
                          {MILESTONES[3].brief}
                        </p>

                        <p className="text-sm text-retro-gray bg-retro-cream border border-retro-border rounded-lg p-3 leading-relaxed mb-5 font-sans">
                          <strong className="text-retro-charcoal font-display">Nội dung cốt lõi:</strong> {MILESTONES[3].content}
                        </p>

                        {/* INTERACTIVE BORDER CHOOSE DIALOGUE WITH CUSTOM GRAPHIC */}
                        <div className="bg-white border border-retro-border rounded-xl p-4 shadow-inner">
                          <h4 className="text-sm font-mono font-bold text-retro-gray mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                            <Target className="w-4 h-4 text-retro-red" />
                            {MILESTONES[3].details?.narrative || "Sơ đồ chiến lược quân sự bảo vệ chủ quyền (1978-1979)"}
                          </h4>

                          {/* Highly responsive custom vector graphic that represents Vietnam border selectors */}
                          <div className="relative w-full h-40 bg-retro-cream rounded-lg border border-retro-border mb-4 flex items-center justify-center overflow-hidden">
                            {/* Decorative Compass Rose */}
                            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-retro-gray/50 text-right">
                              <div>VĨ ĐỘ VIỆT NAM</div>
                              <div>1979 BẢO ĐỒ</div>
                            </div>

                            {/* Schematic S-shaped outline via geometric visualizer */}
                            <svg viewBox="0 0 100 100" className="absolute h-36 opacity-30 text-retro-gray/70 filter drop-shadow">
                              <path 
                                d="M48,15 Q55,10 65,15 T50,30 T45,45 T55,60 T60,75 T42,90" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="6" 
                                strokeLinecap="round"
                              />
                              {/* Paracel & Spratly Islands marks */}
                              <circle cx="80" cy="55" r="2" fill="currentColor"/>
                              <circle cx="85" cy="78" r="2" fill="currentColor"/>
                            </svg>

                            {/* Interactive Target Dots on map */}
                            {/* Northern Point */}
                            <button 
                              onClick={() => setActiveBorderArea("phia_bac")}
                              className={`absolute top-5 left-[54%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group focus:outline-none`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${activeBorderArea === "phia_bac" ? "bg-retro-red animate-ping" : "bg-retro-red/80"} transition-all`}></div>
                              <div className="w-2 h-2 rounded-full bg-retro-red border border-white absolute"></div>
                              <span className="text-[10px] font-mono font-bold bg-white border border-retro-charcoal px-1 rounded-sm mt-1 whitespace-nowrap shadow-sm group-hover:scale-105 transition-all font-sans">
                                Biên giới Phía Bắc 🏔️
                              </span>
                            </button>

                            {/* Southern Point */}
                            <button 
                              onClick={() => setActiveBorderArea("tay_nam")}
                              className={`absolute bottom-4 left-[38%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group focus:outline-none`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${activeBorderArea === "tay_nam" ? "bg-retro-red animate-ping" : "bg-retro-red/80"} transition-all`}></div>
                              <div className="w-2 h-2 rounded-full bg-retro-red border border-white absolute"></div>
                              <span className="text-[10px] font-mono font-bold bg-white border border-retro-charcoal px-1 rounded-sm mt-1 whitespace-nowrap shadow-sm group-hover:scale-105 transition-all font-sans">
                                Biên giới Tây Nam 🛡️
                              </span>
                            </button>
                          </div>

                          {/* Switch layout controller toggles */}
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => setActiveBorderArea("tay_nam")}
                              className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-display font-medium border flex items-center justify-center gap-1.5 transition-all ${
                                activeBorderArea === "tay_nam"
                                  ? "bg-retro-red text-white border-retro-charcoal shadow-sm font-semibold"
                                  : "bg-retro-cream text-retro-charcoal border-retro-border hover:bg-red-50/50"
                              }`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              Giữ Biên Tây Nam (12/1978)
                            </button>

                            <button
                              onClick={() => setActiveBorderArea("phia_bac")}
                              className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-display font-medium border flex items-center justify-center gap-1.5 transition-all ${
                                activeBorderArea === "phia_bac"
                                  ? "bg-retro-red text-white border-retro-charcoal shadow-sm font-semibold"
                                  : "bg-retro-cream text-retro-charcoal border-retro-border hover:bg-red-50/50"
                              }`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              Giữ Biên Phía Bắc (02/1979)
                            </button>
                          </div>

                          {/* Explanatory content dynamic card */}
                          <AnimatePresence mode="wait">
                            {activeBorderArea === "tay_nam" && (() => {
                              const pointText = MILESTONES[3].details?.points?.[0] || "";
                              const colonIdx = pointText.indexOf(":");
                              const label = colonIdx > -1 ? pointText.substring(0, colonIdx) : "Bảo vệ biên giới phía Tây Nam";
                              const body = colonIdx > -1 ? pointText.substring(colonIdx + 1).trim() : pointText;

                              const highlightBody = (text: string) => {
                                const wordsToHighlight = [
                                  "Từ tháng 4/1975",
                                  "Pôn Pốt",
                                  "diệt chủng",
                                  "ngày 26/12/1978",
                                  "giải phóng thủ đô Phnôm Pênh vào ngày 07/01/1979",
                                  "ngày 07/01/1979",
                                  "Ngày 18/02/1979"
                                ];
                                return (
                                  <div className="leading-relaxed font-sans text-retro-charcoal whitespace-pre-line text-sm">
                                    {text.split(/(Từ tháng 4\/1975|Từ tháng 4-1975|Pôn Pốt|diệt chủng|ngày 26\/12\/1978|ngày 07\/01\/1979|Ngày 18\/02\/1979)/).map((part, i) => {
                                      if (wordsToHighlight.includes(part)) {
                                        return <strong key={i} className="text-retro-red font-semibold">{part}</strong>;
                                      }
                                      return part;
                                    })}
                                  </div>
                                );
                              };

                              return (
                                <motion.div
                                  key="border-sw"
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="bg-retro-cream p-4 rounded-lg border border-retro-border text-sm"
                                >
                                  <div className="flex items-center gap-1.5 text-retro-red font-bold mb-2 font-display text-sm uppercase tracking-wide">
                                    <span>🛡️</span> {label}
                                  </div>
                                  <div className="text-retro-charcoal leading-relaxed font-sans">
                                    {highlightBody(body)}
                                  </div>
                                </motion.div>
                              );
                            })()}

                            {activeBorderArea === "phia_bac" && (() => {
                              const pointText = MILESTONES[3].details?.points?.[1] || "";
                              const colonIdx = pointText.indexOf(":");
                              const label = colonIdx > -1 ? pointText.substring(0, colonIdx) : "Bảo vệ biên giới phía Bắc (Tây Bắc)";
                              const body = colonIdx > -1 ? pointText.substring(colonIdx + 1).trim() : pointText;

                              const highlightBody = (text: string) => {
                                const wordsToHighlight = [
                                  "Ngày 17/02/1979",
                                  "hơn 60 vạn quân",
                                  "ngày 18/03/1979"
                                ];
                                return (
                                  <div className="leading-relaxed font-sans text-retro-charcoal whitespace-pre-line text-sm">
                                    {text.split(/(Ngày 17\/02\/1979|hơn 60 vạn quân|ngày 18\/03\/1979)/).map((part, i) => {
                                      if (wordsToHighlight.includes(part)) {
                                        return <strong key={i} className="text-retro-red font-semibold">{part}</strong>;
                                      }
                                      return part;
                                    })}
                                  </div>
                                );
                              };

                              return (
                                <motion.div
                                  key="border-north"
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="bg-retro-cream p-4 rounded-lg border border-retro-border text-sm"
                                >
                                  <div className="flex items-center gap-1.5 text-retro-red font-bold mb-2 font-display text-sm uppercase tracking-wide">
                                    <span>🏔️</span> {label}
                                  </div>
                                  <div className="text-retro-charcoal leading-relaxed font-sans">
                                    {highlightBody(body)}
                                  </div>
                                </motion.div>
                              );
                            })()}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </motion.div>

              {/* Year indicator right */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="md:w-1/2 flex justify-start md:pl-12 md:pt-4 order-1 md:order-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-retro-red border-4 border-retro-cream ring-2 ring-retro-red scale-110 hidden md:block"></span>
                  <div className="px-4 py-2 bg-retro-red text-white font-display font-bold text-xl md:text-2xl rounded shadow-[3px_3px_0px_#1e1f22] border-2 border-retro-charcoal select-none">
                    1978 - 1979
                  </div>
                </div>
              </motion.div>

            </div>

            {/* MILESTONE 5 */}
            <div className="relative z-10 flex flex-col md:flex-row items-stretch gap-6 md:gap-0">
              
              {/* Year indicator left */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="md:w-1/2 flex justify-start md:justify-end md:pr-12 md:pt-4"
              >
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-retro-orange text-white font-display font-bold text-xl md:text-2xl rounded shadow-[3px_3px_0px_#1e1f22] border-2 border-retro-charcoal select-none">
                    1982
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-retro-orange border-4 border-retro-cream ring-2 ring-retro-orange scale-110 hidden md:block"></span>
                </div>
              </motion.div>

              {/* Box Content - Right */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                className="md:w-1/2 pl-4 md:pl-12"
              >
                <div className="bg-white border-2 border-retro-charcoal rounded-xl shadow-[6px_6px_0px_rgba(30,31,34,0.1)] hover:shadow-[6px_6px_0px_rgba(255,107,74,0.15)] transition-all p-6 relative">
                  {renderArchivalSeal("ĐẠI HỘI V", "03/1982")}
                  
                  {/* Clickable Header Area */}
                  <div 
                    onClick={() => toggleMilestone("milestone-5")}
                    className="cursor-pointer select-none group flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      {/* Decorative corner tag */}
                      <div className="text-xs font-mono text-retro-orange flex items-center gap-1 uppercase mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-retro-orange"></span>
                        Mốc 5
                      </div>

                      <h3 className="text-xl md:text-2xl font-display font-bold text-retro-charcoal tracking-tight group-hover:text-retro-orange transition-colors">
                        Đại hội đại biểu toàn quốc lần thứ V của Đảng
                      </h3>

                      <p className="text-base text-retro-orange font-semibold mt-1">
                        {MILESTONES[4].subTitle}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-retro-charcoal bg-retro-cream text-retro-charcoal group-hover:bg-retro-orange group-hover:text-white transition-colors shrink-0 mt-4 md:mt-1">
                      <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${expandedMilestones["milestone-5"] ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  <AnimatePresence initial={false}>
                    {expandedMilestones["milestone-5"] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        {renderMilestoneImage("milestone-5")}

                        <p className="text-base text-retro-gray leading-relaxed mb-4">
                          {MILESTONES[4].brief}
                        </p>


                        <div className="space-y-4 mb-5">
                          <div className="p-4 bg-retro-cream border border-retro-border rounded-lg text-sm leading-relaxed space-y-3 font-sans text-retro-charcoal">
                            <p className="font-bold text-base text-retro-orange border-b border-retro-border pb-1.5 font-display mb-1">
                              Đại hội V đã bổ sung đường lối chung do Đại hội IV đề ra những quan điểm mới:
                            </p>
                            <ul className="space-y-2 list-none pl-0">
                              <li className="flex items-start gap-2">
                                <span className="text-retro-charcoal mt-1">•</span>
                                <span>Khẳng định nước ta đang ở chặng đường đầu tiên của thời kỳ quá độ lên chủ nghĩa xã hội với những khó khăn về kinh tế, chính trị, văn hóa, xã hội.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-retro-charcoal mt-1">•</span>
                                <span>Nhiệm vụ của chặng đường trước mắt là ổn định tiến lên cải thiện một bước đời sống vật chất và văn hóa của nhân dân.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-retro-charcoal mt-1">•</span>
                                <span>Tiếp tục xây dựng cơ sở vật chất-kỹ thuật của chủ nghĩa xã hội, chủ yếu nhằm thúc đẩy sản xuất nông nghiệp, hàng tiêu dùng và xuất khẩu.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-retro-charcoal mt-1">•</span>
                                <span>Đáp ứng nhu cầu của công cuộc phòng thủ đất nước, củng cố quốc phòng, giữ vững an ninh, trật tự xã hội.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-retro-charcoal mt-1">•</span>
                                <span>Đại hội V thông qua các nhiệm vụ về kinh tế, văn hóa, xã hội, đối ngoại và quyết định xây dựng Đảng vững mạnh toàn diện, nâng cao sức chiến đấu và gắn bó với nhân dân.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-retro-charcoal mt-1">•</span>
                                <span>Đại hội V đã có những bước phát triển nhận thức mới, tìm tòi đổi mới trong bước quá độ lên chủ nghĩa xã hội, trước hết là về mặt kinh tế.</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* INTERACTIVE COMPONENT: COLLAPSE BLOCKS OF BARRIER LIMITATIONS */}
                        <div className="border border-retro-border rounded-xl overflow-hidden">
                          <button
                            onClick={() => setShowM5Limitations(!showM5Limitations)}
                            className="w-full text-left bg-orange-100 hover:bg-orange-200 transition-colors px-4 py-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <HelpCircle className="w-4.5 h-4.5 text-retro-red animate-pulse" />
                              <span className="text-sm font-mono font-bold tracking-tight text-retro-charcoal uppercase">
                                4 Hạn chế cơ chế cần đập vỡ (Đại hội V)
                              </span>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-retro-gray transition-transform ${showM5Limitations ? "rotate-90" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {showM5Limitations && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-retro-cream text-retro-charcoal border-t border-retro-border"
                              >
                                <div className="p-4 text-sm font-sans select-none space-y-3">
                                  <div className="flex gap-2.5 items-start">
                                    <span className="text-retro-orange font-bold font-mono">1.</span>
                                    <div className="text-retro-gray leading-relaxed">Chưa thấy hết sự cần thiết duy trì nền kinh tế nhiều thành phần; chưa xác định rõ việc kết hợp kế hoạch hóa với tôn trọng cơ chế thị trường.</div>
                                  </div>
                                  <div className="flex gap-2.5 items-start pt-2 border-t border-retro-border">
                                    <span className="text-retro-orange font-bold font-mono">2.</span>
                                    <div className="text-retro-gray leading-relaxed">Chủ trương còn nóng vội, muốn hoàn thành nhanh cải tạo xã hội chủ nghĩa ở miền Nam chỉ trong thời gian 5 năm ngắn.</div>
                                  </div>
                                  <div className="flex gap-2.5 items-start pt-2 border-t border-retro-border">
                                    <span className="text-retro-orange font-bold font-mono">3.</span>
                                    <div className="text-retro-gray leading-relaxed">Tiếp tục rót vốn quốc gia tràn lan thâm hụt vào công nghiệp nặng xây dựng to lớn mà chưa hoạt động hiệu quả.</div>
                                  </div>
                                  <div className="flex gap-2.5 items-start pt-2 border-t border-retro-border">
                                    <span className="text-retro-orange font-bold font-mono">4.</span>
                                    <div className="text-retro-gray leading-relaxed">Không quyết đoán chuyển dứt khoát nhiều vốn vật tư để ưu ái phát triển cho nông nghiệp cả nước và sản xuất công nghiệp hàng tiêu dùng.</div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </motion.div>

            </div>

            {/* MILESTONE 6 */}
            <div className="relative z-10 flex flex-col md:flex-row items-stretch gap-6 md:gap-0">
              
              {/* Box Content - Left */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                className="md:w-1/2 pr-4 md:pr-12 order-2 md:order-1"
              >
                <div className="bg-white border-2 border-retro-charcoal rounded-xl shadow-[6px_6px_0px_rgba(30,31,34,0.1)] hover:shadow-[6px_6px_0px_rgba(16,185,129,0.15)] transition-all p-6 relative">
                  {renderArchivalSeal("HẠCH TOÁN", "1984-1986")}
                  
                  {/* Clickable Header Area */}
                  <div 
                    onClick={() => toggleMilestone("milestone-6")}
                    className="cursor-pointer select-none group flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      {/* Decorative corner tag */}
                      <div className="text-xs font-mono text-retro-mint flex items-center gap-1 uppercase mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-retro-mint"></span>
                        Mốc 6
                      </div>

                      <h3 className="text-xl md:text-2xl font-display font-bold text-retro-charcoal tracking-tight group-hover:text-retro-mint transition-colors">
                        Quá trình cụ thể hóa đổi mới qua các Hội nghị Trung ương
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-retro-charcoal bg-retro-cream text-retro-charcoal group-hover:bg-retro-mint group-hover:text-white transition-colors shrink-0 mt-2">
                      <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${expandedMilestones["milestone-6"] ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  <AnimatePresence initial={false}>
                    {expandedMilestones["milestone-6"] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-base text-retro-gray leading-relaxed mb-4">
                          {MILESTONES[5].brief}
                        </p>

                        {renderMilestoneImage("milestone-6")}

                        {/* GRID TABLE DETAILED */}
                        <div className="overflow-x-auto border border-retro-border rounded-lg mb-4 text-sm">
                          <table className="w-full text-left font-sans border-collapse">
                            <thead>
                              <tr className="bg-retro-cream border-b border-retro-border font-bold text-retro-charcoal">
                                <th className="p-2 border-r border-retro-border font-display">Hội nghị Trung ương</th>
                                <th className="p-2 border-r border-retro-border">Nội dung chính</th>
                                <th className="p-2">Giải pháp áp dụng</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-retro-border text-sm text-retro-gray">
                              <tr>
                                <td className="p-2 border-r border-retro-border font-medium text-retro-charcoal">Hội nghị Trung ương 6 (07/1984)</td>
                                <td className="p-2 border-r border-retro-border">Giải quyết cấp bách phân phối lưu thông.</td>
                                <td className="p-2">Điều chỉnh biểu giá lương thực, gia tăng thu mua hàng ngoài luồng, kiểm soát tự do thương mại.</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-r border-retro-border font-medium text-retro-charcoal">Hội nghị Trung ương 7 (12/1984)</td>
                                <td className="p-2 border-r border-retro-border">Xác định mặt trận số một hàng đầu.</td>
                                <td className="p-2">Tập trung tuyệt đối cơ sở vật chất lấy nông nghiệp (lương thực, thực phẩm) làm trọng tâm sinh hoạt.</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-r border-retro-border font-medium text-retro-charcoal">Hội nghị Trung ương 8 (06/1985)</td>
                                <td className="p-2 border-r border-retro-border">Xóa bỏ bao cấp trong Giá - Lương - Tiền.</td>
                                <td className="p-2 font-semibold text-retro-red">Hủy bỏ cơ chế bao cấp tiêu chuẩn, chuyển dứt khoát sang hạch toán kinh doanh XHCN.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* INTERACTIVE COUPON BOOK GRAPHIC */}
                        <div className="bg-amber-50 border-2 border-retro-border rounded-xl p-4 mb-4 relative overflow-hidden">
                          <div className="absolute -top-3 -right-3 w-16 h-16 border-4 border-retro-red rounded-full flex items-center justify-center font-display font-black text-retro-red text-xs uppercase tracking-tight transform rotate-12 select-none pointer-events-none">
                            XÓA BỎ
                          </div>

                          <div className="flex items-start gap-3.5">
                            <div className="p-2 bg-retro-cream border border-retro-border rounded flex flex-col items-center select-none shadow animate-wiggle">
                              <span className="text-[10px] font-mono font-bold text-red-600 border-b w-full text-center uppercase">1985</span>
                              <div className="text-2xl">🎫</div>
                              <span className="text-[9px] font-mono text-gray-500 font-bold">TEM PHIẾU</span>
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="text-sm font-display font-bold text-retro-charcoal uppercase flex items-center gap-1">
                                Chủ trương xóa quan liêu bao cấp trong giá và lương
                              </h4>
                            </div>
                          </div>

                          <button
                            onClick={() => setCouponDecongested(!couponDecongested)}
                            className={`w-full py-2 px-3 rounded text-sm font-display font-medium border flex items-center justify-center gap-2 transition-all mt-3 ${
                              couponDecongested 
                                ? "bg-retro-mint text-white border-retro-charcoal shadow-sm font-semibold"
                                : "bg-retro-orange text-white border-retro-charcoal hover:bg-orange-500 shadow-sm"
                            }`}
                          >
                            {couponDecongested ? "Hủy kích hoạt" : "Đọc sắc lệnh cải cách chế độ tem phiếu"}
                            <BookOpen className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {couponDecongested && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 bg-white border border-retro-border rounded-lg p-3.5 space-y-2 text-sm text-retro-charcoal font-sans"
                              >
                                <div className="flex items-start gap-1.5">
                                  <span className="text-retro-red font-bold">✓</span>
                                  <span>Tính đủ chi phí hợp lý trong giá thành sản phẩm.</span>
                                </div>
                                <div className="flex items-start gap-1.5 pt-1.5 border-t border-dashed border-retro-border">
                                  <span className="text-retro-red font-bold">✓</span>
                                  <span>Giá cả bảo đảm bù đắp chi phí thực tế hợp lý, người sản xuất có lợi nhuận thỏa đáng và Nhà nước từng bước có tích lũy.</span>
                                </div>
                                <div className="flex items-start gap-1.5 pt-1.5 border-t border-dashed border-retro-border">
                                  <span className="text-retro-red font-bold">✓</span>
                                  <span>Xóa bỏ tình trạng Nhà nước mua thấp, bán thấp và bù lỗ;</span>
                                </div>
                                <div className="flex items-start gap-1.5 pt-1.5 border-t border-dashed border-retro-border">
                                  <span className="text-retro-red font-bold">✓</span>
                                  <span>Thực hiện cơ chế một giá trong toàn bộ hệ thống,</span>
                                </div>
                                <div className="flex items-start gap-1.5 pt-1.5 border-t border-dashed border-retro-border">
                                  <span className="text-retro-red font-bold">✓</span>
                                  <span>Thực hiện trả lương bằng tiền có hàng hóa bảo đảm,</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* HEROIC QUOTE: POLITBURO AUGUST 1986 */}
                        <div className="bg-retro-red/5 border-l-4 border-retro-red p-4 rounded-r-lg">
                          <h4 className="text-sm font-mono font-bold uppercase text-retro-red mb-1.5 flex items-center gap-1">
                            <span>💥</span> Hội nghị Bộ Chính trị (08/1986) - Đỉnh cao tự phê bình:
                          </h4>
                          <div className="space-y-2 text-sm text-retro-charcoal font-medium leading-relaxed font-sans font-sans">
                            <div>• <strong>Về cơ cấu sản xuất:</strong> chúng ta đã chủ quan, nóng vội đề ra một số chủ trương quá lớn về quy mô, quá cao về nhịp độ xây dựng cơ bản và phát triển sản xuất.</div>
                            <div>• <strong>Về cải tạo xã hội chủ nghĩa:</strong> chúng ta đã phạm nhiều khuyết điểm trong cải tạo xã hội chủ nghĩa.</div>
                            <div>• <strong>Về cơ chế quản lý kinh tế:</strong> cần bố trí lại cơ cấu kinh tế phải đi đôi với đổi mới cơ chế quản lý kinh tế, làm cho hai mặt ăn khớp với nhau tạo ra động lực mới thúc đẩy sản xuất phát triển.</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </motion.div>

              {/* Year indicator right */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="md:w-1/2 flex justify-start md:pl-12 md:pt-4 order-1 md:order-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-retro-mint border-4 border-retro-cream ring-2 ring-retro-mint scale-110 hidden md:block"></span>
                  <div className="px-4 py-2 bg-retro-mint text-white font-display font-bold text-xl md:text-2xl rounded shadow-[3px_3px_0px_#1e1f22] border-2 border-retro-charcoal select-none">
                    1984 - 1986
                  </div>
                </div>
              </motion.div>

            </div>

          </div>
        </div>
      </main>
      )}

      {/* EXHIBITION GALLERY SECTION - TRIỂN LÃM SỬ LIỆU SỐ */}
      {activeTab === "gallery" && (
        <section id="exhibition-gallery" className="bg-[#FAF7F0] border-t-4 border-b-4 border-retro-charcoal py-16 px-4 relative overflow-hidden bg-[radial-gradient(rgba(30,31,34,0.03)_1.5px,transparent_1.5px)] [background-size:20px_20px]">
        {/* Decorative elements */}
        <div className="absolute top-10 left-[-5%] w-96 h-96 rounded-full bg-retro-orange/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-[-5%] w-96 h-96 rounded-full bg-retro-yellow/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-retro-red/10 border border-retro-red/30 rounded-full mb-3 shadow-sm select-none">
              <span className="w-2 h-2 rounded-full bg-retro-red animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-retro-red tracking-wider uppercase">Triển lãm chuyên đề số</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-display font-black uppercase text-retro-charcoal tracking-tight">
              KHO TƯ LIỆU ẢNH: VIỆT NAM GIAI ĐOẠN 1975 - 1986
            </h2>
            
            <p className="text-sm text-retro-gray max-w-2xl mx-auto mt-3 leading-relaxed font-sans font-light">
              Khám phá thế giới hình ảnh chân thực ghi lại bởi Thông tấn xã Việt Nam và các bức ảnh đời thường quý giá do Chuyên gia UNICEF Leo Goulet chụp tại các địa phương từ năm 1980 - 1985.
            </p>
            <div className="w-24 h-1 bg-retro-orange mx-auto mt-6 rounded-full"></div>
          </div>

          {/* Filter Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-4xl mx-auto">
            {["Tất cả", "Sự kiện Lịch sử", "Đời sống Bao cấp", "Đô thị & Nghệ thuật", "Hợp tác & Phát triển", "Tư liệu tổng hợp"].map((category) => {
              const count = category === "Tất cả" 
                ? GALLERY_IMAGES.length 
                : GALLERY_IMAGES.filter(img => img.category === category).length;
              
              if (count === 0) return null;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedGalleryCategory(category)}
                  className={`px-4 py-2 text-xs font-display font-bold rounded-lg border-2 transition-all duration-250 flex items-center gap-1.5 active:scale-95 ${
                    selectedGalleryCategory === category
                      ? "bg-retro-charcoal text-[#FCF9F2] border-retro-charcoal shadow-[2px_2px_0px_#ff6b4a]"
                      : "bg-white text-retro-gray border-retro-border hover:border-retro-charcoal hover:bg-amber-50"
                  }`}
                >
                  <span>{category}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                    selectedGalleryCategory === category ? "bg-retro-orange text-white" : "bg-retro-cream text-retro-gray"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {GALLERY_IMAGES
                .filter(img => selectedGalleryCategory === "Tất cả" || img.category === selectedGalleryCategory)
                .map((image) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="bg-[#FCF9F2] border-2 border-retro-charcoal rounded-xl p-3.5 shadow-[4px_4px_0px_#1e1f22] cursor-pointer group flex flex-col justify-between hover:shadow-[6px_6px_0px_#1e1f22] transition-shadow relative"
                    onClick={() => setActiveLightboxImage(image)}
                  >
                    {/* Tiny Red Stamp of authenticity */}
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center pointer-events-none select-none">
                      <span className="text-[7px] font-black text-red-500 font-display">✓</span>
                    </div>

                    <div>
                      {/* Image container */}
                      <div className="overflow-hidden border border-retro-border rounded-lg bg-retro-cream aspect-video mb-3.5 relative shadow-inner">
                        <img 
                          src={image.src} 
                          alt={image.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-center">
                          <span className="bg-retro-charcoal/80 text-white font-mono text-[8px] px-2 py-1 rounded">
                            MÃ: {image.archiveId}
                          </span>
                        </div>
                      </div>

                      {/* Header Title */}
                      <h3 className="font-display font-extrabold text-sm text-retro-charcoal group-hover:text-retro-orange transition-colors leading-tight line-clamp-1">
                        {image.title}
                      </h3>

                      {/* Italic caption */}
                      <p className="text-[11px] text-retro-gray line-clamp-2 mt-1.5 leading-relaxed italic font-sans">
                        "{image.caption}"
                      </p>
                    </div>

                    {/* Metadata Footer bar */}
                    <div className="mt-4 pt-2.5 border-t border-dashed border-retro-border flex items-center justify-between text-[9px] font-mono text-retro-gray uppercase tracking-wider">
                      <span className="truncate max-w-[100px]">{image.place.split(",")[0]}</span>
                      <span className="font-bold text-retro-red">{image.date}</span>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

          {/* Bottom citation */}
          <div className="mt-12 bg-white/60 border border-retro-border rounded-xl p-4 text-center max-w-3xl mx-auto border-dashed">
            <p className="text-[11px] text-retro-gray font-mono leading-relaxed">
              *Tài liệu hình ảnh được sưu tầm từ các nguồn uy tín phục vụ mục đích nghiên cứu học tập lịch sử. Bản quyền hình ảnh Leo Goulet thuộc về Bộ sưu tập UNICEF Việt Nam & Nhiếp ảnh Đời sống.
            </p>
          </div>
        </div>
      </section>
      )}

      {/* FAMILY MEMORY BOARD SECTION - BẢNG KÝ ỨC GIA ĐÌNH */}
      {activeTab === "stories" && (
        <section id="family-stories" className="bg-[#FAF7F0] border-b-4 border-retro-charcoal py-16 px-4 relative overflow-hidden bg-[radial-gradient(rgba(30,31,34,0.03)_1.5px,transparent_1.5px)] [background-size:20px_20px] min-h-[80vh]">
          {/* Corkboard decorative backdrops */}
          <div className="absolute top-10 right-[-10%] w-96 h-96 rounded-full bg-retro-orange/5 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 left-[-5%] w-80 h-80 rounded-full bg-retro-yellow/5 blur-3xl pointer-events-none"></div>

          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-retro-red/10 border border-retro-red/30 rounded-full mb-3 shadow-sm select-none">
                <span className="w-2 h-2 rounded-full bg-retro-red animate-pulse"></span>
                <span className="text-[10px] font-mono font-bold text-retro-red tracking-wider uppercase">Cộng đồng lưu trữ ký ức mở</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-display font-black uppercase text-retro-charcoal tracking-tight">
                BẢNG KÝ ỨC GIA ĐÌNH: "THỜI BAO CẤP QUA LỜI KỂ"
              </h2>
              
              <p className="text-sm text-retro-gray max-w-2xl mx-auto mt-3 leading-relaxed font-sans font-light">
                Không gian ghim những mẩu chuyện xưa từ lời kể của Ông Bà, Cha Mẹ do các học viên sưu tầm. Hãy cùng chia sẻ những ký ức chân thực để thấy dòng chảy lịch sử sống động hơn.
              </p>
              <div className="w-24 h-1 bg-retro-orange mx-auto mt-6 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Form Side - 1 Column */}
              <div className="bg-white border-4 border-retro-charcoal rounded-2xl p-6 shadow-[5px_5px_0px_#1e1f22] sticky top-28">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-lg md:text-xl font-display font-extrabold text-retro-charcoal uppercase flex items-center gap-2">
                    <Pin className="w-5 h-5 text-retro-red rotate-45" />
                    Ghim ký ức mới
                  </h3>
                  <div 
                    onClick={() => setShowFirebaseModal(true)}
                    title="Nhấn để thiết lập / kiểm tra cấu hình Firebase Cloud Firestore Realtime" 
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border shadow-sm shrink-0 cursor-pointer hover:scale-105 transition-all bg-retro-cream/80 hover:bg-white border-retro-charcoal/30"
                  >
                    {isFirebaseEnabled ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-emerald-700">🔥 Realtime active</span>
                        <Settings className="w-3 h-3 text-emerald-700 ml-0.5" />
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-amber-700 font-extrabold">💾 LocalStorage</span>
                        <Settings className="w-3.5 h-3.5 text-amber-700 ml-0.5" />
                      </>
                    )}
                  </div>
                </div>
                
                <form key={storyFormKey} onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.target as HTMLFormElement);
                  const author = (data.get("author") as string || "").trim();
                  const title = (data.get("title") as string || "").trim();
                  if (!author || !title) return;
                  const tag = (data.get("tag") as string) || "🎫 Tem phiếu";
                  const color = (data.get("color") as string) || "cream";
                  const stamp = (data.get("stamp") as string) || "default";
                  handleAddStory({
                    author,
                    relation: data.get("relation") as string,
                    title,
                    content: data.get("content") as string,
                    tag,
                    color,
                    stamp
                  });
                  // Show success toast
                  setStoryToastMsg(`✔️ "Đã ghim ký ức của ${author} lên bảng!"`);
                  setTimeout(() => setStoryToastMsg(null), 4000);
                  // Scroll to corkboard so user sees the new card
                  setTimeout(() => corkboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                  // Reset form via key
                  setStoryFormKey(k => k + 1);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-retro-gray uppercase mb-1.5">Họ tên sinh viên:</label>
                    <input 
                      required 
                      type="text" 
                      name="author" 
                      placeholder="Ví dụ: Nguyễn Văn A (Nhóm 1)" 
                      className="w-full p-2.5 bg-retro-cream border-2 border-retro-border rounded-lg text-sm focus:border-retro-charcoal focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-mono font-bold text-retro-gray uppercase mb-1.5">Nguồn gốc lời kể:</label>
                    <select 
                      name="relation" 
                      className="w-full p-2.5 bg-retro-cream border-2 border-retro-border rounded-lg text-sm focus:border-retro-charcoal focus:outline-none"
                    >
                      <option value="Lời kể của Ông ngoại">Lời kể của Ông ngoại</option>
                      <option value="Lời kể của Ông nội">Lời kể của Ông nội</option>
                      <option value="Lời kể của Bà ngoại">Lời kể của Bà ngoại</option>
                      <option value="Lời kể của Bà nội">Lời kể của Bà nội</option>
                      <option value="Lời kể của Bố">Lời kể của Bố</option>
                      <option value="Lời kể của Mẹ">Lời kể của Mẹ</option>
                      <option value="Sưu tầm sách báo">Sưu tầm sách báo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-retro-gray uppercase mb-1.5">Tiêu đề mẩu ký ức:</label>
                    <input 
                      required 
                      type="text" 
                      name="title" 
                      placeholder="Ví dụ: Đêm xếp hàng mua thịt" 
                      className="w-full p-2.5 bg-retro-cream border-2 border-retro-border rounded-lg text-sm focus:border-retro-charcoal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-retro-gray uppercase mb-1.5">Nội dung câu chuyện:</label>
                    <textarea 
                      required 
                      name="content" 
                      rows={4}
                      placeholder="Kể lại mẩu câu chuyện ngắn, kỷ niệm chân thực của người thân..." 
                      className="w-full p-2.5 bg-retro-cream border-2 border-retro-border rounded-lg text-sm focus:border-retro-charcoal focus:outline-none resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-retro-gray uppercase mb-1.5">Phân loại:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "🎫 Tem phiếu", label: "🎫 Tem phiếu" },
                        { id: "🚲 Đời sống", label: "🚲 Đời sống" },
                        { id: "🗳️ Sự kiện", label: "🗳️ Sự kiện" },
                        { id: "💡 Đổi mới", label: "💡 Đổi mới" }
                      ].map((tagItem) => (
                        <label key={tagItem.id} className="flex items-center gap-1.5 p-2 bg-retro-cream rounded border border-retro-border text-xs cursor-pointer select-none">
                          <input type="radio" name="tag" value={tagItem.id} defaultChecked={tagItem.id === "🎫 Tem phiếu"} className="accent-retro-red" />
                          <span>{tagItem.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-retro-gray uppercase mb-1.5">Con dấu biểu tượng:</label>
                    <div className="flex gap-2">
                      {[
                        { id: "default", icon: "📌", label: "Ghim" },
                        { id: "ticket", icon: "🎫", label: "Phiếu" },
                        { id: "bicycle", icon: "🚲", label: "Xe" },
                        { id: "radio", icon: "📻", label: "Đài" },
                        { id: "letter", icon: "✉️", label: "Thư" }
                      ].map((st) => (
                        <label key={st.id} className="cursor-pointer flex-1">
                          <input type="radio" name="stamp" value={st.id} defaultChecked={st.id === "default"} className="sr-only peer" />
                          <span className="flex flex-col items-center justify-center p-1 bg-retro-cream border-2 border-retro-border rounded-lg text-base peer-checked:border-retro-charcoal peer-checked:bg-amber-100 transition-all select-none" title={st.label}>
                            <span>{st.icon}</span>
                            <span className="text-[6.5px] font-mono mt-0.5 uppercase opacity-75">{st.label}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-retro-gray uppercase mb-1.5">Màu sắc giấy note:</label>
                    <div className="flex gap-2">
                      {[
                        { id: "cream", class: "bg-[#FCF9F2] border-[#E5E0D5]" },
                        { id: "yellow", class: "bg-amber-100 border-amber-300" },
                        { id: "mint", class: "bg-emerald-100 border-emerald-300" },
                        { id: "pink", class: "bg-rose-100 border-rose-300" }
                      ].map((c) => (
                        <label key={c.id} className="cursor-pointer">
                          <input type="radio" name="color" value={c.id} defaultChecked={c.id === "cream"} className="sr-only peer" />
                          <span className={`w-8 h-8 rounded-full border-2 block peer-checked:ring-2 peer-checked:ring-retro-charcoal ${c.class}`}></span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-retro-red hover:bg-retro-red-dark text-white font-display font-bold text-sm uppercase rounded-lg border-2 border-retro-charcoal shadow-[3px_3px_0px_#1e1f22] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e1f22] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Pin className="w-4 h-4 text-retro-yellow rotate-45" />
                    Ghim Ký ức Lên Bảng
                  </button>
                </form>
              </div>

              {/* Corkboard Side - 2 Columns */}
              <div ref={corkboardRef} className="lg:col-span-2 bg-[#D1C2A5] border-4 border-retro-charcoal rounded-2xl p-6 min-h-[500px] shadow-[6px_6px_0px_rgba(30,31,34,0.15)] relative overflow-hidden">
                {/* Wood texture background overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(30,31,34,0.06)_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-40"></div>
                
                {/* Corkboard Header with Export/Import Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-retro-charcoal/30 pb-4 mb-4 gap-3 relative z-10 select-none">
                  <h4 className="font-display font-black text-retro-charcoal text-base uppercase tracking-tight flex items-center gap-1.5">
                    📌 Bảng ghim ký ức ({stories.length})
                  </h4>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Export button */}
                    <button
                      onClick={handleExportStories}
                      className="px-2 py-1 bg-white hover:bg-amber-50 text-retro-charcoal border-2 border-retro-charcoal shadow-[2px_2px_0px_rgba(30,31,34,1)] rounded-md font-mono text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      title="Tải xuống tệp ky_uc_bao_cap_vnr201.json chứa câu chuyện của bạn"
                    >
                      <Download className="w-3 h-3" />
                      Xuất File
                    </button>

                    {/* Import button */}
                    <label
                      className="px-2 py-1 bg-white hover:bg-amber-50 text-retro-charcoal border-2 border-retro-charcoal shadow-[2px_2px_0px_rgba(30,31,34,1)] rounded-md font-mono text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      title="Nhập câu chuyện từ tệp .json đã lưu"
                    >
                      <Upload className="w-3 h-3" />
                      Nhập File
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportStories}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Success Toast */}
                <AnimatePresence>
                  {storyToastMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className="mb-3 px-4 py-2.5 bg-emerald-600 text-white font-mono font-bold text-xs rounded-xl border-2 border-emerald-800 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] relative z-20 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      {storyToastMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tag Filters Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 border-b border-dashed border-retro-charcoal/20 scrollbar-none snap-x snap-mandatory relative z-10 select-none py-1">
                  {[
                    { id: "Tất cả", label: "Tất cả" },
                    { id: "🎫 Tem phiếu", label: "🎫 Tem phiếu" },
                    { id: "🚲 Đời sống", label: "🚲 Đời sống" },
                    { id: "🗳️ Sự kiện", label: "🗳️ Sự kiện" },
                    { id: "💡 Đổi mới", label: "💡 Đổi mới" },
                    { id: "mine", label: "✨ Ký ức của bạn" }
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      onClick={() => setSelectedStoryFilter(filterTab.id)}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer whitespace-nowrap snap-align-start ${
                        selectedStoryFilter === filterTab.id
                          ? "bg-retro-charcoal text-[#FCF9F2] border-retro-charcoal shadow-[1px_1px_0px_rgba(30,31,34,1)]"
                          : "bg-white/80 text-retro-charcoal border-retro-charcoal/40 hover:border-retro-charcoal hover:bg-white"
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <AnimatePresence mode="popLayout">
                    {stories
                      .filter((s) => {
                        if (selectedStoryFilter === "Tất cả") return true;
                        if (selectedStoryFilter === "mine") return s.isCustom === true;
                        return s.tag === selectedStoryFilter;
                      })
                      .map((story) => {
                        let cardBg = "bg-[#FCF9F2]";
                        if (story.color === "yellow") cardBg = "bg-amber-100/95";
                        if (story.color === "mint") cardBg = "bg-emerald-100/95";
                        if (story.color === "pink") cardBg = "bg-rose-100/95";

                        return (
                          <motion.div
                            key={story.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className={`border-2 border-retro-charcoal rounded-xl p-5 shadow-[4px_4px_0px_#1e1f22] flex flex-col justify-between min-h-[220px] relative transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1e1f22] ${cardBg}`}
                          >
                            {/* Pushpin red dot overlay */}
                            <div className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full bg-red-600 shadow-[0_2px_4px_rgba(0,0,0,0.25)] border-2 border-white flex items-center justify-center pointer-events-none select-none z-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-85"></div>
                            </div>

                            {/* Retro Stamp overlay on the card */}
                            {story.stamp && story.stamp !== "default" && (
                              <div className="absolute top-8 right-4 w-10 h-10 border-2 border-dashed border-red-500/20 rounded-full flex items-center justify-center text-red-500/20 rotate-[-12deg] pointer-events-none select-none z-0">
                                {story.stamp === "bicycle" && <Bike className="w-5 h-5 opacity-40" />}
                                {story.stamp === "radio" && <RadioIcon className="w-5 h-5 opacity-40" />}
                                {story.stamp === "letter" && <Mail className="w-5 h-5 opacity-40" />}
                                {story.stamp === "ticket" && <Ticket className="w-5 h-5 opacity-40" />}
                              </div>
                            )}

                            <div className="relative z-10">
                              {/* Card Header tag */}
                              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-dashed border-retro-charcoal/15">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-mono bg-retro-charcoal text-[#FCF9F2] px-2 py-0.5 rounded border border-retro-charcoal select-none uppercase tracking-wider font-bold">
                                    {story.tag}
                                  </span>
                                  {story.isCustom && (
                                    <span className="text-[8px] font-mono bg-retro-red text-white px-1.5 py-0.5 rounded border border-retro-charcoal select-none font-bold uppercase animate-pulse">
                                      Của bạn
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] font-mono text-retro-charcoal/65 font-bold">{story.date}</span>
                              </div>

                              {/* Title */}
                              <h5 className="font-display font-black text-base text-retro-charcoal leading-snug mb-2 select-text uppercase tracking-tight">
                                {story.title}
                              </h5>

                              {/* Content */}
                              <p className="text-xs text-retro-gray leading-relaxed font-sans mb-4 whitespace-pre-line select-text">
                                "{story.content}"
                              </p>
                            </div>

                            {/* Card Footer info */}
                            <div className="border-t border-dashed border-retro-charcoal/20 pt-3 mt-auto relative z-10">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <div className="font-sans">
                                  <span className="font-display font-bold text-retro-charcoal block text-[12px] leading-tight mb-0.5">{story.author}</span>
                                  <span className="text-[9px] text-retro-red font-mono font-bold uppercase tracking-wider">{story.relation}</span>
                                </div>
                                
                                {/* Interactions (Like + Delete) */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleLikeStory(story.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-red-50 text-red-500 border-2 border-retro-charcoal hover:shadow-[2px_2px_0px_rgba(30,31,34,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-[10px] font-bold"
                                  >
                                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                                    <span>{story.likes}</span>
                                  </button>
                                  
                                  {story.isCustom && (
                                    <button
                                      onClick={() => handleDeleteStory(story.id)}
                                      className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-retro-gray hover:text-retro-red border-2 border-retro-charcoal hover:shadow-[2px_2px_0px_rgba(30,31,34,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                                      title="Xóa ký ức"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </div>
              </div>
              
            </div>
          </div>
        </section>
      )}

      {/* GAME ASSESSMENT SECTION / TẦNG 4A */}
      {activeTab === "interactive" && (
        <>
          <section className="bg-retro-cream border-t-2 border-b-2 border-retro-charcoal py-16 px-4 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          
          <div className="text-center mb-10">
            <span className="px-3 py-1 bg-retro-yellow text-retro-charcoal font-mono text-xs font-bold uppercase tracking-widest border border-retro-charcoal rounded-full shadow-sm">
              Hoạt Động Tương Tác 01 🕹️
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold uppercase mt-3 tracking-tight text-retro-charcoal">
              Trò Chơi Duyệt Chính Sách Kinh Tế
            </h2>
            <p className="text-sm text-retro-gray max-w-xl mx-auto mt-2">
              Kéo thả hoặc lựa chọn nhanh các tấm thẻ chính sách kinh tế vào đúng hai tủ rương [Bao Cấp] hoặc [Hạch Toán Mới] để đột phá nhận thức tư duy đổi mới.
            </p>
          </div>

          {/* FIRST INTERACTION: SORTING GAME */}
          <div className="bg-white border-2 border-retro-charcoal rounded-2xl p-6 shadow-[5px_5px_0px_#1e1f22] relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-retro-yellow font-mono text-[9px] font-bold text-retro-charcoal border-l border-b border-retro-charcoal rounded-bl-lg uppercase tracking-wider">
              Trực quan hóa tư duy
            </div>

            <h3 className="text-lg md:text-xl font-display font-extrabold text-retro-charcoal uppercase mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-retro-yellow" />
              Duyệt chính sách kinh tế
            </h3>
            <p className="text-xs text-retro-gray mb-4 font-sans leading-relaxed">
              <strong>Nhiệm vụ:</strong> Kéo các tấm thẻ chính sách kinh tế vào hai chiếc rương chứa <strong className="text-retro-red">[ Bao Cấp ]</strong> hoặc <strong className="text-retro-mint">[ Hạch Toán Mới ]</strong> sao cho thích hợp nhất. 
              <span className="block mt-1 italic text-[11px] text-retro-orange font-mono">
                *Lời khuyên: Bạn có thể nhấn trực tiếp các nút trên thẻ trên điện thoại!
              </span>
            </p>

            {/* Chest drops zones visual */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              
              {/* OLD SUBSIDY CHEST */}
              <div 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "bao_cap")}
                className="bg-red-50/50 border-2 border-dashed border-retro-red rounded-xl p-4 flex flex-col items-center justify-between text-center min-h-[140px] transition-all hover:bg-red-50 relative"
              >
                <div className="text-2xl select-none">📦</div>
                <h4 className="text-sm font-display font-black text-retro-red uppercase tracking-tight mt-1.5">
                  Cơ Chế Bao Cấp Cũ
                </h4>
                <div className="text-xs font-mono text-retro-gray mt-1 uppercase font-semibold">
                  Đặt tại đây
                </div>

                {/* Render already sorted items inside chest */}
                <div className="w-full mt-3 space-y-1">
                  {DRAG_ITEMS.filter(item => sortedCards[item.id] === "bao_cap").map(item => (
                    <div key={item.id} className="bg-white border border-retro-red rounded py-1 px-1.5 text-xs text-retro-red font-mono flex items-center justify-between">
                      <span className="truncate">{item.text.slice(0, 20)}...</span>
                      <Check className="w-3.5 h-3.5 text-retro-mint shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* NEW INDOOR COMMERCE CHEST */}
              <div 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "hach_toan")}
                className="bg-emerald-50/50 border-2 border-dashed border-retro-mint rounded-xl p-4 flex flex-col items-center justify-between text-center min-h-[140px] transition-all hover:bg-emerald-50 relative"
              >
                <div className="text-2xl select-none">🪙</div>
                <h4 className="text-sm font-display font-black text-retro-mint uppercase tracking-tight mt-1.5">
                  Cơ Chế Hạch Toán Mới
                </h4>
                <div className="text-xs font-mono text-retro-gray mt-1 uppercase font-semibold">
                  Đặt tại đây
                </div>

                {/* Render already sorted items inside chest */}
                <div className="w-full mt-3 space-y-1">
                  {DRAG_ITEMS.filter(item => sortedCards[item.id] === "hach_toan").map(item => (
                    <div key={item.id} className="bg-white border border-retro-mint rounded py-1 px-1.5 text-xs text-retro-mint font-mono flex items-center justify-between">
                      <span className="truncate">{item.text.slice(0, 20)}...</span>
                      <Check className="w-3.5 h-3.5 text-retro-mint shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Policy cards stack visual */}
            <div className="space-y-3.5">
              {gameFinished ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-retro-mint bg-opacity-10 rounded-xl p-5 text-center border-2 border-retro-mint text-retro-mint mb-2"
                >
                  <Award className="w-12 h-12 mx-auto mb-2 animate-bounce" />
                  <h4 className="font-display font-extrabold text-base uppercase">Thắng lợi vẻ vang! 🎉</h4>
                  <p className="text-sm text-retro-charcoal mt-1.5 leading-relaxed">
                    Bạn đã sắp đặt chuẩn xác 100% các tư duy chính sách trước thềm đổi mới! Từ đó mở toang cơ chế kìm kẹp phát triển đất nước.
                  </p>
                  <button 
                    onClick={resetGame}
                    className="mt-4 px-5 py-2.5 bg-retro-mint hover:bg-emerald-600 font-display font-bold text-sm text-white rounded border border-retro-charcoal transition-all inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Chơi Lại Từ Đầu
                  </button>
                </motion.div>
              ) : (
                <div>
                  <div className="text-xs font-mono text-retro-gray mb-2 uppercase tracking-wide font-bold">
                    Thẻ bày sẵn ({DRAG_ITEMS.filter(item => !sortedCards[item.id]).length} thẻ còn lại):
                  </div>
                  
                  <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                    <AnimatePresence mode="popLayout">
                      {DRAG_ITEMS.filter(item => !sortedCards[item.id]).map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: -20 }}
                          transition={{ duration: 0.25 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          className={`bg-retro-cream border-2 border-retro-charcoal rounded-lg p-3.5 cursor-grab active:cursor-grabbing transition-transform select-none relative ${
                            wrongFeedbackId === item.id ? "animate-shake bg-red-100 border-retro-red" : "hover:scale-[1.01]"
                          }`}
                        >
                          <div className="text-sm font-medium text-retro-charcoal pr-8 leading-relaxed">
                            {item.text}
                          </div>
                          
                          {/* Display wrong warning badge */}
                          {wrongFeedbackId === item.id && (
                            <div className="absolute top-2 right-2 text-xs font-mono font-bold text-retro-red uppercase animate-pulse">
                              Sai rương! ❌
                            </div>
                          )}

                          {/* Instant responsive button helpers for touch platforms / easy click experience */}
                          <div className="flex flex-wrap gap-2.5 mt-3.5 pt-3 border-t border-dashed border-retro-border">
                            <span className="text-xs font-mono text-retro-gray my-auto hidden sm:block">Lựa chọn nhanh:</span>
                            <button
                              onClick={() => sortCard(item.id, "bao_cap")}
                              className="px-2.5 py-1.5 rounded bg-red-100 hover:bg-red-200 text-retro-red text-xs font-mono font-bold border border-retro-charcoal/20 transition-transform active:scale-95 z-10 relative"
                            >
                              ← Chọn Bao Cấp
                            </button>
                            <button
                              onClick={() => sortCard(item.id, "hach_toan")}
                              className="px-2.5 py-1.5 rounded bg-emerald-100 hover:bg-emerald-200 text-retro-mint text-xs font-mono font-bold border border-retro-charcoal/20 transition-transform active:scale-95 z-10 relative"
                            >
                              Chọn Hạch Toán →
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

          </div>

        </motion.div>
      </section>

      {/* QUIZ ASSESSMENT SECTION / TẦNG 4B */}
      <section className="bg-retro-cream border-t-2 border-b-4 border-retro-charcoal py-16 px-4 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto"
        >
          
          <div className="text-center mb-10">
            <span className="px-3 py-1 bg-retro-orange text-white font-mono text-xs font-bold uppercase tracking-widest border border-retro-charcoal rounded-full shadow-sm">
              Hoạt Động Tương Tác 02 📝
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold uppercase mt-3 tracking-tight text-retro-charcoal">
              Khảo Sát Nhận Thức Sử Học
            </h2>
            <p className="text-sm text-retro-gray max-w-xl mx-auto mt-2">
              Ôn luyện các mốc thời điểm, nghị quyết then chốt trong chặng đường dựng nước qua bài kiểm tra lịch sử Đảng.
            </p>
          </div>

          {/* SECOND INTERACTION: QUIZ */}
          <div className="bg-white border-2 border-retro-charcoal rounded-2xl p-6 shadow-[5px_5px_0px_#1e1f22] relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-retro-orange font-mono text-[9px] font-bold text-white border-l border-b border-retro-charcoal rounded-bl-lg uppercase tracking-wider">
              Trắc nghiệm nhanh
            </div>

            <h3 className="text-lg md:text-xl font-display font-extrabold text-retro-charcoal uppercase mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-5 h-5 text-retro-orange" />
              Khảo sát nhận thức sử học
            </h3>
            
            {!quizCompleted ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuizIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <span className="text-xs font-mono font-bold text-retro-gray uppercase">
                      Câu hỏi {currentQuizIdx + 1} / {QUIZ_QUESTIONS.length}
                    </span>
                    <span className="text-xs font-mono bg-retro-cream px-2 py-0.5 rounded text-retro-orange font-bold">
                      Điểm: {quizCumulativeScore}
                    </span>
                  </div>

                  <h4 className="text-sm md:text-base font-display font-bold text-retro-charcoal leading-snug mb-4">
                    {QUIZ_QUESTIONS[currentQuizIdx].question}
                  </h4>

                  {/* Render Options list */}
                  <div className="space-y-2.5 mb-5">
                    {QUIZ_QUESTIONS[currentQuizIdx].options.map((option, idx) => {
                      let btnStyle = "bg-retro-cream hover:bg-amber-50 text-retro-charcoal border-retro-border";
                      
                      if (quizSelectedOption === idx && !quizSubmitted) {
                        btnStyle = "bg-orange-50 border-retro-orange text-retro-charcoal";
                      } else if (quizSubmitted) {
                        if (idx === QUIZ_QUESTIONS[currentQuizIdx].correctAnswer) {
                          btnStyle = "bg-emerald-100 border-retro-mint text-emerald-800 font-bold";
                        } else if (quizSelectedOption === idx) {
                          btnStyle = "bg-red-100 border-retro-red text-red-800";
                        } else {
                          btnStyle = "bg-slate-50 text-slate-400 border-slate-200 opacity-60";
                        }
                      }

                      return (
                        <motion.button
                          key={idx}
                          disabled={quizSubmitted}
                          onClick={() => handleQuizOptionClick(idx)}
                          whileHover={!quizSubmitted ? { scale: 1.01, x: 4 } : {}}
                          whileTap={!quizSubmitted ? { scale: 0.99 } : {}}
                          className={`w-full text-left p-3.5 rounded-lg text-sm font-sans tracking-tight border-2 transition-all flex items-start gap-2.5 ${btnStyle}`}
                        >
                          <span className="w-5.5 h-5.5 rounded bg-white shadow-sm border text-xs font-bold flex items-center justify-center shrink-0 font-mono text-retro-charcoal">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 leading-relaxed">{option}</span>
                          
                          {quizSubmitted && idx === QUIZ_QUESTIONS[currentQuizIdx].correctAnswer && (
                            <Check className="w-4.5 h-4.5 text-retro-mint shrink-0 my-auto" />
                          )}
                          {quizSubmitted && quizSelectedOption === idx && idx !== QUIZ_QUESTIONS[currentQuizIdx].correctAnswer && (
                            <X className="w-4.5 h-4.5 text-retro-red shrink-0 my-auto" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Submit actions & explanation */}
                  <div className="space-y-4">
                    {!quizSubmitted ? (
                      <button
                        onClick={submitQuizAnswer}
                        disabled={quizSelectedOption === null}
                        className={`w-full py-3.5 bg-retro-orange hover:bg-orange-500 font-display font-bold text-sm uppercase tracking-wider text-white rounded-lg border-2 border-retro-charcoal shadow-[3px_3px_0px_#1e1f22] transition-all flex items-center justify-center gap-1.5 ${
                          quizSelectedOption === null ? "opacity-50 cursor-not-allowed" : "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e1f22]"
                        }`}
                      >
                        Xác nhận câu trả lời
                        <CheckCircle2 className="w-4.5 h-4.5" />
                      </button>
                    ) : (
                      <div className="space-y-3.5">
                        {/* Explanation block */}
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-retro-cream p-4 rounded-lg border border-retro-border text-sm leading-relaxed"
                        >
                          <div className="font-mono font-bold text-xs uppercase text-retro-orange mb-1.5 flex items-center gap-1">
                            <Info className="w-4 h-4 text-retro-orange" />
                            Giải thích lịch sử Đảng:
                          </div>
                          <p className="text-retro-gray">{QUIZ_QUESTIONS[currentQuizIdx].explanation}</p>
                        </motion.div>

                        <button
                          onClick={nextQuizQuestion}
                          className="w-full py-3.5 bg-retro-charcoal hover:bg-retro-gray font-display font-bold text-sm uppercase tracking-wider text-white rounded-lg transition-all flex items-center justify-center gap-1.5"
                        >
                          Tiếp theo
                          <ChevronRight className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6 select-none"
              >
                <Award className="w-16 h-16 mx-auto mb-2 text-retro-yellow animate-bounce" />
                <h4 className="font-display font-bold text-lg uppercase tracking-tight text-retro-charcoal">
                  Hoàn thành bài kiểm tra lịch sử
                </h4>
                
                <div className="text-5xl font-display font-extrabold text-retro-red my-4">
                  {quizCumulativeScore} / {QUIZ_QUESTIONS.length}
                </div>

                <p className="text-sm text-retro-gray max-w-xs mx-auto leading-relaxed mb-6">
                  {quizCumulativeScore === QUIZ_QUESTIONS.length 
                    ? "Xuất sắc! Bạn đã có nhận thức lịch sử vô cùng tường tận, am hiểu sâu sắc mốc chuyển mình kinh tế nước nhà!"
                    : "Khá tốt! Bạn đã thu nhặt được các mốc thời điểm, nghị quyết quan trọng nhất trong chặng đường dựng nước."}
                </p>

                <button
                  onClick={restartQuiz}
                  className="px-6 py-3 bg-retro-red text-white hover:bg-retro-red-dark font-display font-bold text-sm uppercase rounded border-2 border-retro-charcoal shadow-[3px_3px_0px_#1e1f22] inline-flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-4.5 h-4.5" /> Thử sức lại
                </button>
              </motion.div>
            )}

          </div>

        </motion.div>
      </section>
        </>
      )}

      {/* DETAILED COORDINATION BOARD (FOOTER SECTION) / TẦNG 5 */}
      {activeTab === "report" && (
        <>
          <section id="footer-tab" className="bg-retro-cream text-retro-charcoal border-t-4 border-retro-charcoal py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          
          <div className="text-center mb-12">
            <span className="px-3 py-1 bg-retro-charcoal/5 text-retro-orange font-mono text-[10px] font-bold uppercase tracking-widest border border-retro-charcoal/20 rounded-full">
              Thẩm Định Tiêu Chí Phân Cấp 🇻🇳
            </span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="w-10 h-0.5 bg-retro-charcoal/30"></span>
              <h2 className="text-2xl md:text-4xl font-display font-extrabold uppercase tracking-tight text-retro-charcoal">
                MÔ HÌNH PHỐI HỢP AI & HUMAN
              </h2>
              <span className="w-10 h-0.5 bg-retro-charcoal/30"></span>
            </div>
            <p className="text-sm text-retro-gray mt-2 max-w-xl mx-auto leading-relaxed">
              Minh chứng trực quan về sự cộng tác biên niên sử thông minh giữa trợ lý thiết kế AI và con người (sinh viên kiểm duyệt) để thiết lập công nghệ giáo dục đổi mới.
            </p>
          </div>

          {/* Grid layout containing AI performance and Human audit columns side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-10">
            
            {/* AI ROLE COL */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-2 border-retro-charcoal rounded-2xl p-6 flex flex-col justify-between shadow-[4px_4px_0px_rgba(30,31,34,1)]"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4 border-b border-retro-border pb-4">
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-retro-red to-orange-600 text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.4)] border border-white/20 hover:scale-105 transition-all duration-300 select-none shrink-0 group">
                    <Bot className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold leading-none text-retro-charcoal text-base">
                      {COLLABORATIVE_TASKS[0].title}
                    </h4>
                    <span className="text-xs font-mono text-retro-orange uppercase font-bold tracking-wider">
                      Trợ lý Kỹ thuật & Sinh mã
                    </span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {COLLABORATIVE_TASKS[0].details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-retro-gray leading-relaxed font-sans flex items-start gap-2">
                      <span className="text-retro-red font-bold shrink-0 mt-0.5">⚡</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-retro-border text-xs font-mono text-retro-gray uppercase tracking-widest font-semibold">
                Trạng thái: Hoàn thiện tối ưu 100%
              </div>
            </motion.div>

            {/* HUMAN ROLE COL */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-2 border-retro-charcoal rounded-2xl p-6 flex flex-col justify-between shadow-[4px_4px_0px_rgba(30,31,34,1)]"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4 border-b border-retro-border pb-4">
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-emerald-600 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-white/20 hover:scale-105 transition-all duration-300 select-none shrink-0 group">
                    <UserCheck className="w-6 h-6 text-white group-hover:-rotate-6 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold leading-none text-retro-charcoal text-base">
                      {COLLABORATIVE_TASKS[1].title}
                    </h4>
                    <span className="text-xs font-mono text-retro-mint uppercase font-bold tracking-wider">
                      Sinh viên làm chủ & Thẩm định
                    </span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {COLLABORATIVE_TASKS[1].details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-retro-gray leading-relaxed font-sans flex items-start gap-2">
                      <span className="text-retro-mint font-bold shrink-0 mt-0.5">✓</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-retro-border text-xs font-mono text-retro-gray uppercase tracking-widest font-semibold">
                Trương kiểm duyệt: Sinh viên hoàn tất kiểm duyệt 100%
              </div>
            </motion.div>

          </div>

          {/* Core metadata credits details / design credentials labels */}
          <div className="border-t border-retro-charcoal/20 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-retro-gray font-mono gap-4 text-center sm:text-left">
            <div>
              &copy; 1975 - 1986 HÀNH TRÌNH ĐỔI MỚI KINH TẾ VIỆT NAM. 
              <br/>
              Bản ghi giáo khoa lịch sử Đảng phục vụ bảo vệ đồ án và thuyết trình khoa học.
            </div>
            

          </div>

        </motion.div>
      </section>

      {/* LÝ DO THỰC HIỆN SẢN PHẨM */}
      <section className="bg-retro-cream border-t-4 border-b-4 border-retro-charcoal py-12 px-4 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white border-4 border-retro-charcoal rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_rgba(30,31,34,1)] relative overflow-hidden">
            {/* Corner retro badge */}
            <div className="absolute top-0 right-0 bg-retro-orange text-white text-[10px] font-mono font-bold px-3 py-1 uppercase tracking-widest border-b-2 border-l-2 border-retro-charcoal rounded-bl-xl">
              Ý nghĩa khoa học
            </div>

            <div className="mb-6">
              <span className="px-3 py-1 bg-retro-yellow text-retro-charcoal font-mono text-xs font-bold uppercase tracking-widest border border-retro-charcoal rounded-full shadow-sm">
                Giai đoạn lịch sử 1975 - 1986
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-black text-retro-charcoal mt-3 uppercase tracking-tight">
                LÝ DO THỰC HIỆN SẢN PHẨM
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-retro-cream/50 p-5 rounded-xl border-2 border-retro-charcoal hover:shadow-[4px_4px_0px_rgba(30,31,34,1)] transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-retro-red font-bold text-lg">💡</span>
                  <h3 className="font-display font-bold text-retro-charcoal uppercase text-sm tracking-wide">
                    Về lý luận
                  </h3>
                </div>
                <p className="text-sm text-retro-gray leading-relaxed font-sans">
                  Hệ thống hóa bước chuyển tư duy quan trọng của Đảng; từ cơ chế bao cấp, duy ý chí sang thừa nhận quy luật thị trường (qua các cột mốc "Khoán chui", Chỉ thị 100, đổi mới "Giá - Lương - Tiền"); khẳng định hai nhiệm vụ chiến lược: Xây dựng và Bảo vệ Tổ quốc.
                </p>
              </div>

              <div className="bg-retro-cream/50 p-5 rounded-xl border-2 border-retro-charcoal hover:shadow-[4px_4px_0px_rgba(30,31,34,1)] transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-retro-mint font-bold text-lg">⚙️</span>
                  <h3 className="font-display font-bold text-retro-charcoal uppercase text-sm tracking-wide">
                    Về thực tiễn
                  </h3>
                </div>
                <p className="text-sm text-retro-gray leading-relaxed font-sans">
                  Số hóa và trực quan hóa các văn kiện, số liệu khô khan thành sản phẩm dễ tiếp cận; tái hiện sinh động khát vọng "xé rào" sáng tạo của nhân dân; đồng thời giáo dục lòng yêu nước và bài học "nhìn thẳng vào sự thật" để đổi mới.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
        </>
      )}

      {/* LIGHTBOX DETAILED MODAL */}
      <AnimatePresence>
        {activeLightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-retro-charcoal/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#FCF9F2] border-4 border-retro-charcoal rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-2 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveLightboxImage(null)}
                className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full border-2 border-retro-charcoal bg-white text-retro-charcoal hover:bg-retro-red hover:text-white transition-colors flex items-center justify-center shadow"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image side */}
              <div className="bg-[#1E1F22] flex items-center justify-center p-4 relative min-h-[300px] md:min-h-0 border-b-2 md:border-b-0 md:border-r-2 border-retro-charcoal">
                <img
                  src={activeLightboxImage.src}
                  alt={activeLightboxImage.title}
                  className="max-w-full max-h-[70vh] object-contain rounded border border-white/10"
                />
                <span className="absolute bottom-4 left-4 bg-black/60 text-white font-mono text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                  {activeLightboxImage.archiveId}
                </span>
              </div>

              {/* Info/Metadata side */}
              <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[70vh] md:max-h-none bg-[radial-gradient(rgba(30,31,34,0.04)_1px,transparent_1px)] bg-[size:16px_16px]">
                <div>
                  <span className="px-2.5 py-1 bg-retro-red/10 border border-retro-red/30 rounded text-retro-red font-mono text-[10px] uppercase font-bold tracking-widest inline-block mb-3">
                    {activeLightboxImage.category}
                  </span>
                  
                  <h3 className="text-2xl md:text-3xl font-display font-black text-retro-charcoal leading-tight uppercase mb-2">
                    {activeLightboxImage.title}
                  </h3>
                  
                  <p className="text-xs text-retro-gray italic font-sans leading-relaxed mb-4 border-l-2 border-retro-orange pl-3 py-1">
                    "{activeLightboxImage.caption}"
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="text-[11px] font-mono text-retro-gray uppercase tracking-wider font-extrabold mb-1">
                        Bối cảnh Lịch sử / Giá trị tư liệu:
                      </h4>
                      <p className="text-sm text-retro-charcoal leading-relaxed font-sans font-light">
                        {activeLightboxImage.detailedContext}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata Table */}
                <div className="border-t-2 border-retro-charcoal pt-4 mt-auto relative">
                  {/* Decorative Seal inside modal */}
                  <div className="absolute right-0 bottom-12 rotate-[-12deg] opacity-90 select-none pointer-events-none hidden sm:block">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-500/60 flex flex-col items-center justify-center text-red-500/60 font-display font-black text-[9px] uppercase tracking-tighter bg-white/20 leading-none">
                      <span>ẤN CHỈ SỬ LIỆU</span>
                      <span className="text-[7px] mt-1 border-t border-red-500/30 border-dashed pt-1 px-1">ĐÃ KIỂM CHỨNG</span>
                    </div>
                  </div>

                  <h4 className="text-[10px] font-mono text-retro-gray uppercase tracking-wider font-extrabold mb-2">
                    Biểu thông tin lưu trữ thư mục:
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div className="flex justify-between border-b border-retro-border pb-1 font-sans">
                      <span className="text-retro-gray font-light">Ký hiệu:</span>
                      <span className="font-mono font-bold text-retro-charcoal">{activeLightboxImage.archiveId}</span>
                    </div>
                    <div className="flex justify-between border-b border-retro-border pb-1 font-sans">
                      <span className="text-retro-gray font-light">Tác giả:</span>
                      <span className="font-semibold text-retro-charcoal">{activeLightboxImage.author.split(" (")[0]}</span>
                    </div>
                    <div className="flex justify-between border-b border-retro-border pb-1 font-sans">
                      <span className="text-retro-gray font-light">Thời điểm:</span>
                      <span className="font-semibold text-retro-charcoal">{activeLightboxImage.date}</span>
                    </div>
                    <div className="flex justify-between border-b border-retro-border pb-1 font-sans">
                      <span className="text-retro-gray font-light">Địa điểm:</span>
                      <span className="font-semibold text-retro-charcoal">{activeLightboxImage.place.split(" (")[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Firebase Runtime Setup Modal */}
      <AnimatePresence>
        {showFirebaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-retro-cream border-4 border-retro-charcoal rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0px_#1e1f22] relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowFirebaseModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white border-2 border-retro-charcoal hover:bg-retro-red hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4 border-b-2 border-retro-charcoal/20 pb-3">
                <div className="p-3 bg-retro-red text-white rounded-2xl shadow-sm">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-extrabold text-retro-charcoal uppercase leading-tight">
                    Cấu Hình Firebase Realtime
                  </h3>
                  <p className="text-xs font-mono text-retro-gray">Đồng bộ Cloud Firestore giữa các học viên</p>
                </div>
              </div>

              <div className="mb-5 p-3 rounded-xl border-2 border-retro-charcoal/20 bg-white/70 text-xs font-sans text-retro-charcoal flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-retro-red shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Trạng thái hiện tại: </span>
                  {isFirebaseEnabled ? (
                    <span className="text-emerald-700 font-bold">🔥 Đã kết nối Cloud Firestore Realtime</span>
                  ) : (
                    <span className="text-amber-700 font-bold">💾 Ngoại tuyến (LocalStorage)</span>
                  )}
                  <p className="mt-1 text-[11px] text-retro-gray leading-relaxed">
                    Nếu trang Vercel chưa được cấu hình biến môi trường, bạn có thể điền <strong>API Key</strong> và <strong>Project ID</strong> của Firebase trực tiếp tại đây để kết nối thời gian thực ngay lập tức!
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const apiKey = (formData.get("apiKey") as string || "").trim();
                  const projectId = (formData.get("projectId") as string || "").trim();
                  const authDomain = (formData.get("authDomain") as string || "").trim() || `${projectId}.firebaseapp.com`;
                  const storageBucket = (formData.get("storageBucket") as string || "").trim() || `${projectId}.appspot.com`;
                  const appId = (formData.get("appId") as string || "").trim();

                  if (!apiKey || !projectId) {
                    alert("Vui lòng nhập ít nhất API Key và Project ID!");
                    return;
                  }

                  saveCustomFirebaseConfig({
                    apiKey,
                    projectId,
                    authDomain,
                    storageBucket,
                    appId
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-mono font-bold text-retro-charcoal uppercase mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-retro-red" />
                    Firebase API Key <span className="text-retro-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="apiKey"
                    defaultValue={firebaseConfig.apiKey || ""}
                    placeholder="AIzaSy..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-retro-charcoal bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-retro-red shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-retro-charcoal uppercase mb-1">
                    Project ID <span className="text-retro-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="projectId"
                    defaultValue={firebaseConfig.projectId || ""}
                    placeholder="ví dụ: vnr201-family-stories"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-retro-charcoal bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-retro-red shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-retro-gray uppercase mb-1">
                      Auth Domain (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      name="authDomain"
                      defaultValue={firebaseConfig.authDomain || ""}
                      placeholder="project.firebaseapp.com"
                      className="w-full px-3 py-2 rounded-xl border border-retro-charcoal/40 bg-white/90 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-retro-gray uppercase mb-1">
                      App ID (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      name="appId"
                      defaultValue={firebaseConfig.appId || ""}
                      placeholder="1:123456:web:abc..."
                      className="w-full px-3 py-2 rounded-xl border border-retro-charcoal/40 bg-white/90 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t-2 border-retro-charcoal/20">
                  <button
                    type="submit"
                    className="w-full sm:flex-1 py-3 px-4 bg-retro-red text-white font-display font-extrabold text-sm uppercase rounded-xl border-2 border-retro-charcoal shadow-[3px_3px_0px_#1e1f22] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#1e1f22] transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Lưu & Kết Nối Ngay
                  </button>
                  
                  {isFirebaseEnabled && (
                    <button
                      type="button"
                      onClick={() => clearCustomFirebaseConfig()}
                      className="w-full sm:w-auto py-3 px-4 bg-white text-retro-charcoal font-sans font-bold text-xs uppercase rounded-xl border-2 border-retro-charcoal hover:bg-gray-100 transition-all"
                    >
                      Xóa / Ngắt Kết Nối
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
