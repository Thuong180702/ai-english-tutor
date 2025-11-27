import React, { useState, useEffect, useRef } from 'react';
import { Send, Lightbulb, CheckCircle, XCircle, RefreshCw, BookOpen, ArrowRight, Sparkles, Brain, RotateCcw, AlertCircle, Loader2, Moon, Sun, AlertTriangle, Info, Search, Book, ChevronUp, User, History, LogOut, Calendar, Award, SkipForward, GitCompare, Mail, Lock, ChevronRight, X, KeyRound } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged, 
  updateProfile, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, deleteDoc, doc } from 'firebase/firestore';

// --- FIREBASE SETUP ---
// Cấu hình thủ công (Manual Config) cho dự án của bạn
const manualFirebaseConfig = {
  apiKey: "AIzaSyBeQemubnB8jBWLiPZob5HiDC4yubuxupI",
  authDomain: "learn-d8e71.firebaseapp.com",
  projectId: "learn-d8e71",
  storageBucket: "learn-d8e71.firebasestorage.app",
  messagingSenderId: "1098133970936",
  appId: "1:1098133970936:web:fed75c94fc73c36585000d",
  measurementId: "G-VH6H0XJKLP"
};

// Ưu tiên dùng biến môi trường nếu có, nếu không dùng config thủ công
// eslint-disable-next-line no-undef
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : manualFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// eslint-disable-next-line no-undef
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- STYLES ---
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
    body, textarea, input, button { font-family: 'Be Vietnam Pro', sans-serif !important; }
    .diff-anim { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
    .score-circle { transition: stroke-dashoffset 1s ease-in-out; transform: rotate(-90deg); transform-origin: 50% 50%; }
  `}</style>
);

// --- CONSTANTS ---
const TOPIC_POOL = [
  "Startup công nghệ", "Trí tuệ nhân tạo", "Khoa học vũ trụ", "Công nghệ Blockchain", 
  "Du lịch bụi", "Ẩm thực đường phố", "Lối sống tối giản", "Sức khỏe tinh thần",
  "Email công việc", "Kỹ năng đàm phán", "Tài chính cá nhân", "Lãnh đạo nhóm",
  "Review phim", "Lịch sử thế giới", "Nhiếp ảnh đường phố", "Biến đổi khí hậu"
];

// --- DIFF ALGORITHM ---
const getWordDiff = (userText, targetText) => {
  const normalizeQuotes = (s) => s.replace(/['’‘]/g, "'");
  const tokenize = (text) => normalizeQuotes(text).replace(/([.,!?;:()])/g, " $1 ").trim().split(/\s+/);
  const cleanWord = (w) => w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "");

  const uWords = tokenize(userText);
  const tWords = tokenize(targetText);
  
  const m = uWords.length;
  const n = tWords.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const uClean = cleanWord(uWords[i - 1]);
      const tClean = cleanWord(tWords[j - 1]);
      const isMatch = uWords[i - 1].toLowerCase() === tWords[j - 1].toLowerCase() || (uClean !== "" && uClean === tClean);
      if (isMatch) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  let i = m, j = n;
  const diff = [];
  while (i > 0 && j > 0) {
    const uClean = cleanWord(uWords[i - 1]);
    const tClean = cleanWord(tWords[j - 1]);
    const isMatch = uWords[i - 1].toLowerCase() === tWords[j - 1].toLowerCase() || (uClean !== "" && uClean === tClean);

    if (isMatch) {
      diff.unshift({ type: 'same', value: uWords[i - 1] });
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      diff.unshift({ type: 'remove', value: uWords[i - 1] });
      i--;
    } else {
      diff.unshift({ type: 'add', value: tWords[j - 1] });
      j--;
    }
  }
  while (i > 0) { diff.unshift({ type: 'remove', value: uWords[i - 1] }); i--; }
  while (j > 0) { diff.unshift({ type: 'add', value: tWords[j - 1] }); j--; }

  const groupedDiff = [];
  for (let k = 0; k < diff.length; k++) {
    if (diff[k].type === 'remove' && diff[k+1]?.type === 'add') {
      groupedDiff.push({ type: 'replace', oldVal: diff[k].value, newVal: diff[k+1].value });
      k++;
    } else {
      groupedDiff.push(diff[k]);
    }
  }
  return groupedDiff;
};

// --- API HANDLING ---
// API Key
const apiKey = "AIzaSyBtrP2VSn4lURWTx1wKnAMRr-P1uy8mofE";

const generateLessonContent = async (topic, lengthOption) => {
  let lengthPrompt = "";
  switch (lengthOption) {
      case 'short': lengthPrompt = "Generate a SHORT story/essay (approx 5-8 sentences). Keep it concise."; break;
      case 'medium': lengthPrompt = "Generate a MEDIUM length story/essay (approx 12-15 sentences)."; break;
      case 'long': lengthPrompt = "Generate a LONG, DETAILED story/essay (more than 20 sentences). Elaborate on details."; break;
      default: lengthPrompt = "Generate a MEDIUM length story/essay (approx 10-15 sentences).";
  }

  const systemPrompt = `
    You are an expert English tutor for Vietnamese students.
    Task: Create a translation lesson based on the topic: "${topic}".
    CRITICAL REQUIREMENT: ${lengthPrompt}. Split content into logical sentences.
    Output Format: STRICT JSON ONLY. No markdown.
    JSON Structure: {
      "title": "Short catchy title in Vietnamese",
      "type": "Story/Article/Email/Essay",
      "sentences": [
        {
          "id": 1,
          "vietnamese_full": "Full Vietnamese sentence",
          "segments": [{"text": "VN word", "trans": "EN meaning"}],
          "acceptableAnswers": ["Full English sentence 1", "Full English sentence 2"],
          "grammar_hint": "Explain grammar/usage in Vietnamese",
          "structure": "Formula (S+V+O)",
          "example_en": "English example",
          "example_vi": "Vietnamese example",
          "vocabulary": [{"word": "Word", "meaning": "Meaning"}]
        }
      ]
    }
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );
    if (!response.ok) {
      console.error("API Error:", response.status, await response.text());
      throw new Error("API Call Failed");
    }
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
};

