
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Shield, ChevronLeft, ChevronRight, X, Maximize, Minimize,
  Target, Zap, HardHat, Smartphone, CalendarClock,
  Database, Monitor, Lock, Server, Key, Mail,
  Rocket, Code, CheckCircle,
  User, Users, Award, Briefcase, HeartHandshake, FileText, Phone, GraduationCap, Activity, CreditCard, Wallet, Wrench, Layers,
  AlertTriangle, RotateCcw, Play, CheckSquare, Wifi, ScanFace, Bluetooth, FileSpreadsheet, ScrollText, Grid,
  Globe, Building2, BrainCircuit, Sparkles, MapPin, Search,
  GitMerge, RefreshCw, Link2, Factory
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectProposal: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Safety check
  if (!t || !t.proposal || !t.proposal.aboutMe || !t.proposal.objectives) {
      return (
          <div className="p-8 text-white bg-slate-900 h-screen flex items-center justify-center">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  Loading Presentation...
              </div>
          </div>
      );
  }

  // Define Slides Structure
  const slides = [
    { id: 'title', type: 'title' },
    { id: 'aboutMe', type: 'aboutMe', title: t.proposal.aboutMe.title },
    { id: 'scenario', type: 'scenario', title: 'Real World Scenario' },
    { id: 'summary', type: 'content', title: t.proposal.execSummary.title },
    { id: 'objectives', type: 'objectives', title: t.proposal.objectives.title },
    { id: 'integration', type: 'integration', title: 'Unified Data Integration' },
    { id: 'organogram', type: 'organogram', title: t.proposal.organogram.title },
    { id: 'timeline', type: 'timeline', title: t.proposal.timeline.title },
    { id: 'tech', type: 'tech', title: t.proposal.techStack.title },
    { id: 'financials', type: 'financials', title: t.proposal.financials.title },
    { id: 'roadmap', type: 'roadmap', title: t.proposal.roadmap.title },
    { id: 'alcohol', type: 'alcohol', title: t.proposal.futureUpdates.title },
    { id: 'enhanced', type: 'enhanced', title: t.proposal.enhancedCaps.title },
    { id: 'conclusion', type: 'conclusion', title: t.proposal.conclusion.title },
    { id: 'thankYou', type: 'thankYou', title: t.proposal.thankYou.title },
  ];

  const toggleFullScreen = async () => {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    } catch (e) {
        console.error("Fullscreen toggled failed", e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
      if (currentSlide < slides.length - 1) setCurrentSlide(curr => curr + 1);
  };

  const prevSlide = () => {
      if (currentSlide > 0) setCurrentSlide(curr => curr - 1);
  };

  // --- Slide Components ---

  const TitleSlide = () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 relative z-10 animate-fade-in-up">
          <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse-slow"></div>
          
          <div className="relative mb-12 group">
              <div className="absolute inset-0 bg-yellow-500 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
              <Shield size={140} className="text-yellow-500 relative z-10 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-float" />
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tight mb-6 leading-tight drop-shadow-lg">
              {t.common.vulcan}
          </h1>
          
          <div className="h-1.5 w-32 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-8 shadow-lg shadow-orange-500/50"></div>

          <h2 className="text-xl md:text-4xl text-slate-300 font-light uppercase tracking-[0.3em] animate-slide-in-right">
              {t.proposal.digitalTrans}
          </h2>
          
          <div className="mt-16 flex items-center gap-4 px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors shadow-2xl">
              <span className="text-sm md:text-base font-bold text-slate-300">PITA DOMINGOS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_10px_#eab308]"></span>
              <span className="text-sm md:text-base font-mono text-yellow-500 tracking-widest">DigiSols</span>
          </div>
      </div>
  );

  const SummarySlide = () => (
      <div className="flex flex-col justify-center h-full max-w-5xl mx-auto text-center px-4 relative z-10 animate-fade-in-up">
          <div className="mb-12">
              <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 mb-6 drop-shadow-sm tracking-tight">
                  {t.proposal.execSummary.title}
              </h2>
              <div className="w-24 h-1.5 bg-yellow-500 mx-auto rounded-full shadow-[0_0_15px_#eab308]"></div>
          </div>
          
          <div className="bg-slate-900/50 p-10 md:p-14 rounded-[3rem] border border-white/10 backdrop-blur-xl shadow-2xl relative group hover:bg-slate-900/60 transition-colors">
              <div className="absolute -top-6 -left-6 text-6xl text-yellow-500/30 font-serif group-hover:text-yellow-500/50 transition-colors">"</div>
              <div className="text-xl md:text-3xl text-slate-200 leading-relaxed font-light">
                  {t.proposal.execSummary.text}
              </div>
              <div className="absolute -bottom-6 -right-6 text-6xl text-yellow-500/30 font-serif rotate-180 group-hover:text-yellow-500/50 transition-colors">"</div>
          </div>

          <div className="mt-12 text-slate-400 italic text-lg animate-pulse">
              {t.proposal.execSummary.quote}
          </div>
      </div>
  );

  const IntegrationSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-7xl mx-auto px-6 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center tracking-tight">Unified Data Architecture</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              {/* Source Systems */}
              <div className="space-y-6">
                  <div className="bg-slate-900/80 p-6 rounded-2xl border border-blue-500/30 flex items-center gap-4">
                      <div className="p-3 bg-blue-900/50 rounded-xl"><Users size={24} className="text-blue-400"/></div>
                      <div>
                          <h4 className="font-bold text-white text-lg">HR Database</h4>
                          <p className="text-slate-400 text-sm">Permanent Staff (SuccessFactors)</p>
                      </div>
                  </div>
                  <div className="bg-slate-900/80 p-6 rounded-2xl border border-orange-500/30 flex items-center gap-4">
                      <div className="p-3 bg-orange-900/50 rounded-xl"><HardHat size={24} className="text-orange-400"/></div>
                      <div>
                          <h4 className="font-bold text-white text-lg">Célula de Contracto</h4>
                          <p className="text-slate-400 text-sm">Contractor Management DB</p>
                      </div>
                  </div>
              </div>

              {/* Middleware Engine */}
              <div className="flex flex-col items-center">
                  <div className="h-10 w-0.5 bg-gradient-to-b from-transparent via-slate-500 to-slate-500 lg:hidden"></div>
                  <div className="hidden lg:flex items-center gap-2 mb-4 animate-pulse">
                      <span className="h-0.5 w-16 bg-slate-500"></span>
                      <ChevronRight size={24} className="text-slate-500"/>
                  </div>

                  <div className="bg-slate-800 p-8 rounded-full border-4 border-slate-700 shadow-[0_0_50px_rgba(99,102,241,0.3)] relative z-10">
                      <GitMerge size={64} className="text-indigo-400" />
                  </div>
                  <div className="mt-6 text-center">
                      <h3 className="text-2xl font-black text-indigo-300">CARS Middleware</h3>
                      <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                          Nightly synchronization engine utilizing Read-Only APIs to merge & normalize datasets.
                      </p>
                  </div>

                  <div className="hidden lg:flex items-center gap-2 mt-4 animate-pulse">
                      <ChevronRight size={24} className="text-slate-500"/>
                      <span className="h-0.5 w-16 bg-slate-500"></span>
                  </div>
                  <div className="h-10 w-0.5 bg-gradient-to-b from-slate-500 to-transparent lg:hidden"></div>
              </div>

              {/* CARS Application */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] border border-indigo-500/50 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Database size={100} />
                  </div>
                  <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg">
                              <Shield size={32} />
                          </div>
                          <h3 className="text-3xl font-black text-white">CARS Manager</h3>
                      </div>
                      <p className="text-lg text-slate-300 leading-relaxed mb-6">
                          A single, unified "Source of Truth" for site safety.
                      </p>
                      <ul className="space-y-3">
                          <li className="flex items-center gap-3 text-slate-300">
                              <CheckCircle size={18} className="text-green-400" />
                              <span>Auto-Updates (No manual entry)</span>
                          </li>
                          <li className="flex items-center gap-3 text-slate-300">
                              <CheckCircle size={18} className="text-green-400" />
                              <span>Conflict Resolution (VUL vs CON)</span>
                          </li>
                          <li className="flex items-center gap-3 text-slate-300">
                              <CheckCircle size={18} className="text-green-400" />
                              <span>Live Status Calculation</span>
                          </li>
                      </ul>
                  </div>
              </div>

          </div>
      </div>
  );

  const ObjectivesSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-4 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center">{t.proposal.objectives.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-3xl backdrop-blur-md">
                  <div className="flex items-center gap-4 mb-6">
                      <Target size={40} className="text-red-500" />
                      <h3 className="text-2xl font-bold text-white">{t.proposal.objectives.problemTitle}</h3>
                  </div>
                  <p className="text-lg text-slate-300 leading-relaxed">{t.proposal.objectives.problemText}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-3xl backdrop-blur-md">
                  <div className="flex items-center gap-4 mb-6">
                      <CheckCircle size={40} className="text-emerald-500" />
                      <h3 className="text-2xl font-bold text-white">{t.proposal.objectives.solutionTitle}</h3>
                  </div>
                  <ul className="space-y-4">
                      {t.proposal.objectives.goals.map((goal: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-slate-300 text-lg">
                              <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                              {goal}
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      </div>
  );

  const OrganogramSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center">{t.proposal.organogram.title}</h2>
          <div className="flex flex-col items-center gap-8">
              <div className="p-6 bg-slate-800 border border-blue-500 rounded-2xl w-64 text-center shadow-lg shadow-blue-500/20">
                  <User size={32} className="mx-auto mb-2 text-blue-400" />
                  <div className="font-bold text-white">Pita Domingos</div>
                  <div className="text-blue-300 text-sm">Lead Architect</div>
              </div>
              <div className="h-8 w-0.5 bg-slate-600"></div>
              <div className="grid grid-cols-2 gap-16">
                  <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-2xl w-64 text-center">
                      <Code size={24} className="mx-auto mb-2 text-purple-400" />
                      <div className="font-bold text-white">{t.proposal.organogram.tech1}</div>
                  </div>
                  <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-2xl w-64 text-center">
                      <Server size={24} className="mx-auto mb-2 text-green-400" />
                      <div className="font-bold text-white">{t.proposal.organogram.tech2}</div>
                  </div>
              </div>
          </div>
      </div>
  );

  const TimelineSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center">{t.proposal.timeline.title}</h2>
          <div className="space-y-6">
              {[
                  { title: t.proposal.timeline.phase1, desc: t.proposal.timeline.phase1desc, color: 'bg-blue-500' },
                  { title: t.proposal.timeline.phase2, desc: t.proposal.timeline.phase2desc, color: 'bg-indigo-500' },
                  { title: t.proposal.timeline.phase3, desc: t.proposal.timeline.phase3desc, color: 'bg-purple-500' },
                  { title: t.proposal.timeline.phase4, desc: t.proposal.timeline.phase4desc, color: 'bg-emerald-500' },
                  { title: t.proposal.timeline.phase5, desc: t.proposal.timeline.phase5desc, color: 'bg-orange-500' },
              ].map((phase, i) => (
                  <div key={i} className="flex gap-6 items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors">
                      <div className={`w-12 h-12 rounded-full ${phase.color} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg`}>
                          {i + 1}
                      </div>
                      <div>
                          <h4 className="text-xl font-bold text-white mb-1">{phase.title}</h4>
                          <p className="text-slate-400 text-sm">{phase.desc}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const RoadmapSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-7xl mx-auto px-4 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-12 text-center">{t.proposal.roadmap.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
                  <Key size={32} className="text-blue-400 mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">{t.proposal.roadmap.auth}</h4>
                  <p className="text-slate-400">{t.proposal.roadmap.authDesc}</p>
              </div>
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
                  <Rocket size={32} className="text-cyan-400 mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">{t.proposal.roadmap.db}</h4>
                  <p className="text-slate-400">{t.proposal.roadmap.dbDesc}</p>
              </div>
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
                  <Mail size={32} className="text-pink-400 mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">{t.proposal.roadmap.email}</h4>
                  <p className="text-slate-400">{t.proposal.roadmap.emailDesc}</p>
              </div>
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
                  <Smartphone size={32} className="text-green-400 mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">{t.proposal.roadmap.hosting}</h4>
                  <p className="text-slate-400">{t.proposal.roadmap.hostingDesc}</p>
              </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-900 to-blue-900 p-8 rounded-3xl border border-indigo-700 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10"><BrainCircuit size={150} /></div>
              <div className="relative z-10 flex items-center gap-4 mb-4">
                  <Sparkles className="text-yellow-400" size={32} />
                  <h3 className="text-2xl font-bold text-white">{t.proposal.aiFeatures.title}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <p className="text-slate-200">{t.proposal.aiFeatures.chatbot}</p>
                  <p className="text-slate-200">{t.proposal.aiFeatures.reporting}</p>
              </div>
          </div>
      </div>
  );

  const AlcoholSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-4 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center">{t.proposal.futureUpdates.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-amber-500/10 border border-amber-500/30 p-10 rounded-[3rem] backdrop-blur-sm">
                  <div className="flex items-center gap-4 mb-6">
                      <Code size={40} className="text-amber-500" />
                      <h3 className="text-3xl font-bold text-white">Module A</h3>
                  </div>
                  <h4 className="text-xl text-amber-200 mb-4 font-bold">Software Integration</h4>
                  <p className="text-lg text-slate-300 leading-relaxed">
                      {t.proposal.futureUpdates.moduleA.split('-')[1]}
                  </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-600 p-10 rounded-[3rem] backdrop-blur-sm">
                  <div className="flex items-center gap-4 mb-6">
                      <HardHat size={40} className="text-slate-400" />
                      <h3 className="text-3xl font-bold text-white">Module B</h3>
                  </div>
                  <h4 className="text-xl text-slate-300 mb-4 font-bold">Physical Infrastructure</h4>
                  <p className="text-lg text-slate-300 leading-relaxed">
                      {t.proposal.futureUpdates.moduleB.split('-')[1]}
                  </p>
              </div>
          </div>
      </div>
  );

  const EnhancedSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-7xl mx-auto px-4 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center">{t.proposal.enhancedCaps.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-700 hover:border-blue-500 transition-colors">
                  <ScanFace size={48} className="text-blue-500 mb-6" />
                  <h4 className="text-xl font-bold text-white mb-3">Mobile Verification</h4>
                  <p className="text-slate-400 leading-relaxed">{t.proposal.enhancedCaps.mobileVerify.desc}</p>
              </div>
              <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-700 hover:border-green-500 transition-colors">
                  <CalendarClock size={48} className="text-green-500 mb-6" />
                  <h4 className="text-xl font-bold text-white mb-3">Auto-Booking</h4>
                  <p className="text-slate-400 leading-relaxed">{t.proposal.enhancedCaps.autoBooking.desc}</p>
              </div>
              <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-700 hover:border-purple-500 transition-colors">
                  <Database size={48} className="text-purple-500 mb-6" />
                  <h4 className="text-xl font-bold text-white mb-3">Mass Data</h4>
                  <p className="text-slate-400 leading-relaxed">{t.proposal.enhancedCaps.massData.desc}</p>
              </div>
          </div>
      </div>
  );

  const ConclusionSlide = () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 relative z-10 animate-fade-in-up">
          <div className="mb-16">
              <Shield size={120} className="text-emerald-500 mx-auto mb-8 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight">
                  {t.proposal.conclusion.title}
              </h2>
              <div className="w-32 h-2 bg-emerald-500 mx-auto rounded-full"></div>
          </div>
          <p className="text-2xl md:text-4xl text-slate-300 font-light max-w-5xl leading-relaxed">
              "{t.proposal.conclusion.text}"
          </p>
      </div>
  );

  const AboutMeSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-[1600px] mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-full items-center">
              
              <div className="lg:col-span-5 flex flex-col justify-center animate-slide-in-right">
                  <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                      <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl">
                          <div className="flex items-center gap-4 mb-6">
                              <div className="p-4 bg-slate-800 rounded-2xl text-yellow-500 border border-slate-700 shadow-inner">
                                  <User size={40} />
                              </div>
                              <div>
                                  <h3 className="text-3xl font-black text-white tracking-tight">{t.proposal.aboutMe.name}</h3>
                                  <p className="text-lg text-slate-400 font-serif italic">"{t.proposal.aboutMe.preferred}"</p>
                              </div>
                          </div>
                          
                          <div className="space-y-4 mb-8">
                              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors">
                                  <Award className="text-blue-400" size={24} />
                                  <span className="font-bold text-slate-200">{t.proposal.aboutMe.cert}</span>
                              </div>
                              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors">
                                  <Briefcase className="text-green-400" size={24} />
                                  <span className="text-slate-200">{t.proposal.aboutMe.role}</span>
                              </div>
                          </div>

                          <p className="text-slate-400 leading-relaxed text-justify border-t border-slate-800 pt-6 font-light">
                              {t.proposal.aboutMe.bio}
                          </p>
                      </div>
                  </div>
              </div>

              <div className="lg:col-span-7 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <h4 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                      <Layers className="text-yellow-500" /> Portfolio & Stack
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                          { name: 'EduDesk', sub: 'Education SaaS', icon: GraduationCap, color: 'indigo' },
                          { name: 'H365', sub: 'Health SaaS', icon: Activity, color: 'rose' },
                          { name: 'SwiftPOS', sub: 'Retail Point of Sale', icon: CreditCard, color: 'emerald' },
                          { name: 'MicroFin', sub: 'Finance Tracker', icon: Wallet, color: 'amber' },
                          { name: 'JacTrac', sub: 'Asset Tracking', icon: Wrench, color: 'orange' },
                      ].map((item, i) => (
                          <div key={i} className={`p-5 bg-slate-800/40 border border-slate-700 hover:border-${item.color}-500/50 rounded-2xl hover:bg-slate-800 transition-all cursor-default group backdrop-blur-sm`}>
                              <div className={`w-10 h-10 rounded-lg bg-${item.color}-500/20 flex items-center justify-center text-${item.color}-400 mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                                  <item.icon size={20} />
                              </div>
                              <div className="font-bold text-white text-lg">{item.name}</div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">{item.sub}</div>
                          </div>
                      ))}
                  </div>

                  <div className="mt-8 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-md">
                      <div className="flex justify-between text-sm text-slate-400 font-mono mb-2">
                          <span>Full Stack Proficiency</span>
                          <span>React • Node • Python</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 w-[95%] animate-pulse"></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const ScenarioSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-[1600px] mx-auto px-4 md:px-12 relative z-10">
          <div className="flex items-center gap-6 mb-16 animate-fade-in-down">
              <div className="p-5 bg-orange-500/10 rounded-3xl border border-orange-500/30 backdrop-blur-md shadow-[0_0_50px_rgba(249,115,22,0.2)]">
                  <Play size={48} className="text-orange-500" />
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">Zero-Downtime Workflow</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8 relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="bg-slate-900/40 p-8 rounded-3xl border border-red-500/30 backdrop-blur-sm relative ml-0 hover:bg-slate-900/60 transition-colors group">
                      <h3 className="text-2xl font-bold text-red-400 mb-3">The Risk</h3>
                      <p className="text-lg text-slate-300 leading-relaxed">
                          Operator <strong>Paulo Manjate</strong> has a Critical RAC 02 certification expiring in <strong className="text-white bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">3 days</strong>.
                          Access denial is imminent.
                      </p>
                  </div>

                  <div className="bg-slate-900/40 p-8 rounded-3xl border border-green-500/30 backdrop-blur-sm relative ml-0 hover:bg-slate-900/60 transition-colors group">
                      <h3 className="text-2xl font-bold text-green-400 mb-3">The Auto-Fix</h3>
                      <p className="text-lg text-slate-300 leading-relaxed">
                          System detects risk &lt; 7 Days.
                          Automatically <strong className="text-green-400">reserves a seat</strong> in the next available session.
                      </p>
                  </div>
              </div>
          </div>
      </div>
  );

  const FinancialsSlide = () => {
      // Adjusted for exactly $18,000 Initial and $4,000 Recurring
      const financialsItems = [
          { name: 'Core Architecture & Initial Development', type: 'Phase 1', cost: '$12,000.00' },
          { name: 'System Setup & API Integration Layer', type: 'Phase 2', cost: '$6,000.00' },
          { name: 'Cloud Infrastructure & Managed SaaS Hosting', type: 'Monthly', cost: '$2,500.00' },
          { name: 'Ongoing Maintenance & Robotic Engine Support', type: 'Monthly', cost: '$1,500.00' }
      ];

      return (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-4 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-12">{t.proposal.financials.title}</h2>
          
          <div className="bg-slate-900/80 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="divide-y divide-slate-800">
                  <div className="grid grid-cols-12 p-4 bg-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-6">Item Description</div>
                      <div className="col-span-3">Type</div>
                      <div className="col-span-2 text-right">Cost</div>
                  </div>
                  {financialsItems.map((item: any, i: number) => (
                      <div key={i} className="grid grid-cols-12 p-5 hover:bg-slate-800/50 transition-colors items-center">
                          <div className="col-span-1 text-center font-mono text-slate-500">{i+1}</div>
                          <div className="col-span-6 text-white font-medium text-base">{item.name}</div>
                          <div className="col-span-3 text-sm text-slate-400">{item.type}</div>
                          <div className="col-span-2 text-right font-mono text-lg text-slate-300">{item.cost}</div>
                      </div>
                  ))}
              </div>

              <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-8 flex flex-col md:flex-row justify-between items-stretch text-white relative overflow-hidden gap-6 border-t border-slate-700">
                  <div className="flex-1 bg-slate-800/50 p-4 rounded-xl border border-emerald-500/30 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                      <div className="text-xs uppercase font-bold text-slate-400 mb-1">Total Initial Investment</div>
                      <div className="text-3xl font-black font-mono tracking-tight text-white">$18,000.00</div>
                  </div>
                  <div className="flex-1 bg-slate-800/50 p-4 rounded-xl border border-blue-500/30 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <div className="text-xs uppercase font-bold text-slate-400 mb-1">Monthly Recurring Services</div>
                      <div className="text-3xl font-black font-mono tracking-tight text-white">$4,000.00</div>
                  </div>
              </div>
          </div>
      </div>
      );
  };

  const TechSlide = () => (
      <div className="flex flex-col justify-center h-full max-w-7xl mx-auto px-4 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-16">{t.proposal.techStack.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TechCard icon={Monitor} title={t.proposal.techStack.frontendTitle} desc={t.proposal.techStack.frontend} color="blue" />
              <TechCard icon={Server} title={t.proposal.techStack.backendTitle} desc={t.proposal.techStack.backend} color="green" />
              <TechCard icon={Database} title={t.proposal.techStack.databaseTitle} desc={t.proposal.techStack.database} color="yellow" />
              <TechCard icon={Lock} title={t.proposal.techStack.securityTitle} desc={t.proposal.techStack.security} color="red" />
          </div>
      </div>
  );

  const TechCard = ({ icon: Icon, title, desc, color }: any) => (
      <div className="flex items-center gap-6 p-8 bg-slate-900/60 rounded-3xl border border-slate-800 backdrop-blur-sm hover:border-slate-600 transition-all group">
          <div className={`w-20 h-20 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-500 shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform`}>
              <Icon size={40} />
          </div>
          <div>
              <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 font-mono text-sm">{desc}</p>
          </div>
      </div>
  );

  const ThankYouSlide = () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 relative z-10">
          <div className="mb-12">
              <div className="inline-block p-8 bg-slate-800 rounded-full mb-8 shadow-2xl animate-pulse">
                  <HeartHandshake size={80} className="text-pink-500" />
              </div>
              <h2 className="text-6xl md:text-9xl font-black text-white mb-6 tracking-tighter">Thank You</h2>
              <p className="text-2xl text-slate-400 font-light">Let's build a safer future together.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 mt-8">
              <div className="bg-slate-900 border border-slate-700 px-10 py-6 rounded-3xl flex items-center gap-4">
                  <Mail size={32} className="text-blue-400"/>
                  <span className="text-xl md:text-2xl font-bold text-white">pita.domingos@zd044.onmicrosoft.com</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 px-10 py-6 rounded-3xl flex items-center gap-4">
                  <Phone size={32} className="text-green-400"/>
                  <span className="text-xl md:text-2xl font-bold text-white">+258 84 547 9481</span>
              </div>
          </div>
      </div>
  );

  // Generic render
  const renderSlide = () => {
      switch(slides[currentSlide].id) {
          case 'title': return <TitleSlide />;
          case 'aboutMe': return <AboutMeSlide />;
          case 'scenario': return <ScenarioSlide />;
          case 'summary': return <SummarySlide />;
          case 'objectives': return <ObjectivesSlide />;
          case 'integration': return <IntegrationSlide />;
          case 'organogram': return <OrganogramSlide />;
          case 'timeline': return <TimelineSlide />;
          case 'tech': return <TechSlide />;
          case 'financials': return <FinancialsSlide />;
          case 'roadmap': return <RoadmapSlide />;
          case 'alcohol': return <AlcoholSlide />;
          case 'enhanced': return <EnhancedSlide />;
          case 'conclusion': return <ConclusionSlide />;
          case 'thankYou': return <ThankYouSlide />;
          default: return <SummarySlide />;
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-hidden font-sans select-none">
        {/* Background */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#020617] to-slate-900"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[150px] animate-pulse-slow"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full w-full overflow-y-auto pb-32 scrollbar-hide">
            <div className="min-h-full flex flex-col justify-center p-4 md:p-8 lg:p-16">
                {renderSlide()}
            </div>
        </div>

        {/* Nav Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center px-2 shadow-2xl z-50 ring-1 ring-white/5 transition-all hover:bg-white/10">
            <button onClick={prevSlide} disabled={currentSlide === 0} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-white transition-all active:scale-90"><ChevronLeft size={24} /></button>
            <div className="px-6 flex flex-col items-center min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slide</span>
                <span className="text-lg font-mono font-bold text-white leading-none">{currentSlide + 1} <span className="text-slate-600">/</span> {slides.length}</span>
            </div>
            <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-white transition-all active:scale-90"><ChevronRight size={24} /></button>
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <button onClick={toggleFullScreen} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all">{isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
            <button onClick={() => navigate('/')} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-all ml-1"><X size={20} /></button>
        </div>
        <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out z-50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}></div>
    </div>
  );
};

export default ProjectProposal;
