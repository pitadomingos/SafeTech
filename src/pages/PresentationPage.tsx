
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
    Shield, ChevronLeft, ChevronRight, X, Maximize, Minimize,
    Target, Zap, HardHat, Smartphone, CalendarClock,
    Database, Monitor, Lock, Server, Key, Mail,
    Rocket, Code, CheckCircle, CheckCircle2,
    User, Users, UserPlus, Award, Briefcase, HeartHandshake, Phone, GraduationCap, Activity, CreditCard, Wallet, Wrench, Layers, BookOpen,
    Play, MapPin, GitMerge, Sparkles, TrendingUp, Building2, Server as ServerIcon, Globe, Factory, BrainCircuit,
    ScanFace, AlertTriangle, ArrowRight, History, ShieldAlert, Cpu,
    CheckSquare, XCircle, Search, Terminal, Binary, FileSpreadsheet, Eye, EyeOff,
    BarChart3, Cloud, ShieldCheck, Timer, ListFilter, Bell, ArrowDown, QrCode,
    Network, Share2, RefreshCw, Radio, UserX, Clock, ExternalLink, ArrowUpRight
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, BookingStatus } from '../types';
import MobilizationDashboard from './MobilizationDashboard';
import AnalyticsDashboard from './safemap/AnalyticsDashboard';
import ExecutiveDashboard from './ExecutiveDashboard';
import DatabasePage from './DatabasePage';
import BookingForm from './BookingForm';
import ResultsPage from './ResultsPage';
import RequestCardsPage from './RequestCardsPage';
import TrainerInputPage from './TrainerInputPage';
import SettingsPage from './SettingsPage';
import { db } from '../services/databaseService';