const checkSemanticMatch = async (userAnswer, originalVietnamese) => {
    const prompt = `
        You are a translation judge. Original Vietnamese: "${originalVietnamese}". User's English: "${userAnswer}".
        Task: Does the user's translation convey the CORRECT meaning? Ignore punctuation. Accept synonyms.
        Return JSON ONLY: { "isCorrect": boolean, "feedback": "Short explanation in Vietnamese if wrong, or 'Diễn đạt tốt' if correct" }
    `;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
            }
        );
        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch {
        return { isCorrect: false, feedback: "Lỗi kết nối kiểm tra." };
    }
};

// eslint-disable-next-line no-unused-vars
const analyzeErrorWithAI = async (userAnswer, correctAnswer, vietnameseContext) => {
    const prompt = `
        Context: Translating Vietnamese: "${vietnameseContext}" to English.
        Correct Answer: "${correctAnswer}"
        User's Wrong Answer: "${userAnswer}"
        Task: Explain specifically why the user's answer is wrong IN VIETNAMESE. Focus on the exact mistake. Keep it short.
    `;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch {
        return "Có lỗi nhỏ về ngữ pháp hoặc từ vựng.";
    }
};

const getRandomTopics = () => [...TOPIC_POOL].sort(() => 0.5 - Math.random()).slice(0, 4);

