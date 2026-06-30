import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Play, CheckCircle, Info, ArrowRight, ShieldCheck, HardHat, FileCheck, AlertTriangle } from 'lucide-react';

export default function SiteInduction() {
    const [step, setStep] = useState(0); // 0: Start, 1: Video/Content, 2: Quiz, 3: Success
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

    const quizQuestions = [
        {
            q: "What is the mandatory PPE for the Workshop area?",
            options: ["Safety glasses only", "Ear protection and high-vis vest", "Safety glasses, high-vis vest, and steel-toe boots", "None"],
            correct: 2
        },
        {
            q: "Who should you report an unsafe condition to?",
            options: ["Supervisor or SSMA Focal Point", "Company CEO only", "Local authorities", "Keep it to yourself"],
            correct: 0
        },
        {
            q: "In case of fire alarm, where is the primary assembly point?",
            options: ["Workshop entrance", "Main Gate Parking", "Cafeteria", "Admin Building"],
            correct: 1
        }
    ];

    const allAnswered = Object.keys(quizAnswers).length === quizQuestions.length;
    const score = Object.entries(quizAnswers).reduce((acc, [idx, ans]) => acc + (ans === quizQuestions[parseInt(idx)].correct ? 1 : 0), 0);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Site Induction</h1>
                    <p className="text-slate-500 font-medium">Mandatory safety training for site access.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Training Session Active</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div 
                        key="start"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                            <GraduationCap size={48} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome to the Safety Induction</h2>
                            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
                                This training is required for all personnel and visitors entering the facility. You will review safety standards and complete a quick knowledge check.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <ShieldCheck className="text-indigo-500 mb-2" size={20} />
                                <div className="text-xs font-black text-slate-900 dark:text-white uppercase mb-1">Module 1</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Golden Rules</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <HardHat className="text-amber-500 mb-2" size={20} />
                                <div className="text-xs font-black text-slate-900 dark:text-white uppercase mb-1">Module 2</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PPE Standards</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <AlertTriangle className="text-rose-500 mb-2" size={20} />
                                <div className="text-xs font-black text-slate-900 dark:text-white uppercase mb-1">Module 3</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Emergency Response</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setStep(1)}
                            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-3 mx-auto"
                        >
                            Start Training <Play size={20} />
                        </button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div 
                        key="content"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden flex items-center justify-center relative group">
                            <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200" alt="Training" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-[2000ms]" />
                            <div className="relative z-10 text-center text-white space-y-4 px-12">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border border-white/30 cursor-pointer hover:bg-white/30 transition-all">
                                    <Play size={40} fill="currentColor" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight">Industrial Safety Procedures (2026)</h3>
                                <p className="text-white/70 font-medium max-w-md mx-auto">Watch this 5-minute video to understand the site hazards and emergency procedures.</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600">
                                    <Info size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">Key Takeaways</h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Always wear PPE in restricted zones", "No cellphones while operating equipment", "Report every near-miss immediately", "Keep fire exits clear at all times"].map((t, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                <CheckCircle size={16} className="text-emerald-500" /> {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                <button onClick={() => setStep(2)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700">
                                    Continue to Quiz <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        key="quiz"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-2xl space-y-10"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Knowledge Check</h2>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {Object.keys(quizAnswers).length} of 3</div>
                        </div>
                        <div className="space-y-8">
                            {quizQuestions.map((q, qIdx) => (
                                <div key={qIdx} className="space-y-4">
                                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{qIdx + 1}. {q.q}</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {q.options.map((opt, oIdx) => (
                                            <button 
                                                key={oIdx}
                                                onClick={() => setQuizAnswers({...quizAnswers, [qIdx]: oIdx})}
                                                className={`p-4 rounded-2xl border text-left text-sm font-bold transition-all ${
                                                    quizAnswers[qIdx] === oIdx 
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                                                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400'
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center pt-6">
                            <button 
                                disabled={!allAnswered}
                                onClick={() => setStep(3)}
                                className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-xl shadow-emerald-100 dark:shadow-none"
                            >
                                Submit Certification
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 p-16 rounded-[3.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 border-4 border-emerald-500 shadow-lg animate-bounce">
                            <FileCheck size={48} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Congratulations!</h2>
                            <p className="text-slate-500 font-medium">You have passed the Site Induction with a score of {score}/3.</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 max-w-sm mx-auto">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Digital Certificate ID</div>
                            <div className="text-xl font-mono font-black text-slate-900 dark:text-white">SI-2026-XF98-B2</div>
                            <div className="text-[10px] font-bold text-emerald-500 uppercase mt-4">Valid until: June 2027</div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
                            <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2">Download PDF <ArrowRight size={18} /></button>
                            <button onClick={() => setStep(0)} className="px-8 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200">Close</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