const PresentationPage: React.FC = () => {
    const { t, language } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [skipFinancials, setSkipFinancials] = useState(true);

    // Live Training Simulation States
    const [companies, setCompanies] = useState<any[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [trainers, setTrainers] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [racDefinitions, setRacDefinitions] = useState<any[]>([]);
    const [unsafeConditions, setUnsafeConditions] = useState<any[]>([]);
    const [currentSiteId, setCurrentSiteId] = useState<string>('all');

    const refreshTrainingData = async () => {
        try {
            const [c, s, sess, b, req, racs, rms, trns, emps, conds] = await Promise.all([
                db.getCompanies(),
                db.getSites(),
                db.getSessions(),
                db.getBookings(),
                db.getRequirements(),
                db.getRacDefinitions(),
                db.getRooms(),
                db.getTrainers(),
                db.getEmployees(),
                db.getUnsafeConditions()
            ]);
            setCompanies(c);
            setSites(s);
            setSessions(sess);
            setBookings(b);
            setRequirements(req);
            setRacDefinitions(racs);
            setRooms(rms);
            setTrainers(trns);
            setEmployees(emps);
            setUnsafeConditions(conds);
        } catch (e) {
            console.error("Presentation data refresh failed:", e);
        }
    };

    useEffect(() => {
        refreshTrainingData();
    }, []);

    // Auto-set presentation_active to 'true' to prevent redirect loop for non-admins
    if (localStorage.getItem('presentation_active') !== 'true') {
        if (user) {
            localStorage.setItem('pre_presentation_user', JSON.stringify(user));
        }
        localStorage.setItem('presentation_active', 'true');
    }

    // Security Guard: Presentation is for System Admin eyes only (unless in presentation demo mode).
    const isPresentationActive = localStorage.getItem('presentation_active') === 'true';
    if (!isAuthenticated || (user?.role !== UserRole.SYSTEM_ADMIN && !isPresentationActive)) {
        return <Navigate to="/" replace />;
    }

    // Safety check for translation data
    if (!t || !t.proposal || !t.proposal.aboutMe || !t.proposal.objectives || !t.proposal.techStack || !t.proposal.financials) {
        return (
            <div className="p-8 text-white bg-slate-900 h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    Initializing Global Strategy...
                </div>
            </div>
        );
    }

    // Define Slides Structure
    const rawSlides = [
        { id: 'title', type: 'title' },
        { id: 'aboutMe', type: 'aboutMe', title: t.proposal.aboutMe.title },
        { id: 'scenario', type: 'scenario', title: t.proposal.scenario.title },
        { id: 'summary', type: 'content', title: t.proposal.execSummary.title },
        { id: 'objectives', type: 'objectives', title: t.proposal.objectives.title },
        { id: 'workflow', type: 'workflow', title: t.proposal.workflow.title },
        { id: 'integration', type: 'integration', title: t.proposal.integration.title },
        { id: 'waitlist', type: 'waitlist', title: t.proposal.waitlist.title },
        { id: 'autoScheduling', type: 'autoScheduling', title: t.proposal.autoScheduling.title },
        { id: 'mobilePortal', type: 'mobilePortal', title: (t.proposal as any).mobilePortal?.title || 'Mobile Portal' },
        { id: 'mobilizationDemo', type: 'mobilizationDemo', title: t.proposal.mobilization.title },
        { id: 'simDatabase', type: 'simDatabase', title: 'Simulation: Training Database' },
        { id: 'simBooking', type: 'simBooking', title: 'Simulation: Training Requests' },
        { id: 'simResults', type: 'simResults', title: 'Simulation: Training Records' },
        { id: 'simCards', type: 'simCards', title: 'Simulation: Card Requests' },
        { id: 'simTrainer', type: 'simTrainer', title: 'Simulation: Instructor Portal' },
        { id: 'simSettings', type: 'simSettings', title: 'Simulation: Training Settings' },
        { id: 'simSafeSite', type: 'simSafeSite', title: 'Simulation: SafeSite Dashboard' },
        { id: 'simExecutive', type: 'simExecutive', title: 'Simulation: Executive Dashboard' },
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

    const slides = skipFinancials ? rawSlides.filter(s => s.id !== 'financials') : rawSlides;

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') {
                e.preventDefault();
                nextSlide();
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                handleExit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide, skipFinancials]);

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) setCurrentSlide(curr => curr + 1);
    };

    const prevSlide = () => {
        if (currentSlide > 0) setCurrentSlide(curr => curr - 1);
    };

    const handleExit = () => {
        localStorage.removeItem('presentation_active');
        localStorage.removeItem('cars_active_module');
        navigate('/');
        window.location.reload();
    };

    // --- Slide Components ---

    const TitleSlide = () => (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative z-10 animate-fade-in-up">
            <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse-slow"></div>
            <div className="relative mb-10 group">
                <div className="absolute inset-0 bg-yellow-500 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
                <Shield size={130} className="text-yellow-500 relative z-10 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-float" />
            </div>
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tight mb-6 leading-tight">
                {t.common.vulcan}
            </h1>
            <div className="h-2 w-32 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-8 shadow-lg shadow-orange-500/50"></div>
            <h2 className="text-lg md:text-3xl text-slate-300 font-light uppercase tracking-[0.4em] animate-slide-in-right">
                {t.proposal.digitalTrans}
            </h2>
            <div className="mt-12 flex items-center gap-4 px-8 py-3.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors shadow-2xl">
                <span className="text-sm md:text-base font-bold text-slate-300 uppercase tracking-widest">{t.proposal.aboutMe.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_10px_#eab308]"></span>
                <span className="text-sm md:text-base font-mono text-yellow-500 tracking-widest uppercase">Full Stack Data Scientist</span>
            </div>
        </div>
    );

    const AutoSchedulingSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-[1600px] mx-auto px-6 relative z-10 animate-fade-in-up py-12">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">{t.proposal.autoScheduling.title}</h2>
                <p className="text-xl text-indigo-400 font-bold mt-2 uppercase tracking-widest">{t.proposal.autoScheduling.subtitle}</p>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative">

                {/* TRIGGERS */}
                <div className="w-full lg:w-1/3 space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Radio className="text-indigo-500 animate-pulse" size={16} /> {t.proposal.autoScheduling.triggerTitle}</h4>
                    {[
                        { label: t.proposal.autoScheduling.triggers.new, icon: UserPlus, color: 'bg-blue-600' },
                        { label: t.proposal.autoScheduling.triggers.expired, icon: Clock, color: 'bg-amber-600' },
                        { label: t.proposal.autoScheduling.triggers.failed, icon: AlertTriangle, color: 'bg-red-600' },
                        { label: t.proposal.autoScheduling.triggers.absent, icon: UserX, color: 'bg-rose-600' }
                    ].map((trigger, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl group hover:border-indigo-500/50 transition-all">
                            <div className={`p-3 rounded-xl ${trigger.color} text-white shadow-lg`}><trigger.icon size={20} /></div>
                            <span className="font-bold text-slate-200">{trigger.label}</span>
                        </div>
                    ))}
                </div>

                {/* PROCESSOR (BRAIN) */}
                <div className="relative w-full lg:w-1/3 flex flex-col items-center">
                    <div className="absolute inset-0 bg-indigo-500 blur-[100px] opacity-10 animate-pulse"></div>
                    <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full bg-slate-900 border-4 border-indigo-500/50 flex flex-col items-center justify-center text-center shadow-[0_0_60px_rgba(99,102,241,0.2)] p-8">
                        <BrainCircuit size={80} className="text-indigo-400 mb-4 animate-float" />
                        <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tighter">{t.proposal.autoScheduling.brainTitle}</h3>
                    </div>
                    <div className="mt-8 text-center max-w-xs px-4">
                        <p className="text-xs text-slate-400 leading-relaxed italic">{t.proposal.autoScheduling.brainDesc}</p>
                    </div>
                </div>

                {/* OUTPUTS */}
                <div className="w-full lg:w-1/3 space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 text-right flex items-center justify-end gap-2">{t.proposal.autoScheduling.outputTitle} <Zap className="text-indigo-500" size={16} /></h4>
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[3rem] border border-indigo-500/30 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><RefreshCw size={100} /></div>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4">
                                <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                                <div>
                                    <h5 className="font-black text-white text-md">{t.proposal.autoScheduling.features.creation}</h5>
                                    <p className="text-xs text-slate-400">{t.proposal.autoScheduling.features.creationDesc}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                                <div>
                                    <h5 className="font-black text-white text-md">{t.proposal.autoScheduling.features.invites}</h5>
                                    <p className="text-xs text-slate-400">{t.proposal.autoScheduling.features.invitesDesc}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                                <div>
                                    <h5 className="font-black text-white text-md">{t.proposal.autoScheduling.features.resolution}</h5>
                                    <p className="text-xs text-slate-400">{t.proposal.autoScheduling.features.resolutionDesc}</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mt-16 flex justify-center">
                <div className="bg-indigo-500/10 px-8 py-3 rounded-full border border-indigo-500/30 text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                    <ShieldCheck size={16} /> {t.proposal.autoScheduling.outcomeNote}
                </div>
            </div>
        </div>
    );

    const AboutMeSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-[1500px] mx-auto px-6 relative z-10 animate-fade-in-up py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-5 space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-gradient-to-tr from-yellow-500/30 to-amber-500/30 rounded-3xl border border-yellow-500/40 text-yellow-400 shadow-xl shadow-yellow-500/10">
                            <User size={48} />
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{t.proposal.aboutMe.name}</h2>
                            <p className="text-xl text-yellow-500 font-serif italic">"{t.proposal.aboutMe.preferred}"</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/30 flex items-center gap-4 group hover:bg-blue-500/20 transition-all shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-5"><Shield size={40} /></div>
                            <Award className="text-blue-400 animate-pulse shrink-0" size={32} />
                            <span className="text-lg font-black text-blue-100 tracking-tight leading-tight">{t.proposal.aboutMe.cert}</span>
                        </div>
                        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700 flex items-center gap-4">
                            <Briefcase className="text-emerald-400 shrink-0" size={24} />
                            <span className="text-md text-slate-300 font-bold uppercase tracking-wide">{t.proposal.aboutMe.role}</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500 to-transparent opacity-50"></div>
                        <p className="text-lg text-slate-400 leading-relaxed font-light text-justify pl-6">{t.proposal.aboutMe.bio}</p>
                    </div>
                </div>
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Layers className="text-indigo-500" size={24} />
                        <h4 className="text-xl font-black text-white uppercase tracking-widest">{t.proposal.aboutMe.portfolioTitle}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { name: 'EduDesk', sub: t.proposal.aboutMe.portfolio.edudesk, icon: GraduationCap, color: 'indigo' },
                            { 
                                name: 'H365', 
                                sub: t.proposal.aboutMe.portfolio.h365, 
                                icon: Activity, 
                                color: 'rose', 
                                url: 'https://h365-new.vercel.app/',
                                subLinks: [
                                    { label: 'CHAEM Portal', url: 'https://chaem-app.vercel.app/' },
                                    { label: 'Patient Portal', url: 'https://h365-patient-portal-red.vercel.app/' }
                                ]
                            },
                            { 
                                name: 'SCOTMOZ Command Centre', 
                                sub: (t.proposal.aboutMe.portfolio as any).scotmoz || 'SCOTMOZ Command Centre App', 
                                icon: Monitor, 
                                color: 'blue', 
                                url: 'https://scot-moz-command-centre.vercel.app/' 
                            },
                            { name: 'SwiftPOS', sub: t.proposal.aboutMe.portfolio.swiftpos, icon: CreditCard, color: 'emerald' },
                            { name: 'MicroFin', sub: t.proposal.aboutMe.portfolio.microfin, icon: Wallet, color: 'amber' },
                            { name: 'Sentinel', sub: t.proposal.aboutMe.portfolio.sentinel, icon: Eye, color: 'blue' },
                        ].map((item, i) => (
                            <div key={i} className="group relative p-5 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-sm hover:border-indigo-500/50 transition-all hover:bg-slate-900/80 shadow-lg flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-400 mb-3 group-hover:scale-110 transition-transform shadow-inner`}>
                                            <item.icon size={24} />
                                        </div>
                                        {item.url && !item.subLinks && (
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-all" title="Visit App">
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="font-black text-white text-lg tracking-tight">
                                        {item.url && !item.subLinks ? (
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5">
                                                {item.name}
                                                <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ) : (
                                            item.name
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1 group-hover:text-slate-300 transition-colors">{item.sub}</div>
                                </div>
                                
                                {item.subLinks && (
                                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 items-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-1">App Links:</span>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white px-3 py-1 rounded-xl transition-all inline-flex items-center gap-1">
                                            H365 Gateway <ArrowUpRight size={10} />
                                        </a>
                                        {item.subLinks.map((sub, sIdx) => (
                                            <a key={sIdx} href={sub.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-3 py-1 rounded-xl transition-all inline-flex items-center gap-1">
                                                {sub.label} <ArrowUpRight size={10} />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const ObjectivesSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-6xl mx-auto px-4 relative z-10 animate-fade-in-up">
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

    const WorkflowSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-[1600px] mx-auto px-6 relative z-10 animate-fade-in-up py-6">
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">{t.proposal.workflow.title}</h2>
                <p className="text-slate-400 mt-2 font-medium">{t.proposal.workflow.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-16 gap-x-8 relative">
                {[
                    { id: 1, title: t.proposal.workflow.step1, sub: t.proposal.workflow.step1sub, icon: FileSpreadsheet, color: 'bg-blue-600', actor: t.proposal.workflow.step1actor, text: t.proposal.workflow.step1desc },
                    { id: 2, title: t.proposal.workflow.step2, sub: t.proposal.workflow.step2sub, icon: CalendarClock, color: 'bg-indigo-600', actor: t.proposal.workflow.step2actor, text: t.proposal.workflow.step2desc },
                    { id: 3, title: t.proposal.workflow.step3, sub: t.proposal.workflow.step3sub, icon: GraduationCap, color: 'bg-purple-600', actor: t.proposal.workflow.step3actor, text: t.proposal.workflow.step3desc },
                    { id: 4, title: t.proposal.workflow.step4, sub: t.proposal.workflow.step4sub, icon: BrainCircuit, color: 'bg-amber-600', actor: t.proposal.workflow.step4actor, text: t.proposal.workflow.step4desc },
                    { id: 5, title: t.proposal.workflow.step5, sub: t.proposal.workflow.step5sub, icon: CreditCard, color: 'bg-emerald-600', actor: t.proposal.workflow.step5actor, text: t.proposal.workflow.step5desc },
                    { id: 6, title: t.proposal.workflow.step6, sub: t.proposal.workflow.step6sub, icon: QrCode, color: 'bg-cyan-600', actor: t.proposal.workflow.step6actor, text: t.proposal.workflow.step6desc },
                ].map((step, idx) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center group">
                        <div className={`w-24 h-24 rounded-[2rem] ${step.color} text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500 group-hover:rotate-6 ring-4 ring-white/5`}>
                            <step.icon size={40} />
                        </div>

                        <div className="mt-6 text-center max-w-[280px]">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Phase 0{step.id}</div>
                            <h4 className="text-xl font-black text-white mb-1">{step.title}</h4>
                            <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3 bg-white/5 px-2 py-0.5 rounded inline-block">{step.actor}</div>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">{step.text}</p>
                        </div>

                        {/* Mobile Arrow */}
                        <div className="md:hidden mt-4">
                            <ArrowDown className="text-slate-700 animate-bounce" size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 py-4 bg-white/5 border border-white/10 rounded-full text-center max-w-2xl mx-auto px-8 backdrop-blur-sm">
                <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                    <ShieldCheck size={16} /> 100% Data Traceability • Unified Compliance Lifecycle
                </p>
            </div>
        </div>
    );

    const ScenarioSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-[1400px] mx-auto px-12 relative z-10 animate-fade-in-up py-12">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center tracking-tight">{t.proposal.scenario.title}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
                <div className="group relative bg-slate-950 border border-red-500/20 p-10 rounded-[3rem] shadow-2xl flex flex-col">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-red-500"><History size={120} /></div>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t.proposal.scenario.challenge}</h3>
                            <span className="text-xs font-black text-red-500 uppercase tracking-widest">{t.proposal.scenario.challengeSub}</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-6">
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                            <p className="text-lg text-slate-400 italic leading-relaxed">"{t.proposal.scenario.challengeText.replace('{days}', '3')}"</p>
                        </div>
                    </div>
                </div>
                <div className="group relative bg-indigo-950/20 border border-emerald-500/30 p-10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                    <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 opacity-50 blur-3xl"></div>
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-500"><Zap size={120} /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <Sparkles size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t.proposal.scenario.automation}</h3>
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{t.proposal.scenario.automationSub}</span>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex gap-4 items-start bg-emerald-900/20 p-5 rounded-2xl border border-emerald-500/20">
                                <div className="mt-1 p-1 bg-emerald-500 rounded text-black"><Search size={14} /></div>
                                <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                                    <strong>Predictive Sync:</strong> {t.proposal.scenario.automationText1.replace('{days}', '14')}
                                </p>
                            </div>
                            <div className="flex gap-4 items-start bg-indigo-900/20 p-5 rounded-2xl border border-indigo-500/20 translate-x-4">
                                <div className="mt-1 p-1 bg-indigo-500 rounded text-white"><CalendarClock size={14} /></div>
                                <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                                    <strong>Automated Mitigation:</strong> {t.proposal.scenario.automationText2}
                                </p>
                            </div>
                            <div className="flex gap-4 items-start bg-blue-900/20 p-5 rounded-2xl border border-blue-500/20 translate-x-8">
                                <div className="mt-1 p-1 bg-blue-500 rounded text-white"><ArrowRight size={14} /></div>
                                <p className="text-sm md:text-base text-slate-200 leading-relaxed font-bold">{t.proposal.scenario.automationOutcome}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const SummarySlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-5xl mx-auto text-center px-4 relative z-10 animate-fade-in-up py-12">
            <div className="mb-10">
                <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 to-yellow-600 mb-6 tracking-tight">{t.proposal.execSummary.title}</h2>
                <div className="w-20 h-1.5 bg-yellow-500 mx-auto rounded-full shadow-[0_0_15px_#eab308]"></div>
            </div>
            <div className="bg-slate-900/40 p-10 md:p-14 rounded-[3.5rem] border border-white/10 backdrop-blur-2xl shadow-2xl relative group hover:bg-slate-900/60 transition-colors">
                <div className="absolute -top-6 -left-6 text-7xl text-yellow-500/20 font-serif group-hover:text-yellow-500/40 transition-colors">"</div>
                <div className="text-lg md:text-3xl text-slate-200 leading-relaxed font-light">{t.proposal.execSummary.text}</div>
                <div className="absolute -bottom-6 -right-6 text-7xl text-yellow-500/20 font-serif rotate-180 group-hover:text-yellow-500/40 transition-colors">"</div>
            </div>
            <div className="mt-10 text-slate-400 italic text-xl animate-pulse">{t.proposal.execSummary.quote}</div>
        </div>
    );

    const IntegrationSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-7xl mx-auto px-6 relative z-10 animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center tracking-tight">Unified Data Architecture</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="space-y-6">
                    <div className="bg-slate-900/80 p-6 rounded-2xl border border-blue-500/30 flex items-center gap-4">
                        <div className="p-3 bg-blue-900/50 rounded-xl"><Users size={24} className="text-blue-400" /></div>
                        <div>
                            <h4 className="font-bold text-white text-lg">HR Database</h4>
                            <p className="text-slate-400 text-sm">Permanent Staff (SuccessFactors)</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/80 p-6 rounded-2xl border border-orange-500/30 flex items-center gap-4">
                        <div className="p-3 bg-orange-900/50 rounded-xl"><HardHat size={24} className="text-orange-400" /></div>
                        <div>
                            <h4 className="font-bold text-white text-lg">Célula de Contracto</h4>
                            <p className="text-slate-400 text-sm">Contractor Management DB</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="h-10 w-0.5 bg-gradient-to-b from-transparent via-slate-500 to-slate-500 lg:hidden"></div>
                    <div className="hidden lg:flex items-center gap-2 mb-4 animate-pulse"><span className="h-0.5 w-16 bg-slate-500"></span><ChevronRight size={24} className="text-slate-500" /></div>
                    <div className="bg-slate-800 p-8 rounded-full border-4 border-slate-700 shadow-[0_0_50px_rgba(99,102,241,0.3)] relative z-10"><GitMerge size={64} className="text-indigo-400" /></div>
                    <div className="mt-6 text-center">
                        <h3 className="text-2xl font-black text-indigo-300">CARS Middleware</h3>
                        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Nightly synchronization engine utilizing Read-Only APIs to merge & normalize datasets.</p>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 mt-4 animate-pulse"><ChevronRight size={24} className="text-slate-500" /><span className="h-0.5 w-16 bg-slate-500"></span></div>
                </div>
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] border border-indigo-500/50 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Database size={100} /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg"><Shield size={32} /></div>
                            <h3 className="text-3xl font-black text-white">CARS Manager</h3>
                        </div>
                        <p className="text-lg text-slate-300 leading-relaxed mb-6">A single, unified "Source of Truth" for site safety.</p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-green-400" /><span>Auto-Updates (No manual entry)</span></li>
                            <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-green-400" /><span>Conflict Resolution (VUL vs CON)</span></li>
                            <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-green-400" /><span>Live Status Calculation</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );

    const WaitlistSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-7xl mx-auto px-6 relative z-10 animate-fade-in-up py-12">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">{t.proposal.waitlist.title}</h2>
                <p className="text-xl text-amber-500 font-bold mt-2">{t.proposal.waitlist.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-slate-900/60 p-8 rounded-[3rem] border border-amber-500/30 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/60 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><ListFilter size={120} /></div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-500"><Timer size={32} /></div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t.proposal.waitlist.capacityTitle}</h3>
                    </div>
                    <p className="text-lg text-slate-300 leading-relaxed font-light">{t.proposal.waitlist.capacityDesc}</p>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-[3rem] border border-blue-500/30 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/60 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Bell size={120} /></div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-500"><Zap size={32} /></div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t.proposal.waitlist.demandTitle}</h3>
                    </div>
                    <p className="text-lg text-slate-300 leading-relaxed font-light">{t.proposal.waitlist.demandDesc}</p>
                </div>
            </div>
        </div>
    );

    const FinancialsSlide = () => {
        const models = (t.proposal.financials as any).models || {
            title: 'Strategic Delivery Models',
            buyout: {
                title: '1. Corporate Buyout',
                cost: '$33,000.00 One-time',
                desc: 'On-premises installation with complete ownership. Covers software, user, and IT team training.',
                badge: 'CapEx Buyout',
                features: [
                    'Full Source Code & Database Ownership',
                    'Corporate Server Deployment',
                    'IT & End-User Training Included'
                ]
            },
            managed: {
                title: '2a. Managed On-Premises',
                cost: '$6,000.00 / Month',
                desc: 'Runs on corporate servers for absolute data residency. DigiSols manages updates & support.',
                badge: 'Recommended Model',
                setup: '$27,000 Setup',
                features: [
                    'Absolute Health Data Residency',
                    'DigiSols Handles Maintenance & Updates',
                    'User Support & Continuous Training'
                ]
            },
            saas: {
                title: '2b. Hosted Cloud SaaS',
                cost: '$7,500.00 / Month',
                desc: 'Turnkey hosted solution. DigiSols manages infrastructure, domain, and data security.',
                badge: 'Zero IT Strain',
                setup: '$27,000 Setup',
                features: [
                    'Zero Infrastructure / IT Overhead',
                    'Managed Security, Domain & Backups',
                    'Continuous Software Deployment'
                ]
            }
        };

        return (
            <div className="flex flex-col justify-center min-h-[75vh] max-w-[1600px] mx-auto px-6 relative z-10 animate-fade-in-up py-8">
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{t.proposal.financials.title}</h2>
                    <p className="text-indigo-400 font-bold mt-2 uppercase tracking-widest text-sm">{models.title}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

                    {/* Option 1: Corporate Buyout */}
                    <div className="bg-slate-900/60 rounded-[2.5rem] border border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700 transition-all hover:bg-slate-900/80 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><ServerIcon size={120} /></div>
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 bg-slate-800 text-slate-400 rounded-full border border-slate-700/50">{models.buyout.badge}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">{models.buyout.title}</h3>
                            <div className="text-3xl font-black font-mono text-yellow-500 mb-4">{models.buyout.cost}</div>
                            <p className="text-sm text-slate-400 leading-relaxed font-light mb-6">{models.buyout.desc}</p>
                        </div>
                        <div className="pt-6 border-t border-slate-800/80">
                            <ul className="text-xs text-slate-400 space-y-2.5">
                                {(models.buyout.features || [
                                    'Full Source Code & Database Ownership',
                                    'Corporate Server Deployment',
                                    'IT & End-User Training Included'
                                ]).map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <CheckCircle size={14} className="text-slate-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Option 2a: Managed On-Premises (Recommended) */}
                    <div className="bg-indigo-950/20 rounded-[2.5rem] border-2 border-indigo-500/80 p-8 flex flex-col justify-between hover:border-indigo-400 transition-all hover:bg-indigo-950/30 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-30 blur-2xl"></div>
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform text-indigo-400"><ShieldCheck size={120} /></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 animate-pulse">{models.managed.badge}</span>
                                <span className="text-[10px] font-black font-mono text-slate-200 tracking-wider uppercase px-2 py-0.5 bg-slate-800 border border-slate-700 rounded">{models.managed.setup}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">{models.managed.title}</h3>
                            <div className="text-4xl font-black font-mono text-emerald-400 mb-1">{models.managed.cost}</div>
                            <div className="text-sm font-bold font-mono text-slate-400 mb-4 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {models.managed.setup}
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">{models.managed.desc}</p>
                        </div>
                        <div className="pt-6 border-t border-indigo-500/30 relative z-10">
                            <ul className="text-xs text-slate-300 space-y-2.5">
                                {(models.managed.features || [
                                    'Absolute Health Data Residency',
                                    'DigiSols Handles Maintenance & Updates',
                                    'User Support & Continuous Training'
                                ]).map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <CheckCircle size={14} className="text-emerald-400" />
                                        <span className={idx === 0 ? "font-bold" : ""}>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Option 2b: Hosted Cloud SaaS */}
                    <div className="bg-slate-900/60 rounded-[2.5rem] border border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700 transition-all hover:bg-slate-900/80 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Cloud size={120} /></div>
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 bg-slate-800 text-slate-400 rounded-full border border-slate-700/50">{models.saas.badge}</span>
                                <span className="text-[10px] font-black font-mono text-slate-200 tracking-wider uppercase px-2 py-0.5 bg-slate-800 border border-slate-700 rounded">{models.saas.setup}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">{models.saas.title}</h3>
                            <div className="text-3xl font-black font-mono text-blue-400 mb-1">{models.saas.cost}</div>
                            <div className="text-sm font-bold font-mono text-slate-400 mb-4 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {models.saas.setup}
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed font-light mb-6">{models.saas.desc}</p>
                        </div>
                        <div className="pt-6 border-t border-slate-800/80">
                            <ul className="text-xs text-slate-400 space-y-2.5">
                                {(models.saas.features || [
                                    'Zero Infrastructure / IT Overhead',
                                    'Managed Security, Domain & Backups',
                                    'Continuous Software Deployment'
                                ]).map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <CheckCircle size={14} className="text-blue-400" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    const ConclusionSlide = () => (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative z-10 animate-fade-in-up">
            <Shield size={120} className="text-emerald-500 mb-12 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse" />
            <h2 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter">{t.proposal.conclusion.title}</h2>
            <div className="w-48 h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-200 rounded-full mb-10 mx-auto"></div>
            <p className="text-2xl md:text-4xl text-slate-300 font-light max-w-5xl leading-relaxed mx-auto">"{t.proposal.conclusion.text}"</p>
        </div>
    );

    const renderSlide = () => {
        switch (slides[currentSlide].id) {
            case 'title': return <TitleSlide />;
            case 'aboutMe': return <AboutMeSlide />;
            case 'scenario': return <ScenarioSlide />;
            case 'summary': return <SummarySlide />;
            case 'objectives': return <ObjectivesSlide />;
            case 'workflow': return <WorkflowSlide />;
            case 'integration': return <IntegrationSlide />;
            case 'waitlist': return <WaitlistSlide />;
            case 'autoScheduling': return <AutoSchedulingSlide />;
            case 'mobilePortal': return <MobilePortalSlide />;
            case 'mobilizationDemo': return <MobilizationDemoSlide />;
            case 'simDatabase': return <SimDatabaseSlide />;
            case 'simBooking': return <SimBookingSlide />;
            case 'simResults': return <SimResultsSlide />;
            case 'simCards': return <SimCardsSlide />;
            case 'simTrainer': return <SimTrainerSlide />;
            case 'simSettings': return <SimSettingsSlide />;
            case 'simSafeSite': return <SimSafeSiteSlide />;
            case 'simExecutive': return <SimExecutiveSlide />;
            case 'organogram': return <OrganogramSlide />;
            case 'timeline': return <TimelineSlide />;
            case 'tech': return <TechSlide />;
            case 'financials': return <FinancialsSlide />;
            case 'roadmap': return <RoadmapSlide />;
            case 'alcohol': return <AlcoholSlide />;
            case 'enhanced': return <EnhancedSlide />;
            case 'conclusion': return <ConclusionSlide />;
            case 'thankYou': return <ThankYouSlide />;
            default: return <div className="flex items-center justify-center min-h-[70vh] text-slate-500 italic">Documentation Slide {currentSlide + 1} Content alignment check...</div>;
        }
    };

    const SimSafeSiteSlide = () => (
        <div className="flex flex-col justify-center min-h-[75vh] w-full max-w-[1800px] mx-auto px-4 relative z-10 animate-fade-in-up mt-8">
            <div className="w-full h-[80vh] overflow-y-auto bg-slate-100 dark:bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="sticky top-0 z-50 bg-slate-900 text-white p-3 flex justify-between items-center border-b border-slate-700 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                        <span className="text-xs font-mono opacity-50 tracking-widest uppercase">SafeSite Module Live Preview</span>
                    </div>
                </div>
                <div className="p-8">
                    <AnalyticsDashboard conditions={unsafeConditions} companies={companies} />
                </div>
            </div>
        </div>
    );

    const SimExecutiveSlide = () => (
        <div className="flex flex-col justify-center min-h-[75vh] w-full max-w-[1800px] mx-auto px-4 relative z-10 animate-fade-in-up mt-8">
            <div className="w-full h-[80vh] overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                <div className="sticky top-0 z-50 bg-slate-900 text-white p-3 flex justify-between items-center border-b border-slate-700 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                        <span className="text-xs font-mono opacity-50 tracking-widest uppercase">Executive Dashboard Live Preview</span>
                    </div>
                </div>
                <div className="p-8">
                    <ExecutiveDashboard 
                        bookings={bookings}
                        requirements={requirements}
                        companies={companies}
                        unsafeConditions={unsafeConditions}
                        sites={sites}
                        userRole={user?.role}
                    />
                </div>
            </div>
        </div>
    );

    const MobilizationDemoSlide = () => (
        <div className="flex flex-col min-h-[75vh] w-full max-w-[1600px] mx-auto px-6 relative z-10 animate-fade-in-up py-4 select-text">
            <div className="bg-slate-900/60 rounded-[2.5rem] border border-slate-800 p-6 shadow-2xl backdrop-blur-md overflow-hidden flex-1 flex flex-col">
                <MobilizationDashboard />
            </div>
        </div>
    );

    const SimulationFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div className="flex flex-col min-h-[75vh] w-full max-w-[1600px] mx-auto px-6 relative z-10 animate-fade-in-up py-4 select-text h-[75vh]">
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex-1 flex flex-col h-full">
                {/* Browser window header */}
                <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                        <div className="ml-4 bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-mono text-slate-400 select-all min-w-[280px]">
                            cars-gateway.vulcan.mz/{title.toLowerCase().replace(/\s+/g, '-')}
                        </div>
                    </div>
                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Live Simulation Portal
                    </div>
                </div>
                {/* Interactive page body */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-200">
                    {children}
                </div>
            </div>
        </div>
    );

    const SimDatabaseSlide = () => (
        <SimulationFrame title="Training Database">
            <DatabasePage
                employees={employees}
                bookings={bookings}
                requirements={requirements}
                updateRequirements={async (req) => {
                    await db.updateRequirement(req);
                    await refreshTrainingData();
                }}
                sessions={sessions}
                onUpdateEmployee={async (emp) => {
                    await db.upsertEmployee(emp);
                    await refreshTrainingData();
                }}
                onDeleteEmployee={async (id) => {
                    await db.deleteEmployee(id);
                    await refreshTrainingData();
                }}
                racDefinitions={racDefinitions}
                addNotification={() => {}}
                currentSiteId={currentSiteId}
                companies={companies}
            />
        </SimulationFrame>
    );

    const SimBookingSlide = () => (
        <SimulationFrame title="Training Requests">
            <BookingForm
                addBookings={async (newBookings) => {
                    await Promise.all(newBookings.map(b => db.saveBooking(b)));
                    await refreshTrainingData();
                }}
                sessions={sessions}
                userRole={UserRole.SYSTEM_ADMIN}
                existingBookings={bookings}
                addNotification={() => {}}
                racDefinitions={racDefinitions}
                companies={companies}
            />
        </SimulationFrame>
    );

    const SimResultsSlide = () => (
        <SimulationFrame title="Training Records">
            <ResultsPage
                bookings={bookings}
                updateBookingStatus={async (bookingId, status, score, comments) => {
                    const booking = bookings.find(b => b.id === bookingId);
                    if (booking) {
                        await db.saveBooking({
                            ...booking,
                            status: status as BookingStatus,
                            testScore: score,
                            trainerComments: comments
                        });
                        await refreshTrainingData();
                    }
                }}
                importBookings={async (imported) => {
                    await Promise.all(imported.map(b => db.saveBooking(b)));
                    await refreshTrainingData();
                }}
                userRole={UserRole.SYSTEM_ADMIN}
                sessions={sessions}
                requirements={requirements}
                sites={sites}
                racDefinitions={racDefinitions}
                addNotification={() => {}}
                currentSiteId={currentSiteId}
                onRefresh={refreshTrainingData}
            />
        </SimulationFrame>
    );

    const SimCardsSlide = () => (
        <SimulationFrame title="Card Requests">
            <RequestCardsPage
                bookings={bookings}
                requirements={requirements}
                racDefinitions={racDefinitions}
                sessions={sessions}
                userRole={UserRole.SYSTEM_ADMIN}
                currentSiteId={currentSiteId}
                companies={companies}
            />
        </SimulationFrame>
    );

    const SimTrainerSlide = () => (
        <SimulationFrame title="Trainer Input Portal">
            <TrainerInputPage
                bookings={bookings}
                updateBookings={async (updatedBookings) => {
                    await Promise.all(updatedBookings.map(b => db.saveBooking(b)));
                    await refreshTrainingData();
                }}
                sessions={sessions}
                userRole={UserRole.SYSTEM_ADMIN}
                currentUserName={user?.name}
                racDefinitions={racDefinitions}
            />
        </SimulationFrame>
    );

    const SimSettingsSlide = () => (
        <SimulationFrame title="Training Settings">
            <SettingsPage
                racDefinitions={racDefinitions}
                onUpdateRacs={async (updated) => {
                    await Promise.all(updated.map(r => db.saveRacDefinition(r)));
                    await refreshTrainingData();
                }}
                rooms={rooms}
                onUpdateRooms={async (updated) => {
                    await Promise.all(updated.map(r => db.saveRoom(r)));
                    await refreshTrainingData();
                }}
                trainers={trainers}
                onUpdateTrainers={async (updated) => {
                    await Promise.all(updated.map(t => db.saveTrainer(t)));
                    await refreshTrainingData();
                }}
                sites={sites}
                onUpdateSites={async (updated) => {
                    await Promise.all(updated.map(s => db.saveSite(s)));
                    await refreshTrainingData();
                }}
                companies={companies}
                onUpdateCompanies={async (updated) => {
                    await Promise.all(updated.map(c => db.saveCompany(c)));
                    await refreshTrainingData();
                }}
                userRole={UserRole.SYSTEM_ADMIN}
                addNotification={() => {}}
                currentSiteId={currentSiteId}
            />
        </SimulationFrame>
    );

    const TechCard = ({ icon: Icon, title, desc, color }: any) => (
        <div className="flex items-center gap-6 p-8 bg-slate-900/60 rounded-3xl border border-slate-800 backdrop-blur-sm hover:border-slate-600 transition-all group">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform ${color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                    color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                        color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-rose-500/10 text-rose-500'
                }`}>
                <Icon size={40} />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{title}</h3>
                <p className="text-slate-400 font-mono text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    );

    const MobilePortalSlide = () => {
        const portal = (t.proposal as any).mobilePortal || {
            title: 'Employee Mobile Safety Portal',
            subtitle: 'Personal Safety Compliance & Gate Integration',
            features: {
                passport: 'Safety Access Passport',
                passportDesc: 'Live digital credential card with secure QR code. Displays real-time status of ASO medical exam and RAC proficiencies.',
                booking: 'Self-Service Enrollment',
                bookingDesc: 'Trainees can view upcoming RAC sessions and request enrollment, immediately sync\'ing with core queue intelligence.',
                gate: 'Physical Gate Verification',
                gateDesc: 'Integrates with site turnstiles and IoT breathalyzers for real-time compliance validation and blood-alcohol testing.',
                sync: 'Offline & Live Synchronization',
                syncDesc: 'Communicates with the CARS core via synchronized APIs, supporting localized site operations and real-time HSE telemetry.'
            },
            operNote: 'Operational Ready: Built with React, TypeScript, and Tailwind CSS'
        };

        return (
            <div className="flex flex-col justify-center min-h-[70vh] max-w-[1600px] mx-auto px-6 relative z-10 animate-fade-in-up py-8">
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">{portal.title}</h2>
                    <p className="text-indigo-400 font-bold mt-2 uppercase tracking-widest text-sm">{portal.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* Feature Columns */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Feature 1: Safety Access Passport */}
                            <div className="group relative p-6 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm hover:border-blue-500/50 transition-all hover:bg-slate-900/80 shadow-lg">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                                    <QrCode size={24} />
                                </div>
                                <h3 className="font-black text-white text-lg tracking-tight mb-2">{portal.features.passport}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed font-light">{portal.features.passportDesc}</p>
                            </div>

                            {/* Feature 2: Self-Service Enrollment */}
                            <div className="group relative p-6 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm hover:border-indigo-500/50 transition-all hover:bg-slate-900/80 shadow-lg">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="font-black text-white text-lg tracking-tight mb-2">{portal.features.booking}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed font-light">{portal.features.bookingDesc}</p>
                            </div>

                            {/* Feature 3: Physical Gate Verification */}
                            <div className="group relative p-6 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm hover:border-emerald-500/50 transition-all hover:bg-slate-900/80 shadow-lg">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="font-black text-white text-lg tracking-tight mb-2">{portal.features.gate}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed font-light">{portal.features.gateDesc}</p>
                            </div>

                            {/* Feature 4: Offline & Live Synchronization */}
                            <div className="group relative p-6 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm hover:border-amber-500/50 transition-all hover:bg-slate-900/80 shadow-lg">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                                    <RefreshCw size={24} className="animate-spin-slow" />
                                </div>
                                <h3 className="font-black text-white text-lg tracking-tight mb-2">{portal.features.sync}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed font-light">{portal.features.syncDesc}</p>
                            </div>

                        </div>
                    </div>

                    {/* Smartphone Mockup */}
                    <div className="lg:col-span-5 flex justify-center">
                        <div className="relative w-[280px] h-[520px] bg-slate-950 border-[8px] border-slate-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 select-none scale-95 md:scale-100 transition-transform">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[18px] bg-slate-900 rounded-b-xl z-50"></div>

                            {/* Status Bar */}
                            <div className="h-8 bg-slate-900/80 px-4 flex justify-between items-center text-[9px] font-semibold text-slate-400 select-none z-40 relative">
                                <span>15:45</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-1.5 border border-slate-400 rounded-xs p-px flex items-center"><span className="h-full w-1.5 bg-emerald-500 rounded-2xs"></span></span>
                                </div>
                            </div>

                            {/* Screen Content */}
                            <div className="flex-1 bg-slate-950 p-3.5 flex flex-col justify-between overflow-y-auto scrollbar-hide text-left">

                                {/* App Header */}
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider">CARS Mobile</span>
                                        <h4 className="text-xs font-black text-white leading-tight">Safety Passport</h4>
                                    </div>
                                    <div className="p-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-lg"><Shield size={12} /></div>
                                </div>

                                {/* Passport Card */}
                                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-emerald-400 mb-3 relative overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[6px] font-black uppercase tracking-widest text-slate-400">PASSPORT STATUS</span>
                                            <h2 className="text-sm font-black text-white mt-0.5">AUTHORIZED</h2>
                                        </div>
                                        <div className="p-1 bg-emerald-500/20 rounded-md text-emerald-400"><ShieldCheck size={12} /></div>
                                    </div>
                                    <p className="text-[8px] text-slate-300 font-medium mt-2 flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                        All Credentials Valid
                                    </p>
                                </div>

                                {/* QR Code Container */}
                                <div className="bg-slate-900/80 border border-white/5 p-4 rounded-2xl text-center flex-1 flex flex-col items-center justify-center mb-3">
                                    <div className="bg-white p-2 rounded-xl inline-block mb-2 shadow-inner">
                                        <QrCode size={70} className="text-slate-950" />
                                    </div>
                                    <h5 className="font-bold text-white text-[10px] tracking-tight">Paulo Manjate</h5>
                                    <p className="text-[7px] text-slate-400 font-mono mt-0.5">ID: VUL-00271 • Vulcan</p>
                                </div>

                                {/* Gate Simulator Access Alert */}
                                <div className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-2 rounded-xl text-center">
                                    <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Gate Access</span>
                                    <div className="text-[8px] font-black text-white flex items-center justify-center gap-1 leading-none">
                                        <RefreshCw size={8} className="animate-spin" />
                                        Ready to scan at turnstile
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-10 flex justify-center">
                    <div className="bg-indigo-500/10 px-8 py-3 rounded-full border border-indigo-500/30 text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                        <ShieldCheck size={16} /> {portal.operNote}
                    </div>
                </div>
            </div>
        );
    };

    const OrganogramSlide = () => (
        <div className="flex flex-col justify-center min-h-[75vh] max-w-6xl mx-auto px-4 relative z-10 animate-fade-in-up pt-4 pb-28">
            <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{t.proposal.organogram.title}</h2>
                <div className="mt-4 max-w-3xl mx-auto px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs md:text-sm text-amber-300 font-medium tracking-wide flex items-center justify-center gap-2.5 shadow-lg shadow-amber-950/20">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black font-mono">!</span>
                    <span>{t.proposal.organogram.applicabilityNote}</span>
                </div>
            </div>

            <div className="flex flex-col items-center">
                {/* Lead Architect Card */}
                <div className="relative p-6 bg-slate-900/85 border-2 border-blue-500/50 rounded-3xl w-full max-w-md text-center shadow-[0_0_30px_rgba(59,130,246,0.15)] backdrop-blur-md hover:border-blue-400 transition-all hover:scale-[1.02] duration-300 group z-10">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><User size={64} className="text-blue-500" /></div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-3">
                        <User size={24} />
                    </div>
                    <div className="font-black text-white text-xl tracking-tight">Pita Domingos</div>
                    <div className="text-blue-400 text-xs font-black uppercase tracking-wider mt-1">{(t.proposal.organogram as any).leadRole || 'Lead Architect'}</div>
                    <p className="text-slate-300 text-xs mt-3 leading-relaxed font-light">{(t.proposal.organogram as any).leadDesc}</p>
                </div>

                {/* Connector Tree */}
                <div className="w-full max-w-2xl h-12 relative flex justify-center -mt-px -mb-px">
                    <svg className="w-full h-full text-indigo-500/40" viewBox="0 0 200 40" fill="none" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="treeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                            </linearGradient>
                        </defs>
                        <path d="M100 0 V20 H50 V40 M100 20 H150 V40" stroke="url(#treeGrad)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>

                {/* Sub-roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                    {/* DevOps Card */}
                    <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-3xl text-left hover:border-purple-500/50 hover:bg-slate-900/80 transition-all duration-300 group flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-white text-md tracking-tight">{t.proposal.organogram.tech1}</h4>
                            <p className="text-slate-400 text-xs mt-2 leading-relaxed font-light">{(t.proposal.organogram as any).tech1Desc}</p>
                        </div>
                    </div>

                    {/* Cloud Data Engineer Card */}
                    <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-3xl text-left hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all duration-300 group flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                            <Database size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-white text-md tracking-tight">{t.proposal.organogram.tech2}</h4>
                            <p className="text-slate-400 text-xs mt-2 leading-relaxed font-light">{(t.proposal.organogram as any).tech2Desc}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const TimelineSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-5xl mx-auto px-4 relative z-10 animate-fade-in-up">
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

    const TechSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-7xl mx-auto px-4 relative z-10 animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-16">{t.proposal.techStack.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TechCard icon={Monitor} title={t.proposal.techStack.frontendTitle} desc={t.proposal.techStack.frontend} color="blue" />
                <TechCard icon={ServerIcon} title={t.proposal.techStack.backendTitle} desc={t.proposal.techStack.backend} color="emerald" />
                <TechCard icon={Database} title={t.proposal.techStack.databaseTitle} desc={t.proposal.techStack.database} color="amber" />
                <TechCard icon={Lock} title={t.proposal.techStack.securityTitle} desc={t.proposal.techStack.security} color="rose" />
            </div>
        </div>
    );

    const RoadmapSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-7xl mx-auto px-4 relative z-10 animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-12 text-center">{t.proposal.roadmap.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all">
                    <Key size={32} className="text-blue-400 mb-4" />
                    <h4 className="text-xl font-bold text-white mb-2">{t.proposal.roadmap.auth}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{t.proposal.roadmap.authDesc}</p>
                </div>
                <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all">
                    <Rocket size={32} className="text-cyan-400 mb-4" />
                    <h4 className="text-xl font-bold text-white mb-2">{t.proposal.roadmap.db}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{t.proposal.roadmap.dbDesc}</p>
                </div>
                <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 hover:border-pink-500/50 transition-all">
                    <Mail size={32} className="text-pink-400 mb-4" />
                    <h4 className="text-xl font-bold text-white mb-2">{t.proposal.roadmap.email}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{t.proposal.roadmap.emailDesc}</p>
                </div>
                <div className="bg-slate-800/60 p-6 rounded-2xl border border-emerald-500/50 relative overflow-hidden transition-all group hover:bg-slate-800/90 shadow-lg">
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        DELIVERED
                    </div>
                    <Smartphone size={32} className="text-emerald-400 mb-4" />
                    <h4 className="text-xl font-bold text-white mb-2">{t.proposal.roadmap.hosting}</h4>
                    <p className="text-slate-300 text-sm leading-relaxed font-light">{t.proposal.roadmap.hostingDesc}</p>
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
        <div className="flex flex-col justify-center min-h-[70vh] max-w-6xl mx-auto px-4 relative z-10 animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center">{t.proposal.futureUpdates.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-amber-500/10 border border-amber-500/30 p-10 rounded-[3rem] backdrop-blur-sm group hover:bg-amber-500/20 transition-all">
                    <div className="flex items-center gap-4 mb-6">
                        <Code size={40} className="text-amber-500" />
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Module A</h3>
                    </div>
                    <h4 className="text-xl text-amber-200 mb-4 font-bold">Software Integration</h4>
                    <p className="text-lg text-slate-300 leading-relaxed font-light">{t.proposal.futureUpdates.moduleADesc}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-600 p-10 rounded-[3rem] backdrop-blur-sm group hover:bg-slate-800/80 transition-all">
                    <div className="flex items-center gap-4 mb-6">
                        <HardHat size={40} className="text-slate-400" />
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Module B</h3>
                    </div>
                    <h4 className="text-xl text-slate-300 mb-4 font-bold">Physical Infrastructure</h4>
                    <p className="text-lg text-slate-300 leading-relaxed font-light">{t.proposal.futureUpdates.moduleBDesc}</p>
                </div>
            </div>
            <div className="mt-12 max-w-4xl mx-auto px-6 py-4 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] text-sm md:text-base text-amber-300 font-medium tracking-wide flex items-center justify-center gap-3.5 shadow-lg shadow-amber-950/20">
                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 font-mono text-sm">!</span>
                <span>{(t.proposal.futureUpdates as any).optionalNotice}</span>
            </div>
        </div>
    );

    const EnhancedSlide = () => (
        <div className="flex flex-col justify-center min-h-[70vh] max-w-7xl mx-auto px-4 relative z-10 animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center">{t.proposal.enhancedCaps.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-700 hover:border-blue-500 transition-colors">
                    <ScanFace size={48} className="text-blue-500 mb-6" />
                    <h4 className="text-xl font-bold text-white mb-3">{t.proposal.enhancedCaps.mobileVerify.title}</h4>
                    <p className="text-slate-400 leading-relaxed">{t.proposal.enhancedCaps.mobileVerify.desc}</p>
                </div>
                <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-700 hover:border-green-500 transition-colors">
                    <CalendarClock size={48} className="text-green-500 mb-6" />
                    <h4 className="text-xl font-bold text-white mb-3">{t.proposal.enhancedCaps.autoBooking.title}</h4>
                    <p className="text-slate-400 leading-relaxed">{t.proposal.enhancedCaps.autoBooking.desc}</p>
                </div>
                <div className="bg-slate-900/80 p-8 rounded-3xl border border-purple-500/50 transition-colors">
                    <Database size={48} className="text-purple-500 mb-6" />
                    <h4 className="text-xl font-bold text-white mb-3">{t.proposal.enhancedCaps.massData.title}</h4>
                    <p className="text-slate-400 leading-relaxed">{t.proposal.enhancedCaps.massData.desc}</p>
                </div>
            </div>
        </div>
    );

    const ThankYouSlide = () => (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative z-10 animate-fade-in-up">
            <div className="mb-12">
                <div className="inline-block p-10 bg-slate-900 border border-slate-800 rounded-full mb-10 shadow-2xl animate-pulse"><HeartHandshake size={90} className="text-yellow-500" /></div>
                <h2 className="text-6xl md:text-9xl font-black text-white mb-6 tracking-tighter">{t.proposal.thankYou.title}</h2>
                <p className="text-xl md:text-3xl text-slate-400 font-light max-w-2xl mx-auto">{t.proposal.thankYou.subtitle}</p>
            </div>
            <div className="flex flex-col md:flex-row gap-6 mt-6">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 px-10 py-6 rounded-3xl flex items-center gap-4 hover:border-blue-500/50 transition-all group">
                    <Mail size={28} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-lg md:text-xl font-bold text-slate-200">{t.proposal.thankYou.email}</span>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 px-10 py-6 rounded-3xl flex items-center gap-4 hover:border-green-500/50 transition-all group">
                    <Phone size={28} className="text-green-400 group-hover:scale-110 transition-transform" />
                    <span className="text-lg md:text-xl font-bold text-slate-200">{t.proposal.thankYou.phone}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-hidden font-sans select-none flex flex-col">
            <style>{`
          .presentation-progress-bar {
            width: ${((currentSlide + 1) / slides.length) * 100}%;
          }
        `}</style>
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#020617] to-slate-900"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-900/10 rounded-full blur-[150px] animate-pulse-slow"></div>
            </div>
            <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col overscroll-none">
                <div className="flex-1 w-full flex flex-col justify-start px-4 md:px-12 py-16">{renderSlide()}</div>
                <div className="h-32 w-full shrink-0"></div>
            </div>
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 h-20 bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-full flex items-center px-4 shadow-2xl z-50 ring-1 ring-white/5 transition-all hover:bg-slate-900/80">
                <button onClick={prevSlide} disabled={currentSlide === 0} className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-white transition-all active:scale-90" title="Previous Slide"><ChevronLeft size={32} /></button>
                <div className="px-6 md:px-12 flex flex-col items-center min-w-[200px] md:min-w-[280px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Jump to Slide</span>
                    <select
                        value={currentSlide}
                        onChange={(e) => setCurrentSlide(Number(e.target.value))}
                        title="Select Slide"
                        className="bg-slate-950/90 text-white text-xs md:text-sm font-bold font-mono rounded-lg border border-white/10 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-500 max-w-[180px] md:max-w-[240px] truncate"
                    >
                        {slides.map((s, idx) => (
                            <option key={idx} value={idx} className="bg-slate-950 text-white">
                                {idx + 1}. {s.title || (s.id.charAt(0).toUpperCase() + s.id.slice(1))}
                            </option>
                        ))}
                    </select>
                </div>
                <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-white transition-all active:scale-90" title="Next Slide"><ChevronRight size={32} /></button>
                <div className="w-px h-10 bg-white/10 mx-4 hidden md:block"></div>
                <button onClick={() => setSkipFinancials(!skipFinancials)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${skipFinancials ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-white/10 text-slate-400'}`} title={skipFinancials ? "Showing Audience Mode (Privacy ON)" : "Showing Enterprise Mode (Privacy OFF)"}>{skipFinancials ? <EyeOff size={24} /> : <Eye size={24} />}</button>
                <button onClick={toggleFullScreen} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all ml-2" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>{isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}</button>
                <button onClick={handleExit} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-all ml-2" title="Close Presentation"><X size={24} /></button>
            </div>
            <div className="presentation-progress-bar fixed top-0 left-0 h-1.5 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-700 ease-in-out z-[110] shadow-[0_0_15px_rgba(245,158,11,0.4)]"></div>
        </div>
    );
};

export default PresentationPage;
