import React, { useState, useEffect } from 'react';
import { 
  Shield, Database, Calendar, Users, 
  FileText, Activity, AlertTriangle, 
  CheckCircle, Smartphone,
  ChevronLeft, ChevronRight, Maximize, Minimize, X,
  Lock, Server, CheckCircle2, XCircle, Search,
  Building2, Map, Layout, Zap, Terminal, Workflow, Settings,
  Cpu, GitPullRequest, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const AdminManualPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

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
        console.error("Fullscreen toggle failed", e);
    }
  };

  if (!t || !t.adminManual || !t.adminManual.slides) return null;

  const slides = [
      { id: 'intro', title: t.adminManual.slides.intro },
      { id: 'logic', title: t.adminManual.slides.logic },
      { id: 'dashboard', title: t.adminManual.slides.dashboard },
      { id: 'branding', title: t.settings.tabs.branding || 'Branding' },
      { id: 'workflows', title: t.adminManual.slides.workflows },
      { id: 'advanced', title: t.adminManual.slides.advanced },
      { id: 'robotics', title: t.adminManual.slides.robotics },
      { id: 'troubleshoot', title: t.adminManual.slides.troubleshoot },
      { id: 'architecture', title: t.adminManual.slides.architecture }
  ];

  const nextSlide = () => { if (currentSlide < slides.length - 1) setCurrentSlide(curr => curr + 1); };
  const prevSlide = () => { if (currentSlide > 0) setCurrentSlide(curr => curr - 1); };

  // --- SLIDE COMPONENTS ---

  const IntroSlide = () => (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative z-10 animate-fade-in-up">
          <div className="relative mb-8 md:mb-12">
              <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-30 animate-pulse-slow"></div>
              <Shield size={160} className="text-white relative z-10 drop-shadow-[0_0_50px_rgba(59,130,246,0.6)] animate-float" />
          </div>
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tighter mb-6 leading-tight">
            {t.adminManual.title}
          </h1>
          <p className="text-lg md:text-2xl text-blue-200 font-light max-w-3xl leading-relaxed mx-auto">
            {t.adminManual.subtitle}
          </p>
      </div>
  );

  const BrandingSlide = () => (
    <div className="flex flex-col justify-center min-h-[70vh] max-w-5xl mx-auto px-6 relative z-10 animate-fade-in-up py-12">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-10 text-center tracking-tight flex items-center justify-center gap-4">
            <Sparkles size={40} className="text-yellow-400" />
            {t.settings.branding.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/90 border border-indigo-500/30 p-8 rounded-[2rem] relative overflow-hidden group hover:bg-slate-800/90 transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Layout size={80} /></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-3">{t.settings.branding.appName}</h3>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                        Customize the portal identity. Enterprise Admins can override the default system name with their internal safety brand (e.g., "RACS Safety").
                    </p>
                </div>
            </div>
            <div className="bg-slate-900/90 border border-yellow-500/30 p-8 rounded-[2rem] relative overflow-hidden group hover:bg-slate-800/90 transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><ImageIcon size={80} /></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-3">{t.settings.branding.safetyLogo}</h3>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                        Upload dedicated safety badges. This logo appears in the primary sidebar and branded zones, ensuring high workforce familiarity.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );

  const LogicSlide = () => (
      <div className="flex flex-col justify-center min-h-[70vh] max-w-6xl mx-auto px-6 relative z-10 py-12">
          <div className="text-center mb-12 animate-fade-in-down">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">{t.adminManual.content.logic.title}</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t.adminManual.content.logic.desc}</p>
          </div>
          <div className="relative group animate-fade-in-up">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-8 md:p-12 rounded-[2rem] shadow-2xl">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
                      <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl flex flex-col items-center min-w-[140px]">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Input 1</span>
                          <div className="text-blue-400 font-black text-xl flex items-center gap-2"><CheckCircle size={18}/> {t.adminManual.content.logic.active}</div>
                      </div>
                      <span className="text-slate-600 font-black text-xl">+</span>
                      <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl flex flex-col items-center min-w-[140px]">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Input 2</span>
                          <div className="text-orange-400 font-black text-xl flex items-center gap-2"><Calendar size={18}/> {t.adminManual.content.logic.aso}</div>
                      </div>
                      <span className="text-slate-600 font-black text-xl">+</span>
                      <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl flex flex-col items-center min-w-[140px]">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Input 3</span>
                          <div className="text-yellow-400 font-black text-xl flex items-center gap-2"><Database size={18}/> {t.adminManual.content.logic.racs}</div>
                      </div>
                      <span className="text-slate-600 font-black text-xl">=</span>
                      <div className="bg-green-500/20 border border-green-500/50 px-8 py-6 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                          <div className="text-green-400 font-black text-2xl tracking-wide uppercase">{t.adminManual.content.logic.result}</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderSlide = () => {
      switch(slides[currentSlide].id) {
          case 'intro': return <IntroSlide />;
          case 'branding': return <BrandingSlide />;
          case 'logic': return <LogicSlide />;
          default: return <div className="flex items-center justify-center min-h-[70vh] text-slate-500 font-mono italic">Module Content Under Review...</div>;
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-hidden font-sans select-none flex flex-col">
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#020617] to-slate-900"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] animate-pulse-slow"></div>
        </div>

        {/* Content Container - Scrollable */}
        <div className="relative z-10 flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col">
            <div className="flex-1 w-full flex flex-col justify-center px-4 md:px-8 lg:px-16 py-12">
                {renderSlide()}
            </div>
            
            {/* Nav Padding to avoid overlap with sticky bar */}
            <div className="h-32 w-full shrink-0"></div>
        </div>

        {/* Navigation Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 h-16 md:h-20 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-full flex items-center px-4 shadow-2xl z-50 ring-1 ring-white/5 transition-all hover:bg-slate-900/80">
            <button 
                onClick={prevSlide} 
                disabled={currentSlide === 0} 
                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-white transition-all active:scale-90"
            >
                <ChevronLeft size={32} />
            </button>
            <div className="px-6 md:px-10 flex flex-col items-center min-w-[150px] md:min-w-[200px]">
                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin Guide</span>
                <span className="text-xl md:text-2xl font-mono font-bold text-white leading-none">
                    {currentSlide + 1} <span className="text-slate-600">/</span> {slides.length}
                </span>
            </div>
            <button 
                onClick={nextSlide} 
                disabled={currentSlide === slides.length - 1} 
                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-white transition-all active:scale-90"
            >
                <ChevronRight size={32} />
            </button>
            <div className="w-px h-10 bg-white/10 mx-4 hidden md:block"></div>
            <button 
                onClick={toggleFullScreen} 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <button 
                onClick={() => navigate('/')} 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-all ml-2"
            >
                <X size={20} />
            </button>
        </div>

        {/* Progress Bar Top */}
        <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out z-[110] shadow-[0_0_20px_rgba(59,130,246,0.5)]" style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}></div>
    </div>
  );
};

export default AdminManualPage;