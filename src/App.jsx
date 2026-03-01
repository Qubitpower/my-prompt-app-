import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Wand2, History, Copy, Check, BrainCircuit, Sparkles } from 'lucide-react';

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
    if (!task) return;
    setLoading(true);
    try {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Ты Senior Prompt Engineer. Создай детальный промпт CO-STAR для: ${task}` }] }]
        })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ошибка ключа!";
      setGeneratedPrompt(text);
      await addDoc(collection(db, `users/${user.uid}/prompts`), { task, prompt: text, createdAt: serverTimestamp() });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-10">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center gap-4 mb-10 text-3xl font-bold uppercase tracking-tighter">
          <BrainCircuit size={40} className="text-blue-500" />
          <span>Prompt <span className="text-blue-500">Architect</span></span>
        </header>
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
            <textarea className="w-full bg-slate-900 rounded-xl p-4 h-40 outline-none focus:ring-2 ring-blue-500"
              value={task} onChange={e => setTask(e.target.value)} placeholder="Твоя идея..." />
            <button onClick={generatePrompt} className="w-full mt-4 bg-blue-600 py-4 rounded-xl font-bold">ГЕНЕРИРОВАТЬ</button>
            {generatedPrompt && <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-blue-500/50 text-sm">{generatedPrompt}</div>}
          </div>
          <div className="bg-slate-800 p-8 rounded-3xl">
            <h3 className="font-bold mb-4 opacity-50 uppercase text-xs">История</h3>
            <div className="space-y-3">
              {history.map(item => <div key={item.id} className="p-3 bg-slate-900 rounded-lg text-xs truncate cursor-pointer" onClick={() => setGeneratedPrompt(item.prompt)}>{item.task}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}