export default function App() {
  // --- APP STATE ---
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [appState, setAppState] = useState("login"); 
  const [topicInput, setTopicInput] = useState("");
  const [lengthOption, setLengthOption] = useState("medium");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [suggestedTopics, setSuggestedTopics] = useState(() => getRandomTopics());
  const [historyData, setHistoryData] = useState([]);
  
  // Auth States
  const [authMode, setAuthMode] = useState("login"); // login, register, forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authError, setAuthError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false); 

  // --- LEARNING STATE ---
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentSentIndex, setCurrentSentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [feedbackState, setFeedbackState] = useState("idle"); 
  const [detailedFeedback, setDetailedFeedback] = useState(null); 
  const [aiFeedbackMsg, setAiFeedbackMsg] = useState("");
  const [matchedAnswer, setMatchedAnswer] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showFullAnswer, setShowFullAnswer] = useState(false);
  const [completedSentences, setCompletedSentences] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [summaryStats, setSummaryStats] = useState({ mistakes: 0, hints: 0, fullAnswers: 0 });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, itemId: null });

  const statsRef = useRef({ mistakes: 0, hints: 0, fullAnswers: 0 });
  const sentenceStatsRef = useRef({ hintUsed: false, fullUsed: false });
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const topicInputRef = useRef(null);

  // --- AUTH & FIREBASE EFFECTS ---
  useEffect(() => {
    const initAuth = async () => {
      // eslint-disable-next-line no-undef
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        // eslint-disable-next-line no-undef
        await signInWithCustomToken(auth, __initial_auth_token);
      }
      setIsAuthChecking(false);
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (u && u.email && u.emailVerified) {
            setAppState("home");
        } else if (u && u.isAnonymous) {
            setAppState("home");
        } else if (u && u.email && !u.emailVerified) {
            // Stay on login, waiting for verification
        } else {
            setAppState("login");
        }
    });
    return () => unsubscribe();
  }, []);

  // Fetch History
  useEffect(() => {
      if (user && appState === 'history') {
          const q = query(
              collection(db, 'artifacts', appId, 'users', user.uid, 'history'),
              orderBy('timestamp', 'desc'),
              limit(20)
          );
          const unsubscribe = onSnapshot(q, (snapshot) => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setHistoryData(data);
          });
          return () => unsubscribe();
      }
  }, [user, appState]);

  useEffect(() => {
    if (appState === "learning") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      if (inputRef.current && feedbackState !== 'correct' && feedbackState !== 'checking') inputRef.current.focus();
    }
  }, [feedbackState, showHint, showFullAnswer, currentSentIndex, appState]);

  // --- AUTH HANDLERS ---

  const handleEmailLogin = async (e) => {
      e.preventDefault();
      setAuthError("");
      try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          if (userCredential.user && !userCredential.user.emailVerified) {
              await signOut(auth);
              setAuthError("Email chưa được xác thực. Vui lòng kiểm tra hộp thư.");
              return;
          }
      } catch (err) {
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
              setAuthError("Email hoặc mật khẩu không chính xác.");
          } else {
              setAuthError("Đăng nhập thất bại. Vui lòng thử lại.");
          }
      }
  };

  const handleRegister = async (e) => {
      e.preventDefault();
      setAuthError("");
      setVerificationSent(false);
      if (!displayName) { setAuthError("Vui lòng nhập tên hiển thị"); return; }
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: displayName });
          await sendEmailVerification(userCredential.user);
          setVerificationSent(true);
          await signOut(auth); 
          setAuthMode("login"); 
      } catch (err) {
          console.error(err);
          if (err.code === 'auth/email-already-in-use') {
              setAuthError("Email này đã được sử dụng. Vui lòng đăng nhập.");
          } else if (err.code === 'auth/weak-password') {
              setAuthError("Mật khẩu quá yếu.");
          } else {
              setAuthError("Đăng ký thất bại. Vui lòng thử lại.");
          }
      }
  };

  const handleResetPassword = async (e) => {
      e.preventDefault();
      setAuthError("");
      setResetEmailSent(false);
      if (!email) { setAuthError("Vui lòng nhập email."); return; }
      try {
          await sendPasswordResetEmail(auth, email);
          setResetEmailSent(true);
          setAuthError("");
      } catch {
          setAuthError("Lỗi gửi email. Vui lòng thử lại sau.");
      }
  };

  const handleGoogleLogin = async () => {
      setAuthError("");
      try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
      } catch (err) {
          setAuthError("Đăng nhập Google thất bại.");
          console.error(err);
      }
  };

  const handleGuestLogin = async () => {
      setAuthError("");
      try {
          await signInAnonymously(auth);
          setAppState("home");
      } catch {
          setAuthError("Lỗi đăng nhập khách.");
      }
  };

  const handleLogout = async () => {
      await signOut(auth);
      setAppState("login");
      setEmail("");
      setPassword("");
      setDisplayName("");
      setAuthMode("login");
      setVerificationSent(false);
  };

  // --- APP HANDLERS ---

  const handleStartGeneration = async (e) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    setAppState("generating");
    statsRef.current = { mistakes: 0, hints: 0, fullAnswers: 0 };
    sentenceStatsRef.current = { hintUsed: false, fullUsed: false };

    const lessonData = await generateLessonContent(topicInput, lengthOption);
    
    if (lessonData?.sentences?.length > 0) {
      setCurrentCourse(lessonData);
      setCurrentSentIndex(0);
      setCompletedSentences(new Array(lessonData.sentences.length).fill(false));
      setUserInput("");
      setFeedbackState("idle");
      setDetailedFeedback(null);
      setAiFeedbackMsg("");
      setMatchedAnswer(null);
      setShowHint(false);
      setShowFullAnswer(false);
      setShowConfirmModal(false);
      setAppState("learning");
    } else {
      setAppState("error");
    }
  };

  const calculateScore = (stats = null) => {
      const totalSentences = currentCourse?.sentences?.length || 1;
      const successfullyCompleted = completedSentences.filter(Boolean).length;
      const currentStats = stats || statsRef.current;
      // Tính tỷ lệ hoàn thành (0-100)
      const completionRate = (successfullyCompleted / totalSentences) * 100;
      // Penalty cho lỗi sai và gợi ý
      const penalty = (currentStats.mistakes * 3) + (currentStats.fullAnswers * 10);
      // Điểm = tỷ lệ hoàn thành - penalty, tối thiểu 0
      return Math.max(0, Math.round(completionRate - penalty));
  };

  const handleSaveResult = async () => {
      if (!user || !currentCourse) return;
      const finalScore = calculateScore();
      try {
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
              topic: currentCourse.title,
              score: finalScore,
              totalSentences: currentCourse.sentences.length,
              timestamp: serverTimestamp(),
              mistakes: statsRef.current.mistakes,
              hints: statsRef.current.hints,
              level: lengthOption,
              courseData: currentCourse 
          });
      } catch (e) {
          console.error("Error saving history:", e);
      }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const currentSent = currentCourse.sentences[currentSentIndex];
    
    let bestMatch = null;
    let minDiffScore = Infinity;
    let bestDiff = null;

    currentSent.acceptableAnswers.forEach(answer => {
      const diff = getWordDiff(userInput, answer);
      const errorScore = diff.reduce((acc, part) => {
         if (part.type === 'same') return acc;
         const cleanVal = (val) => val.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "");
         if (part.type === 'replace' && cleanVal(part.oldVal) === "" && cleanVal(part.newVal) === "") return acc;
         if (part.type !== 'replace' && cleanVal(part.value) === "") return acc;
         return acc + 1;
      }, 0);
      if (errorScore < minDiffScore) {
        minDiffScore = errorScore;
        bestMatch = answer;
        bestDiff = diff;
      }
    });

    if (minDiffScore === 0) {
      setFeedbackState("correct");
      const newCompleted = [...completedSentences];
      newCompleted[currentSentIndex] = true;
      setCompletedSentences(newCompleted);
      setDetailedFeedback(bestDiff); 
      setMatchedAnswer(bestMatch); 
      setAiFeedbackMsg("Chính xác tuyệt đối!");
    } else {
      setFeedbackState("checking"); 
      const vnContext = currentSent.segments.map(s => s.text).join("");
      const semanticResult = await checkSemanticMatch(userInput, vnContext);

      if (semanticResult.isCorrect) {
          setFeedbackState("correct");
          const newCompleted = [...completedSentences];
          newCompleted[currentSentIndex] = true;
          setCompletedSentences(newCompleted);
          setDetailedFeedback(bestDiff);
          setMatchedAnswer(bestMatch); 
          setAiFeedbackMsg("Cách diễn đạt khác nhưng hoàn toàn chính xác!");
      } else {
          setFeedbackState("incorrect");
          setDetailedFeedback(bestDiff);
          setMatchedAnswer(null);
          setAiFeedbackMsg(typeof semanticResult.feedback === 'string' ? semanticResult.feedback : "Sai ngữ nghĩa.");
          statsRef.current.mistakes += 1;
      }
    }
  };

  const finishLesson = async () => {
      // Lưu stats vào state trước khi render summary để tránh truy cập ref trong render
      setSummaryStats({ ...statsRef.current });
      setAppState("summary");
      await handleSaveResult();
  };

  const handleNextSentence = () => {
    if (currentSentIndex < currentCourse.sentences.length - 1) {
      setCurrentSentIndex(prev => prev + 1);
      setUserInput("");
      setFeedbackState("idle");
      setDetailedFeedback(null);
      setAiFeedbackMsg("");
      setMatchedAnswer(null);
      setShowHint(false);
      setShowFullAnswer(false);
      sentenceStatsRef.current = { hintUsed: false, fullUsed: false };
    } else {
      finishLesson();
    }
  };

  const handleFinishEarly = () => setShowConfirmModal(true);
  const confirmFinishEarly = () => { setShowConfirmModal(false); finishLesson(); };
  const cancelFinishEarly = () => setShowConfirmModal(false);

  // --- HISTORY CONTEXT MENU ---
  const handleHistoryContextMenu = (e, itemId) => {
      e.preventDefault();
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, itemId });
  };

  const handleDeleteHistory = async (itemId) => {
      if (!user || !itemId) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', itemId));
          setContextMenu({ visible: false, x: 0, y: 0, itemId: null });
      } catch (err) {
          console.error("Lỗi xóa lịch sử:", err);
      }
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, itemId: null });

  const handleShowHint = () => {
      setShowHint(true);
      if (!sentenceStatsRef.current.hintUsed) {
          statsRef.current.hints += 1;
          sentenceStatsRef.current.hintUsed = true;
      }
  };

  const handleShowFullAnswer = () => {
      setShowFullAnswer(true);
      if (!sentenceStatsRef.current.fullUsed) {
          statsRef.current.fullAnswers += 1;
          sentenceStatsRef.current.fullUsed = true;
      }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleReturnHome = () => {
    setAppState("home");
    setTopicInput("");
    setFeedbackState("idle");
    setDetailedFeedback(null);
    setAiFeedbackMsg("");
    setMatchedAnswer(null);
    setSuggestedTopics(getRandomTopics());
  };

  const theme = {
    bg: isDarkMode ? "bg-slate-900" : "bg-slate-50",
    text: isDarkMode ? "text-slate-200" : "text-slate-800",
    cardBg: isDarkMode ? "bg-slate-800" : "bg-white",
    cardBorder: isDarkMode ? "border-slate-700" : "border-slate-200",
    secondaryText: isDarkMode ? "text-slate-400" : "text-slate-500",
    inputBg: isDarkMode ? "bg-slate-900" : "bg-slate-50",
    inputBorder: isDarkMode ? "border-slate-700" : "border-slate-200",
    inputText: isDarkMode ? "text-slate-200" : "text-slate-800",
    highlightBg: isDarkMode ? "bg-indigo-900/30" : "bg-indigo-50",
    highlightText: isDarkMode ? "text-indigo-300" : "text-indigo-900",
    successBg: isDarkMode ? "bg-green-900/30" : "bg-green-50",
    successText: isDarkMode ? "text-green-300" : "text-green-700",
    errorBg: isDarkMode ? "bg-red-900/30" : "bg-red-50",
    errorText: isDarkMode ? "text-red-300" : "text-red-700",
  };

  const renderUserDiff = () => {
    if (!detailedFeedback) return userInput;
    return (
      <span className="leading-relaxed break-words">
        {detailedFeedback.map((part, idx) => {
          if (part.type === 'same') return <span key={idx} className="text-green-500 dark:text-green-400 mr-1.5">{part.value}</span>;
          else if (part.type === 'replace') {
             const style = feedbackState === 'correct' ? "text-yellow-500 dark:text-yellow-400 mr-1.5 underline decoration-dotted" : "text-red-400 dark:text-red-400 line-through decoration-red-500/50 decoration-2 cursor-help mr-1.5";
             return (
               <span key={idx} className={`relative group inline-block ${style}`}>
                 {part.oldVal}
                 {feedbackState !== 'correct' && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl pointer-events-none transform -translate-y-1 group-hover:translate-y-0 duration-200">
                        Sửa thành: <span className="font-bold text-green-400">{part.newVal}</span>
                        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></span>
                    </span>
                 )}
               </span>
             );
          } else if (part.type === 'remove') return feedbackState === 'correct' ? null : <span key={idx} className="text-red-400 dark:text-red-400 line-through mr-1.5 decoration-2 opacity-80">{part.value}</span>;
          else if (part.type === 'add') return feedbackState === 'correct' ? null : <span key={idx} className="inline-block w-5 h-5 border-b-2 border-dashed border-amber-500 mr-1.5 relative group align-middle"><span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-amber-900 border border-amber-700 text-amber-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">Thiếu: {part.value}</span></span>;
          return null;
        })}
      </span>
    );
  };

  if (isAuthChecking) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  // --- SCREEN: LOGIN & AUTH ---
  if (appState === "login") {
      return (
        <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4 ${theme.text} font-sans`}>
            <FontStyles />
            <button onClick={toggleTheme} className={`absolute top-4 right-4 p-2.5 rounded-full ${theme.cardBg} ${isDarkMode ? 'text-yellow-400' : 'text-orange-500'} border ${theme.cardBorder}`}>
                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <div className={`max-w-md w-full ${theme.cardBg} p-8 rounded-3xl shadow-2xl border ${theme.cardBorder}`}>
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className={`text-3xl font-bold mb-2 ${theme.text}`}>AI English Tutor</h1>
                    <p className={theme.secondaryText}>Đăng nhập để lưu quá trình học tập</p>
                </div>

                {verificationSent && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Link xác thực đã gửi! Vui lòng kiểm tra email.</span>
                    </div>
                )}

                {authMode !== 'forgot' && (
                    <div className={`flex ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-lg p-1 mb-6`}>
                        <button onClick={() => { setAuthMode('login'); setAuthError(""); }} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${authMode === 'login' ? (isDarkMode ? 'bg-slate-600 text-white' : 'bg-white text-slate-900') + ' shadow' : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}>Đăng nhập</button>
                        <button onClick={() => { setAuthMode('register'); setAuthError(""); }} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${authMode === 'register' ? (isDarkMode ? 'bg-slate-600 text-white' : 'bg-white text-slate-900') + ' shadow' : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}>Đăng ký</button>
                    </div>
                )}

                {authMode === 'forgot' ? (
                    <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in">
                        <div className="text-left"><label className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} uppercase ml-1`}>Email đăng ký</label><div className="relative"><Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={`w-full p-4 pl-12 rounded-xl ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none mt-1`} required /></div></div>
                        {resetEmailSent ? (<div className="p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Đã gửi link khôi phục!</div>) : (authError && <p className="text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">{authError}</p>)}
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"><KeyRound className="w-5 h-5" /> Gửi link khôi phục</button>
                        <button type="button" onClick={() => { setAuthMode('login'); setAuthError(""); setResetEmailSent(false); }} className={`w-full ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-sm underline mt-2`}>Quay lại Đăng nhập</button>
                    </form>
                ) : (
                    <form onSubmit={authMode === 'login' ? handleEmailLogin : handleRegister} className="space-y-4 animate-in fade-in">
                        {authMode === 'register' && (<div className="text-left"><label className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} uppercase ml-1`}>Tên hiển thị</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="VD: Minh Tú" className={`w-full p-4 rounded-xl ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none mt-1`} required /></div>)}
                        <div className="text-left"><label className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} uppercase ml-1`}>Email</label><div className="relative"><Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={`w-full p-4 pl-12 rounded-xl ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none mt-1`} required /></div></div>
                        <div className="text-left"><label className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} uppercase ml-1`}>Mật khẩu</label><div className="relative"><Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`w-full p-4 pl-12 rounded-xl ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none mt-1`} required /></div></div>
                        {authError && <p className="text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">{authError}</p>}
                        {authMode === 'login' && (<div className="text-right"><button type="button" onClick={() => { setAuthMode('forgot'); setAuthError(""); }} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">Quên mật khẩu?</button></div>)}
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95">{authMode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}</button>
                    </form>
                )}

                {authMode !== 'forgot' && (
                    <div className="mt-6 flex flex-col gap-3 animate-in fade-in">
                        <button onClick={handleGoogleLogin} className="w-full bg-gradient-to-r from-blue-500 to-red-500 hover:from-blue-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"><span className="text-lg font-bold">G</span> Tiếp tục với Google</button>
                        <button onClick={handleGuestLogin} className={`${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-sm underline`}>Dùng thử không cần tài khoản</button>
                    </div>
                )}
            </div>
        </div>
      );
  }

  // --- SCREEN: HISTORY ---
  if (appState === "history") {
      return (
        <div className={`min-h-screen ${theme.bg} p-4 transition-colors duration-300 font-sans`} onClick={closeContextMenu}>
            <FontStyles />
            <header className="max-w-4xl mx-auto flex items-center justify-between mb-8 pt-4">
                <button onClick={() => setAppState("home")} className={`flex items-center gap-2 ${theme.secondaryText} hover:${theme.text}`}><ArrowRight className="w-5 h-5 rotate-180" /> Quay lại</button>
                <h1 className={`text-xl font-bold ${theme.text}`}>Lịch sử học tập</h1>
                <button onClick={toggleTheme} className={`p-2 rounded-full ${theme.cardBg} ${isDarkMode ? 'text-yellow-400' : 'text-orange-500'} border ${theme.cardBorder}`}>
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
            </header>
            <div className="max-w-4xl mx-auto space-y-4 pb-10">
                {historyData.length === 0 ? (
                    <div className={`text-center py-20 ${theme.secondaryText}`}>Bạn chưa có bài học nào.</div>
                ) : (
                    historyData.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedHistoryItem(item)}
                            onContextMenu={(e) => handleHistoryContextMenu(e, item.id)}
                            className={`${theme.cardBg} p-5 rounded-2xl border ${theme.cardBorder} flex items-center justify-between hover:scale-[1.01] transition-transform cursor-pointer group`}
                        >
                            <div className="flex-1">
                                <h3 className={`font-bold ${theme.text} text-lg mb-1 group-hover:text-indigo-500 transition-colors`}>{item.topic}</h3>
                                <div className={`flex items-center gap-4 text-xs ${theme.secondaryText}`}>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.timestamp && typeof item.timestamp.toDate === 'function' ? item.timestamp.toDate().toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                                    <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded uppercase font-bold">{item.level || 'medium'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <div className={`text-sm ${theme.secondaryText}`}>Điểm số</div>
                                    <div className={`font-bold text-lg ${item.score >= 80 ? 'text-green-500' : item.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{Math.round(item.score)}</div>
                                </div>
                                <ChevronRight className={`w-5 h-5 ${theme.secondaryText}`} />
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className={`fixed z-50 ${theme.cardBg} border-2 ${theme.cardBorder} rounded-xl shadow-2xl overflow-hidden`}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => handleDeleteHistory(contextMenu.itemId)}
                        className="px-5 py-3 text-red-500 hover:bg-red-500/10 flex items-center gap-3 text-sm font-bold whitespace-nowrap"
                    >
                        <X className="w-4 h-4" />
                        Xóa bài học này
                    </button>
                </div>
            )}
            {selectedHistoryItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm" onClick={() => setSelectedHistoryItem(null)}>
                    <div className={`${theme.cardBg} w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col`} onClick={e => e.stopPropagation()}>
                        <div className={`p-6 border-b ${theme.cardBorder} flex justify-between items-center bg-indigo-600`}>
                            <h2 className="text-xl font-bold text-white truncate pr-4">{selectedHistoryItem.topic}</h2>
                            <button onClick={() => setSelectedHistoryItem(null)} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <div className={`flex-1 overflow-y-auto p-6 ${theme.bg}`}>
                            {selectedHistoryItem.courseData && selectedHistoryItem.courseData.sentences ? (
                                <div className="space-y-6">
                                    {selectedHistoryItem.courseData.sentences.map((sent, idx) => (
                                        <div key={idx} className={`${theme.cardBg} p-4 rounded-xl border ${theme.cardBorder}`}>
                                            <div className="flex gap-3 mb-2">
                                                <span className="flex-shrink-0 w-6 h-6 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                <div>
                                                    <p className={`font-medium ${theme.text} mb-1`}>{sent.vietnamese_full || (sent.segments ? sent.segments.map(s => s.text).join("") : "")}</p>
                                                    <p className="text-green-500 italic">{sent.acceptableAnswers[0]}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (<p className={`${theme.secondaryText} text-center py-10`}>Chi tiết bài học không khả dụng cho mục này.</p>)}
                        </div>
                        <div className={`p-4 border-t ${theme.cardBorder} ${theme.cardBg} flex justify-between items-center text-sm ${theme.secondaryText}`}>
                            <span>Điểm: <strong className={selectedHistoryItem.score >= 50 ? "text-green-500" : "text-red-500"}>{Math.round(selectedHistoryItem.score)}</strong></span>
                            <span>Hoàn thành: {selectedHistoryItem.totalSentences} câu</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // --- SCREEN: GENERATING ---
  if (appState === "generating") {
    return (
      <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4`}>
        <FontStyles />
        <div className="text-center space-y-8">
            <div className="relative w-20 h-20 mx-auto">
                <div className={`absolute inset-0 border-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} rounded-full`} />
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                <Brain className="absolute inset-0 m-auto text-indigo-500 w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
                <h2 className={`text-xl font-bold ${theme.text}`}>AI đang viết bài luận...</h2>
                <p className={`${theme.secondaryText}`}>Chủ đề: <span className="text-indigo-500">"{topicInput}"</span></p>
            </div>
        </div>
      </div>
    );
  }

  // --- SCREEN: ERROR ---
  if (appState === "error") {
    return (
      <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4`}>
        <FontStyles />
        <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                <X className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
                <h2 className={`text-xl font-bold ${theme.text}`}>Không thể tạo bài học</h2>
                <p className={`${theme.secondaryText}`}>Có lỗi xảy ra khi tạo nội dung. Vui lòng thử lại.</p>
            </div>
            <button onClick={() => setAppState("home")} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all">
                Quay lại trang chủ
            </button>
        </div>
      </div>
    );
  }

  // --- SCREEN: SUMMARY ---
  if (appState === "summary") {
    const finalScore = calculateScore(summaryStats);
    let grade = "Cần cố gắng";
    let gradeColor = "text-red-500";
    if (finalScore >= 90) { grade = "Xuất sắc"; gradeColor = "text-green-500"; }
    else if (finalScore >= 80) { grade = "Giỏi"; gradeColor = "text-blue-500"; }
    else if (finalScore >= 65) { grade = "Khá"; gradeColor = "text-yellow-500"; }
    else if (finalScore >= 50) { grade = "Trung bình"; gradeColor = "text-orange-500"; }

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (finalScore / 100) * circumference;
    const successfullyCompleted = completedSentences.filter(Boolean).length;
    const skippedCount = (currentCourse?.sentences?.length || 0) - successfullyCompleted;

    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}>
        <FontStyles />
        <div className={`max-w-3xl w-full ${theme.cardBg} rounded-3xl shadow-2xl p-8 md:p-12 border ${theme.cardBorder}`}>
          <div className="text-center mb-8">
              <div className="relative w-40 h-40 mx-auto mb-6">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke={isDarkMode ? "#374151" : "#e5e7eb"} strokeWidth="10" />
                      <circle className="score-circle" cx="60" cy="60" r="50" fill="none" stroke={finalScore >= 80 ? "#10B981" : finalScore >= 50 ? "#F59E0B" : "#EF4444"} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-bold ${theme.text}`}>{finalScore}</span>
                      <span className={`text-xs uppercase font-bold ${theme.secondaryText}`}>Điểm</span>
                  </div>
              </div>
              <h1 className={`text-3xl font-bold ${gradeColor} mb-2`}>{grade}</h1>
              <p className={`${theme.secondaryText}`}>Chủ đề: <span className="font-bold text-indigo-500">{currentCourse?.title}</span></p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} p-4 rounded-2xl text-center border ${theme.cardBorder}`}>
                  <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <div className={`text-2xl font-bold ${theme.text}`}>{summaryStats.mistakes}</div>
                  <div className={`text-xs ${theme.secondaryText}`}>Lỗi sai (-2đ)</div>
              </div>
              <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} p-4 rounded-2xl text-center border ${theme.cardBorder}`}>
                  <SkipForward className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <div className={`text-2xl font-bold ${theme.text}`}>{skippedCount}</div>
                  <div className={`text-xs ${theme.secondaryText}`}>Bỏ qua (-10đ)</div>
              </div>
              <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} p-4 rounded-2xl text-center border ${theme.cardBorder}`}>
                  <Lightbulb className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <div className={`text-2xl font-bold ${theme.text}`}>{summaryStats.hints}</div>
                  <div className={`text-xs ${theme.secondaryText}`}>Gợi ý (0đ)</div>
              </div>
              <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} p-4 rounded-2xl text-center border ${theme.cardBorder}`}>
                  <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className={`text-2xl font-bold ${theme.text}`}>{summaryStats.fullAnswers}</div>
                  <div className={`text-xs ${theme.secondaryText}`}>Đáp án (-15đ)</div>
              </div>
          </div>
          <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} p-6 rounded-2xl text-left mb-8 border ${theme.cardBorder} max-h-60 overflow-y-auto custom-scrollbar`}>
             <h4 className={`text-xs font-bold ${theme.secondaryText} uppercase mb-2`}>Đoạn văn hoàn chỉnh</h4>
             <p className={`${theme.text} text-base leading-relaxed`}>
               {currentCourse?.sentences.map(s => s.acceptableAnswers[0]).join(" ")}
             </p>
          </div>
          <div className="flex justify-center">
            <button onClick={handleReturnHome} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
                <RotateCcw className="w-5 h-5" /> Bài học mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER (HOME & LEARNING) ---
  
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} ${appState === 'learning' ? 'p-2 md:p-3' : 'p-4 md:p-6'} flex flex-col font-medium transition-colors duration-300 font-sans`}>
      <FontStyles />
      
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
            <div className={`${theme.cardBg} p-6 rounded-2xl shadow-2xl max-w-sm w-full border ${theme.cardBorder}`}>
                <h3 className={`text-lg font-bold ${theme.text} mb-2`}>Kết thúc sớm?</h3>
                <p className={`${theme.secondaryText} mb-6 text-sm`}>Bạn có chắc muốn dừng? Các câu chưa hoàn thành sẽ bị tính là bỏ qua và trừ điểm.</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={cancelFinishEarly} className={`px-4 py-2 rounded-xl text-sm font-bold ${theme.secondaryText} hover:${theme.bg}`}>Hủy</button>
                    <button onClick={confirmFinishEarly} className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white">Kết thúc ngay</button>
                </div>
            </div>
        </div>
      )}

      {appState === 'home' && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8">
            <div className="absolute top-4 left-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => setAppState("history")}>
                    {user?.displayName?.charAt(0) || <User className="w-5 h-5" />}
                </div>
                <div className="hidden md:block">
                    <p className={`text-xs font-bold ${theme.secondaryText}`}>Xin chào,</p>
                    <p className={`font-bold ${theme.text}`}>{user?.displayName || "Học viên"}</p>
                </div>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <button onClick={() => setAppState("history")} className={`p-2.5 rounded-full ${theme.cardBg} ${theme.secondaryText} hover:${theme.text} border ${theme.cardBorder}`} title="Lịch sử">
                    <History className="w-5 h-5" />
                </button>
                <button onClick={toggleTheme} className={`p-2.5 rounded-full ${theme.cardBg} ${isDarkMode ? 'text-yellow-400' : 'text-orange-500'} border ${theme.cardBorder}`}>
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>
                <button onClick={handleLogout} className={`p-2.5 rounded-full ${theme.cardBg} text-red-500 hover:bg-red-500/10 border ${theme.cardBorder}`} title="Đăng xuất">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4 text-center mb-8 mt-12">
                <div className={`inline-flex items-center justify-center p-4 ${theme.cardBg} rounded-full shadow-xl mb-2`}>
                    <Sparkles className="w-12 h-12 text-indigo-500" />
                </div>
                <h1 className={`text-4xl md:text-5xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                    AI English Tutor
                </h1>
                <p className={`text-base md:text-lg ${theme.secondaryText}`}>Luyện dịch thực tế. Chấm điểm & sửa lỗi thông minh.</p>
            </div>

            <div className={`${theme.cardBg} p-5 rounded-3xl shadow-2xl border ${theme.cardBorder} w-full transition-all`}>
                <div className="flex justify-center gap-2 mb-5">
                    {[{ id: 'short', label: 'Ngắn' }, { id: 'medium', label: 'Vừa' }, { id: 'long', label: 'Dài' }].map((opt) => (
                        <button key={opt.id} onClick={() => setLengthOption(opt.id)} className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${lengthOption === opt.id ? 'bg-indigo-600 text-white border-indigo-600' : `${theme.bg} ${theme.secondaryText} border-transparent hover:border-indigo-500`}`}>{opt.label}</button>
                    ))}
                </div>
                <form onSubmit={handleStartGeneration} className="relative flex items-center">
                    <div className="pl-4 text-indigo-400"><Brain className="w-6 h-6" /></div>
                    <input ref={topicInputRef} type="text" value={topicInput} onChange={(e) => setTopicInput(e.target.value)} placeholder="Nhập chủ đề (VD: Cuộc sống ở Sao Hỏa)..." className={`w-full p-4 text-base bg-transparent outline-none ${theme.inputText} placeholder-slate-400 font-medium`} />
                    <button type="submit" disabled={!topicInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl m-1 transition-all shadow-md active:scale-95"><ArrowRight className="w-6 h-6" /></button>
                </form>
            </div>

            <div className={`flex flex-wrap justify-center gap-2 text-sm ${theme.secondaryText} mt-6`}>
                {suggestedTopics.map((tag) => (
                    <button key={tag} onClick={() => setTopicInput(tag)} className={`${theme.cardBg} border ${theme.cardBorder} px-4 py-2 rounded-full hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-sm`}>{tag}</button>
                ))}
                <button onClick={() => setSuggestedTopics(getRandomTopics())} className="p-2 rounded-full hover:bg-indigo-500/10 text-indigo-500"><RefreshCw className="w-4 h-4" /></button>
            </div>
        </div>
      )}

      {appState === 'learning' && currentCourse && (
        <>
        <header className="w-full mb-4 flex items-center justify-between px-1 lg:px-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setAppState("home")} className={`p-2 hover:${theme.cardBg} rounded-full transition-all ${theme.secondaryText}`}><ArrowRight className="w-6 h-6 rotate-180" /></button>
                <div>
                    <h1 className={`text-xl font-bold ${theme.text} flex items-center gap-3`}>{currentCourse.title}</h1>
                    <span className="text-xs font-bold bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full uppercase border border-indigo-500/20">{currentCourse.type}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={handleFinishEarly} className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors"><SkipForward className="w-4 h-4" /> Kết thúc</button>
                <button onClick={toggleTheme} className={`p-2 rounded-full ${theme.cardBg} ${isDarkMode ? 'text-yellow-400' : 'text-orange-500'} shadow-sm border ${theme.cardBorder}`}>{isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>
                <div className={`hidden md:flex ${theme.cardBg} px-4 py-2 rounded-xl shadow-sm border ${theme.cardBorder} text-sm font-bold`}>
                    <span className={`${theme.secondaryText} mr-2`}>TIẾN ĐỘ</span> <span className="text-indigo-500">{currentSentIndex + 1} <span className={theme.secondaryText}>/</span> {currentCourse.sentences.length}</span>
                </div>
            </div>
        </header>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 px-1 lg:px-4">
            <div className={`lg:col-span-8 ${theme.cardBg} p-6 rounded-3xl shadow-xl border ${theme.cardBorder} overflow-y-auto relative h-[30vh] lg:h-auto custom-scrollbar`}>
                <div className={`text-base md:text-lg leading-[2.0] ${theme.text} font-sans`}>
                    {currentCourse.sentences.map((sent, sIdx) => {
                        const isCompleted = completedSentences[sIdx];
                        const isActive = sIdx === currentSentIndex;
                        if (isCompleted) return <span key={sent.id} className="text-green-500 dark:text-green-400 transition-all duration-500 mr-1">{sent.acceptableAnswers[0]} </span>;
                        let containerClass = "transition-all duration-300 inline mr-1 rounded px-1 ";
                        if (isActive) containerClass += `${theme.highlightBg} ${theme.highlightText} shadow-[inset_0_0_0_2px_rgba(99,102,241,0.5)] py-1 `;
                        else containerClass += isDarkMode ? "text-slate-600 " : "text-slate-300 ";
                        return (
                            <span key={sent.id} className={containerClass}>
                                {sent.segments.map((seg, segIdx) => {
                                    const nextSeg = sent.segments[segIdx + 1];
                                    const shouldAddSpace = nextSeg && !/^[.,!?;:)]/.test(nextSeg.text);
                                    return <React.Fragment key={segIdx}><span className="group relative cursor-help inline-block hover:text-indigo-500 transition-colors">{seg.text}<span className={`invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 ${isDarkMode ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-white'} text-sm rounded-lg shadow-lg whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 transition-all pointer-events-none`}>{seg.trans}</span></span>{shouldAddSpace && ' '}</React.Fragment>;
                                })}
                            </span>
                        );
                    })}
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col h-full gap-4 min-h-[500px]">
                <div className={`flex-1 ${theme.cardBg} rounded-3xl shadow-xl border ${theme.cardBorder} flex flex-col overflow-hidden relative`}>
                    <div className={`flex-1 p-6 overflow-y-auto ${theme.bg} space-y-6 custom-scrollbar`}>
                        <div className="flex gap-4 animate-in slide-in-from-left-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0"><Brain className="w-6 h-6 text-indigo-600" /></div>
                            <div className={`${theme.cardBg} p-5 rounded-3xl rounded-tl-none shadow-sm border ${theme.cardBorder} w-full`}>
                                <p className={`text-xs font-bold ${theme.secondaryText} uppercase mb-2`}>Dịch câu này</p>
                                <div className={`text-lg ${theme.highlightText} ${theme.highlightBg} p-3 rounded-xl border ${theme.cardBorder} italic font-medium`}>
                                    "{currentCourse.sentences[currentSentIndex].segments.map((s, i) => { const next = currentCourse.sentences[currentSentIndex].segments[i+1]; const space = next && !/^[.,!?;:)]/.test(next.text) ? ' ' : ''; return s.text + space; })}"
                                </div>
                            </div>
                        </div>
                        {feedbackState !== 'idle' && feedbackState !== 'checking' && (
                            <div className="flex gap-4 flex-row-reverse animate-in slide-in-from-right-4">
                                <div className={`w-10 h-10 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-2xl flex items-center justify-center flex-shrink-0`}><div className="w-6 h-6 rounded-full bg-slate-400"></div></div>
                                <div className={`p-4 rounded-3xl rounded-tr-none shadow-md text-white max-w-[85%] text-lg ${feedbackState === 'correct' ? 'bg-slate-700' : 'bg-slate-700'} relative overflow-visible z-10`}>
                                    <div className={`absolute inset-0 opacity-20 rounded-3xl rounded-tr-none ${feedbackState === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div className="relative z-10 font-medium">{renderUserDiff()}</div>
                                </div>
                            </div>
                        )}
                        {feedbackState === "correct" && (
                            <div className="flex gap-4 animate-in slide-in-from-left-4">
                                <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                                <div className={`${theme.successBg} p-5 rounded-3xl rounded-tl-none border ${isDarkMode ? 'border-green-800' : 'border-green-200'} w-full`}>
                                    <p className={`font-bold ${theme.successText} text-lg mb-2`}>Tuyệt vời!</p>
                                    {aiFeedbackMsg && <p className={`text-sm ${theme.successText} mb-3 italic`}>{String(aiFeedbackMsg)}</p>}
                                    {matchedAnswer && <div className={`mt-3 ${theme.cardBg} p-3 rounded-xl border ${theme.cardBorder}`}><div className="flex items-center gap-2 mb-2"><GitCompare className="w-4 h-4 text-indigo-400" /><span className="text-xs font-bold text-indigo-400 uppercase">Đáp án mẫu</span></div><p className={`${theme.text} text-sm italic`}>{matchedAnswer}</p></div>}
                                    <button onClick={handleNextSentence} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">Câu tiếp theo <ArrowRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )}
                        {feedbackState === "checking" && (
                            <div className="flex gap-4 animate-in slide-in-from-left-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse"><Search className="w-6 h-6 text-indigo-600" /></div>
                                <div className={`${theme.cardBg} p-4 rounded-3xl rounded-tl-none border ${theme.cardBorder} text-sm italic ${theme.secondaryText}`}>AI đang kiểm tra ngữ nghĩa câu trả lời của bạn...</div>
                            </div>
                        )}
                        {feedbackState === "incorrect" && (
                            <div className="flex gap-4 animate-in slide-in-from-left-4">
                                <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                                <div className={`${theme.errorBg} p-5 rounded-3xl rounded-tl-none border ${isDarkMode ? 'border-red-800' : 'border-red-200'} w-full`}>
                                    <p className={`font-bold ${theme.errorText} mb-3 text-lg`}>Chưa chính xác lắm.</p>
                                    <div className={`mb-3 ${theme.cardBg} p-4 rounded-xl border ${isDarkMode ? 'border-red-500/30' : 'border-red-200'}`}>
                                        <div className="flex items-center gap-2 mb-2"><Search className="w-4 h-4 text-indigo-400" /><span className="text-xs font-bold text-indigo-400 uppercase">AI Phân tích lỗi sai</span></div>
                                        <p className={`${theme.text} text-sm italic leading-relaxed`}>{String(aiFeedbackMsg || "Câu trả lời chưa sát nghĩa. Hãy kiểm tra từ vựng và ngữ pháp.")}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <div className={`p-4 md:p-6 ${theme.cardBg} border-t ${theme.cardBorder} z-20 transition-colors duration-300`}>
                        <form onSubmit={handleCheck} className="relative group">
                            <textarea ref={inputRef} value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={feedbackState === 'correct' || feedbackState === 'checking'} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (feedbackState !== 'correct' && feedbackState !== 'checking') handleCheck(e); } }} placeholder={feedbackState === 'correct' ? "Đang chờ..." : "Nhập câu dịch..."} className={`w-full p-4 pr-14 rounded-2xl ${theme.inputBg} ${theme.inputBorder} border-2 focus:border-indigo-500 outline-none resize-none text-base shadow-inner ${theme.inputText}`} rows="2" />
                            {feedbackState !== 'correct' && feedbackState !== 'checking' && (
                                <button type="submit" disabled={!userInput.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all"><Send className="w-5 h-5" /></button>
                            )}
                        </form>
                    </div>
                </div>
                {feedbackState !== 'correct' && (
                    <div className={`${theme.cardBg} rounded-3xl shadow-lg border ${theme.cardBorder} overflow-hidden flex-shrink-0 transition-all duration-300`}>
                        {!showHint ? (
                            <button onClick={handleShowHint} className="w-full flex items-center justify-center gap-2 py-4 text-amber-500 hover:bg-amber-500/10 font-bold text-sm"><Lightbulb className="w-5 h-5" /> XEM GỢI Ý</button>
                        ) : (
                            <div className={`p-5 ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50/50'} animate-in fade-in relative`}>
                                <button onClick={() => setShowHint(false)} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-amber-600 dark:text-amber-400 transition-colors" title="Thu gọn"><ChevronUp className="w-4 h-4" /></button>
                                <div className="space-y-4">
                                    <div><p className="text-xs font-bold text-amber-500 uppercase mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Gợi ý Ngữ pháp</p><p className={`${theme.text} text-sm mb-3 font-medium ${theme.cardBg} p-3 rounded-xl border ${isDarkMode ? 'border-amber-900/30' : 'border-amber-100'}`}>{currentCourse.sentences[currentSentIndex].grammar_hint}</p></div>
                                    {currentCourse.sentences[currentSentIndex].structure && <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><p className="text-xs font-bold text-amber-500 uppercase mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Cấu trúc</p><div className={`${theme.text} text-sm ${theme.cardBg} p-2 rounded-lg border ${isDarkMode ? 'border-amber-900/30' : 'border-amber-100'} font-mono text-xs`}>{currentCourse.sentences[currentSentIndex].structure}</div></div><div><p className="text-xs font-bold text-amber-500 uppercase mb-2 flex items-center gap-2"><Book className="w-4 h-4" /> Ví dụ</p><div className={`${theme.text} text-sm ${theme.cardBg} p-2 rounded-lg border ${isDarkMode ? 'border-amber-900/30' : 'border-amber-100'} italic`}><p className="mb-1 text-indigo-400">{currentCourse.sentences[currentSentIndex].example_en}</p><p className="text-xs opacity-80">{currentCourse.sentences[currentSentIndex].example_vi}</p></div></div></div>}
                                    <div><p className="text-xs font-bold text-amber-500 uppercase mb-2">Từ vựng cần dùng</p><div className="flex flex-wrap gap-2">{currentCourse.sentences[currentSentIndex].vocabulary.map((v, i) => (<span key={i} className={`text-xs ${theme.cardBg} px-2 py-1 rounded-lg text-amber-600 dark:text-amber-400 border ${isDarkMode ? 'border-amber-900' : 'border-amber-200'}`}>{v.word}: {v.meaning}</span>))}</div></div>
                                    {!showFullAnswer ? (<button onClick={handleShowFullAnswer} className={`text-xs font-bold ${theme.secondaryText} hover:underline`}>Xem đáp án đầy đủ</button>) : (<p className={`${theme.text} font-serif italic text-base border-t ${theme.cardBorder} pt-2 mt-2`}>"{currentCourse.sentences[currentSentIndex].acceptableAnswers[0]}"</p>)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
      )}
    </div>
  );
}