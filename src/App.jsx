import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { BrainCircuit, Sparkles, SendHorizontal, Copy, Check, Clock, Loader2 } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCEuKydmna5ohHKQ9ELLl_xMCswsmLTkps",
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">

      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-6xl mx-auto relative z-10 lg:pt-8">

        {/* Header Section */}
        <header className="flex flex-col items-center justify-center gap-4 mb-16 pt-8">
          <div className="p-4 bg-white/[0.03] rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl transition-transform hover:scale-105 duration-500">
            <BrainCircuit size={52} strokeWidth={1.5} className="text-indigo-400 drop-shadow-[0_0_20px_rgba(129,140,248,0.6)]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-purple-400 text-center drop-shadow-sm">
            Prompt <span className="font-light italic text-indigo-400/90">Architect</span>
          </h1>
          <p className="text-slate-400/80 text-sm md:text-base max-w-lg text-center font-medium px-4">
            Проектируем профессиональные CO-STAR промпты с помощью магии нейросетей.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Workspace (Left Column) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Input Card */}
            <div className="bg-white/[0.02] backdrop-blur-2xl p-1.5 rounded-[2rem] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-white/10 group">
              <div className="bg-[#0f172a]/80 rounded-[1.6rem] p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-5 text-indigo-300/90">
                  <Sparkles size={20} className="drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                  <h2 className="font-bold text-sm tracking-widest uppercase text-indigo-200">Опишите задачу</h2>
                </div>

                <textarea
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all duration-300 placeholder:text-slate-600 min-h-[160px] resize-none text-[15px] leading-relaxed shadow-inner"
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  placeholder="Например: Напиши продающий пост для Telegram про новый курс по дизайну, ориентированный на новичков..."
                />

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={generatePrompt}
                    disabled={loading || !task.trim()}
                    className="relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(79,70,229,0.2)] hover:shadow-[0_0_60px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#0f172a] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none"></div>
                    <span className="relative z-10 flex items-center gap-3 tracking-wide text-sm sm:text-base">
                      {loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin text-white/90" />
                          СИНТЕЗ...
                        </>
                      ) : (
                        <>
                          <SendHorizontal size={20} className="text-white/90" />
                          СГЕНЕРИРОВАТЬ
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Output Result Card - Only shows when there is text or loading */}
            {(generatedPrompt || loading) && (
              <div className="bg-gradient-to-b from-indigo-500/20 to-purple-500/5 backdrop-blur-2xl p-[1px] rounded-[2rem] shadow-[0_0_60px_rgba(99,102,241,0.15)] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-[#0f172a]/95 rounded-[2rem] p-6 lg:p-8">

                  <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/5">
                    <div className="flex items-center gap-3 text-emerald-400/90">
                      <Check size={22} className="drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <h2 className="font-bold text-sm tracking-widest uppercase">Готовый Промпт</h2>
                    </div>

                    {!loading && generatedPrompt && (
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-slate-300 hover:text-white flex items-center gap-2 text-xs font-semibold uppercase tracking-wider active:scale-95"
                      >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        {copied ? "Скопировано" : "Копировать"}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
                        <p className="text-indigo-300/70 text-sm animate-pulse font-medium tracking-wide uppercase">Создаём архитектуру запроса...</p>
                      </div>
                    ) : (
                      <div className="bg-black/30 p-6 rounded-2xl border border-white/[0.02]">
                        <p className="text-slate-300/90 text-[15px] leading-[1.8] whitespace-pre-wrap font-mono relative z-10">
                          {generatedPrompt}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* Sidebar / History Panel (Right Column) */}
          <div className="lg:col-span-4 block">
            <div className="bg-white/[0.02] backdrop-blur-xl p-1.5 rounded-[2rem] border border-white/[0.05] shadow-2xl lg:sticky lg:top-8">
              <div className="bg-[#0f172a]/80 rounded-[1.6rem] p-6 h-[400px] lg:h-[600px] flex flex-col">

                <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Clock size={18} />
                    <h3 className="font-bold text-xs tracking-widest uppercase">История</h3>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-white/5 px-2 py-1 rounded-md text-slate-500">
                    {history.length} записей
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                      <div className="p-4 bg-white/5 rounded-full border border-white/5">
                        <Clock size={28} className="text-slate-400" />
                      </div>
                      <p className="text-xs font-medium tracking-wide uppercase text-slate-500">Пустая история</p>
                    </div>
                  ) : (
                    history.map(item => (
                      <div
                        key={item.id}
                        className="group p-4 bg-black/20 hover:bg-indigo-500/10 border border-white/[0.03] hover:border-indigo-500/30 rounded-2xl cursor-pointer transition-all duration-300 active:scale-[0.98]"
                        onClick={() => {
                          setGeneratedPrompt(item.prompt);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed group-hover:text-indigo-200 transition-colors">
                          {item.task}
                        </p>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}