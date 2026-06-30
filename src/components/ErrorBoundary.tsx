import React, { ErrorInfo, ReactNode } from 'react';
import { Cpu, Terminal, CheckCircle2, Power } from 'lucide-react';
import { analyzeRuntimeError } from '../services/geminiService';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  aiDiagnosis: { rootCause: string, fix: string } | null;
  repairProgress: number;
  repairStep: string;
  isRepaired: boolean;
}

/**
 * Catches runtime errors and triggers autonomous repair visuals.
 * Inherits from the standard React.Component class to provide error boundary lifecycle methods.
 */
// Fix: Declare inherited React.Component members explicitly for React 19 compatibility.
export class ErrorBoundary extends React.Component<Props, State> {
  // React 19 types require explicit declarations for inherited members in strict mode
  declare setState: React.Component<Props, State>['setState'];
  declare props: React.PropsWithChildren<Props>;
  private simulationInterval: any = null;
  private progressBarRef = React.createRef<HTMLDivElement>();

  // Initialize state as a class property for better type inference
  public state: State = {
    hasError: false,
    error: null,
    aiDiagnosis: null,
    repairProgress: 0,
    repairStep: 'Initializing Diagnostics...',
    isRepaired: false
  };

  /**
   * Static method to update state when an error is caught.
   */
  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
        hasError: true, 
        error, 
        aiDiagnosis: null, 
        repairProgress: 0, 
        repairStep: 'System Breach Detected...',
        isRepaired: false 
    };
  }

  /**
   * Captures the error and initiates diagnostics.
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMessage = error.message || error.toString();
    const isManualCrash = errorMessage.includes("MANUAL SYSTEM CRASH");

    if (isManualCrash) {
        console.warn('🧪 System Crash Simulation Triggered.');
    } else {
        console.error('CARS Manager Critical Error:', errorMessage);
    }

    /* 1. Start Visuals */
    this.startRepairSimulation();

    /* 2. Run Real Diagnosis (Async) */
    this.runSilentDiagnosis(errorMessage, errorInfo);
  }

  public componentWillUnmount() {
      if (this.simulationInterval) clearInterval(this.simulationInterval);
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.progressBarRef.current) {
      this.progressBarRef.current.style.width = `${this.state.repairProgress}%`;
    }
  }

  /**
   * Visual simulation of system "repair" progress.
   */
  // Fix: Use arrow function to ensure 'this' context is preserved for setState.
  private startRepairSimulation = () => {
      const steps = [
          "Scanning Neural Pathways...",
          "Isolating Corrupt Segments...",
          "Engaging RoboTech Healer Protocol...",
          "Re-calibrating State Logic...",
          "Optimizing Memory Shards...",
          "Flushing Local Cache...",
          "Verifying System Integrity..."
      ];

      let stepIndex = 0;

      this.simulationInterval = setInterval(() => {
          // Fix: Access setState from the inherited React.Component class.
          this.setState((prevState: State): Partial<State> | null => {
              const canFinish = !!prevState.aiDiagnosis;
              
              if (prevState.repairProgress >= 90 && !canFinish) {
                  return { repairStep: "Finalizing Analysis..." };
              }

              const nextProgress = prevState.repairProgress + (Math.random() * 8); 
              
              let nextStep = prevState.repairStep;
              if (Math.floor(nextProgress / 15) > stepIndex && stepIndex < steps.length - 1) {
                  stepIndex++;
                  nextStep = steps[stepIndex];
              }

              return {
                  repairProgress: Math.min(nextProgress, 100),
                  repairStep: nextStep
              };
          });
      }, 200);
  }

  /**
   * Sends error details to Gemini for analysis.
   */
  private async runSilentDiagnosis(errorMessage: string, errorInfo: ErrorInfo) {
      try {
          const stack = errorInfo.componentStack || '';
          const diagnosis = await analyzeRuntimeError(errorMessage, stack);
          
          setTimeout(() => {
              this.completeRepair(diagnosis);
          }, 2000); 

      } catch (e) {
          setTimeout(() => {
              this.completeRepair({ rootCause: "Unknown Runtime Exception", fix: "General State Reset" });
          }, 2000);
      }
  }

  /**
   * Finalizes the autonomous repair sequence.
   */
  // Fix: Use arrow function to ensure 'this' context is preserved for setState.
  private completeRepair = (diagnosis: { rootCause: string, fix: string }) => {
      if (this.simulationInterval) clearInterval(this.simulationInterval);

      try {
          sessionStorage.clear();
          localStorage.removeItem('fallback_requirements');
          localStorage.removeItem('fallback_sessions');
          localStorage.removeItem('fallback_bookings');
      } catch(e) { /* ignore */ }

      // Fix: Access setState from the inherited React.Component class to transition to the repaired state.
      this.setState({ 
          aiDiagnosis: diagnosis,
          repairProgress: 100,
          repairStep: "SYSTEM RESTORED",
          isRepaired: true
      });

      try {
          const newLogEntry = {
              id: Date.now().toString(),
              level: 'ERROR', 
              messageKey: `AUTO-RESOLVED: ${diagnosis.rootCause}`, 
              user: 'RoboTech AI',
              timestamp: new Date().toLocaleString(),
              aiFix: diagnosis.fix 
          };
          const existingLogs = JSON.parse(localStorage.getItem('sys_logs_backlog') || '[]');
          localStorage.setItem('sys_logs_backlog', JSON.stringify([newLogEntry, ...existingLogs]));
      } catch (e) {
          console.error("Failed to persist log", e);
      }
  }

  private forceReload = () => {
      try {
          window.location.reload();
      } catch(e) {
          window.location.href = window.location.href;
      }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center p-6 font-mono overflow-hidden text-white animate-fade-in">
          
          <div className="absolute inset-0 opacity-10 pointer-events-none radial-grid-cyan"></div>

          <div className="relative z-10 max-w-2xl w-full">
            
            <div className="flex justify-center mb-10 relative">
                <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${this.state.isRepaired ? 'bg-green-50/40' : 'bg-red-50/30 animate-pulse'}`}></div>
                
                <div className={`relative h-32 w-32 bg-slate-900 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all duration-500 ${this.state.isRepaired ? 'border-green-500 shadow-green-500/50' : 'border-red-500 shadow-red-500/50'}`}>
                    {this.state.isRepaired ? (
                        <CheckCircle2 size={64} className="text-green-400 animate-bounce-in" />
                    ) : (
                        <Cpu size={64} className="text-red-400 animate-spin-slow" />
                    )}
                </div>
            </div>

            <div className="text-center mb-8 space-y-4">
                <h1 className={`text-3xl font-black tracking-[0.2em] transition-colors duration-500 ${this.state.isRepaired ? 'text-green-400' : 'text-white'}`}>
                    {this.state.isRepaired ? 'SYSTEM RESTORED' : 'ROBOTECH INTERVENTION'}
                </h1>
                
                <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-xl backdrop-blur-md shadow-lg">
                    <p className={`text-lg font-bold mb-2 animate-pulse ${this.state.isRepaired ? 'text-green-300' : 'text-red-300'}`}>
                        {this.state.isRepaired ? 'OPERATIONAL STATUS: NORMAL' : 'CRITICAL ERROR DETECTED'}
                    </p>
                    <p className="text-slate-400 text-sm">
                        {this.state.isRepaired 
                            ? "Memory flushed. Stack cleared. Ready for manual reboot."
                            : "Autonomous repair agents have intercepted a runtime crash. Attempting state recovery."
                        }
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase font-bold tracking-wider">
                    <span className={this.state.isRepaired ? 'text-green-500' : 'text-cyan-600'}>
                        {this.state.isRepaired ? 'Recovery Complete' : 'Repair Status'}
                    </span>
                    <span className="text-cyan-400">{Math.floor(this.state.repairProgress)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden relative">
                    <div 
                        ref={this.progressBarRef}
                        className={`h-full transition-all duration-300 ease-out relative overflow-hidden ${this.state.isRepaired ? 'bg-green-500' : 'bg-cyan-50'}`}
                    >
                        <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-black/80 rounded-lg border border-slate-800 p-4 font-mono text-xs h-32 overflow-hidden flex flex-col justify-end shadow-inner">
                <div className="text-slate-500 mb-1">C:\CARS_MANAGER\SYS\ROOT{'>'} initiate_healing.exe --force</div>
                <div className="text-slate-500 mb-1">Catching Exception... OK</div>
                <div className="text-slate-400 mb-1">Analyzing stack trace...</div>
                {this.state.aiDiagnosis && (
                    <div className="text-yellow-500 mb-1">Diagnosis: {this.state.aiDiagnosis.rootCause}</div>
                )}
                <div className="text-cyan-500 font-bold flex items-center gap-2">
                    <Terminal size={12} />
                    {this.state.repairStep}
                    {!this.state.isRepaired && <span className="animate-pulse">_</span>}
                </div>
            </div>

            {this.state.isRepaired && (
                <div className="mt-10 text-center animate-fade-in-up">
                    <button 
                        onClick={this.forceReload}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg shadow-green-500/30 flex items-center gap-3 mx-auto transition-all hover:scale-105"
                    >
                        <Power size={24} /> REBOOT SYSTEM
                    </button>
                    <p className="text-slate-500 text-xs mt-3 uppercase tracking-widest">Safe to reload</p>
                </div>
            )}

          </div>
        </div>
      );
    }

    // Fix: Access props correctly from the React.Component base class.
    return this.props.children || null;
  }
}
