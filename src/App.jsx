import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { BrainCircuit, SendHorizontal, Copy, Check, Clock, Loader2, Sparkles } from 'lucide-react';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "my-promt-app.firebaseapp.com",
  projectId: "my-promt-app",
  storageBucket: "my-promt-app.firebasestorage.app",
  messagingSenderId: "87337277243",
  appId: "1:87337277243:web:7baaa421bd39d97698491e"
};

export default function App() {
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [task, setTask] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    setDb(firestore);
    signInAnonymously(auth).then(cred => setUser(cred.user));
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, `users/${user.uid}/prompts`));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
  }, [db, user]);

  const generatePrompt = async () => {
    if (!task.trim()) return;
    setLoading(true);
    setGeneratedPrompt(''); // Clear previous result immediately for better UX
    try {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Ты Senior Prompt Engineer. Создай идеальный промпт по структуре CO-STAR для задачи: ${task}` }] }]
        })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ошибка API. Проверьте ваш ключ или подключение.";
      setGeneratedPrompt(text);
      await addDoc(collection(db, `users/${user.uid}/prompts`), { task, prompt: text, createdAt: serverTimestamp() });
    } catch (e) {
      console.error(e);
      setGeneratedPrompt("Произошла ошибка при генерации. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Только что';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">

      {/* Very subtle glow effect at the top */}
      <div className="absolute top-[-20%] left-[20%] w-[60vw] h-[20vw] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 w-full pt-4 md:pt-12">

        {/* Header Section */}
        <header className="flex flex-col items-center justify-center gap-3 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#13131a] border border-[#1e1e2e] rounded-xl shadow-sm">
              <BrainCircuit size={28} className="text-indigo-500" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Prompt Architect
            </h1>
          </div>
          <p className="text-slate-400 text-sm md:text-base max-w-lg text-center font-medium px-4">
            Проектируем профессиональные CO-STAR промпты с помощью магии нейросетей.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Workspace (Left Column) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Input Card */}
            <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden group">
              {/* Subtle top border glow on hover */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/50 transition-all duration-700"></div>

              <div className="flex items-center justify-between mb-4">
                <label className="font-medium text-sm text-slate-300 flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  Опишите задачу
                </label>
              </div>

              <textarea
                className="w-full bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 min-h-[140px] resize-none text-[15px] leading-relaxed font-sans"
                value={task}
                onChange={e => setTask(e.target.value)}
                placeholder="Например: Напиши продающий пост для Telegram про новый курс по дизайну, ориентированный на новичков..."
              />

              <div className="mt-5 flex justify-end">
                <button
                  onClick={generatePrompt}
                  disabled={loading || !task.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white/90" />
                      Синтез...
                    </>
                  ) : (
                    <>
                      <SendHorizontal size={16} className="text-white/90" />
                      Сгенерировать
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Result Card - Only shows when there is text or loading */}
            {(generatedPrompt || loading) && (
              <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-2xl p-5 md:p-6 shadow-sm relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-medium text-sm text-slate-300 flex items-center gap-2">
                    <Check size={16} className="text-emerald-400" />
                    Результат
                  </h2>

                  {!loading && generatedPrompt && (
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-md hover:bg-[#1a1a24] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2 text-xs font-medium border border-transparent hover:border-[#2a2a35]"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {copied ? "Скопировано" : "Копировать"}
                    </button>
                  )}
                </div>

                <div className="relative">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <div className="w-8 h-8 rounded-full border-2 border-[#1e1e2e] border-t-indigo-500 animate-spin"></div>
                      <p className="text-slate-500 text-sm font-medium">Создаём архитектуру запроса...</p>
                    </div>
                  ) : (
                    <div className="bg-[#13131a] p-5 rounded-xl border border-[#1e1e2e]/50 overflow-x-auto">
                      <p className="text-slate-300 text-[14px] leading-relaxed whitespace-pre-wrap font-mono relative z-10 selection:bg-indigo-500/30">
                        {generatedPrompt}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar / History Panel (Right Column) */}
          <div className="lg:col-span-4 block">
            <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-2xl p-5 shadow-sm lg:sticky lg:top-8 flex flex-col h-[500px] lg:h-[calc(100vh-8rem)] min-h-[400px]">

              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1e1e2e]">
                <h3 className="font-medium text-sm text-slate-300 flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  История
                </h3>
                <span className="text-xs font-medium bg-[#13131a] px-2 py-0.5 rounded text-slate-400 border border-[#1e1e2e]">
                  {history.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <div className="p-3 bg-[#13131a] rounded-full border border-[#1e1e2e]">
                      <Clock size={20} className="text-slate-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">Пока ничего нет</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div
                      key={item.id}
                      className="group p-3 border border-transparent hover:border-[#1e1e2e] hover:bg-[#13131a] rounded-xl cursor-pointer transition-all duration-200"
                      onClick={() => {
                        setGeneratedPrompt(item.prompt);
                        const isMobile = window.innerWidth <= 1024;
                        if (isMobile) {
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }
                      }}
                    >
                      <p className="text-[13px] text-slate-300 line-clamp-2 leading-relaxed mb-2 group-hover:text-indigo-100 transition-colors">
                        {item.task}
                      </p>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>CO-STAR</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}