import React, { useState, useRef } from 'react';
import { UnsafeCondition, User, SafeMapState } from '../../types';
import { db } from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';
import { X, Check, ArrowRight, Camera, AlertTriangle, User as UserIcon, Calendar, MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  condition: UnsafeCondition;
  onClose: () => void;
  onUpdate: () => void;
  users: User[];
}

export default function ConditionWorkflowModal({ condition, onClose, onUpdate, users }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [correctionPhotos, setCorrectionPhotos] = useState<string[]>(condition.correctionPhotos || []);
  const [actionPlanInput, setActionPlanInput] = useState(condition.actionPlan || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let { width, height } = img;
          if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
          else if (height > MAX) { width *= MAX / height; height = MAX; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
      };
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (correctionPhotos.length >= 2) return alert("Max 2 photos.");
      const compressed = await compressImage(e.target.files[0]);
      setCorrectionPhotos([...correctionPhotos, compressed]);
    }
  };

  const handleStateChange = async (newState: SafeMapState, additionalUpdates: Partial<UnsafeCondition> = {}) => {
    setSubmitting(true);
    try {
      await db.updateUnsafeCondition(condition.id, {
        state: newState,
        correctionPhotos,
        ...additionalUpdates
      });
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to update condition.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderWorkflowActions = () => {
    if (condition.state === 'Criado') {
      return (
        <button 
          onClick={() => handleStateChange('Em Correção')}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          Acknowledge & Start Correction <ArrowRight size={18} />
        </button>
      );
    }

    if (condition.state === 'Em Correção') {
      return (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            {correctionPhotos.map((p, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-300">
                    <img src={p} alt="correction" className="w-full h-full object-cover" />
                    <button 
                        type="button" 
                        title="Remove Photo"
                        aria-label="Remove Photo"
                        onClick={() => setCorrectionPhotos(correctionPhotos.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                    >
                        <X size={10} />
                    </button>
                </div>
            ))}
            {correctionPhotos.length < 2 && (
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-500"
                >
                    <Camera size={20} />
                    <span className="text-[10px] font-bold mt-1">Add Photo</span>
                </button>
            )}
            <input type="file" title="Upload Photo" aria-label="Upload Photo" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
          </div>
          <div>
            <textarea 
                value={actionPlanInput}
                onChange={e => setActionPlanInput(e.target.value)}
                placeholder="Detalhe o plano de ação ou os passos tomados para a correção..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                rows={3}
            />
          </div>
          <button 
            disabled={correctionPhotos.length === 0 || actionPlanInput.trim() === ''}
            onClick={() => handleStateChange('Submetido ao Gerente', { actionPlan: actionPlanInput })}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            Submit for Manager Approval <ArrowRight size={18} />
          </button>
        </div>
      );
    }

    if (condition.state === 'Submetido ao Gerente') {
      return (
        <div className="flex gap-4">
          <button 
            onClick={() => handleStateChange('Em Correção')}
            className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-200"
          >
            <X size={18} /> Reject
          </button>
          <button 
            onClick={() => handleStateChange('Análise SSMA')}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700"
          >
            <Check size={18} /> Approve
          </button>
        </div>
      );
    }

    if (condition.state === 'Análise SSMA') {
      return (
        <div className="flex gap-4">
          <button 
            onClick={() => handleStateChange('Em Correção')}
            className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-200"
          >
            <X size={18} /> Reject
          </button>
          <button 
            onClick={() => handleStateChange('Resolvido', { mapStatus: 'Resolvido', resolvedAt: new Date().toISOString() })}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700"
          >
            <Check size={18} /> Verify & Resolve
          </button>
        </div>
      );
    }

    if (condition.state === 'Resolvido') {
      return (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
          <Check size={24} />
          <div>
            <div className="font-bold">Condition Resolved</div>
            <div className="text-sm">This safety hazard has been successfully corrected and verified.</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" />
              {condition.conditionType}
            </h2>
            <div className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1"><MapPin size={14}/> {condition.functionLocation}</span>
              <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(condition.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onClose} title="Close Modal" aria-label="Close Modal" className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-sm leading-relaxed border border-slate-200 dark:border-slate-700">
                  {condition.description}
                </p>
              </div>

              {condition.actionPlan && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Plano de Ação</h4>
                    <p className="text-slate-700 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-sm leading-relaxed border border-indigo-100 dark:border-indigo-800/50">
                      {condition.actionPlan}
                    </p>
                  </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Initial Evidence</h4>
                <div className="flex gap-2">
                  {condition.initialPhotos.map((p, idx) => (
                    <a href={p} target="_blank" rel="noreferrer" key={idx}>
                      <img src={p} alt="initial" className="w-24 h-24 rounded-lg object-cover border border-slate-200 shadow-sm" />
                    </a>
                  ))}
                </div>
              </div>

              {condition.correctionPhotos.length > 0 && condition.state !== 'Em Correção' && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Correction Evidence</h4>
                  <div className="flex gap-2">
                    {condition.correctionPhotos.map((p, idx) => (
                      <a href={p} target="_blank" rel="noreferrer" key={idx}>
                        <img src={p} alt="correction" className="w-24 h-24 rounded-lg object-cover border border-slate-200 shadow-sm border-green-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Workflow State</h4>
                <div className="flex flex-wrap gap-3">
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    {condition.state === 'Criado' ? t.safesite.workflow.created : 
                     condition.state === 'Em Correção' ? t.safesite.workflow.inCorrection :
                     condition.state === 'Submetido ao Gerente' ? t.safesite.workflow.submittedManager :
                     condition.state === 'Análise SSMA' ? t.safesite.workflow.hseAnalysis :
                     condition.state === 'Resolvido' ? t.safesite.workflow.resolved : condition.state}
                  </div>
                  <div className={`text-lg font-black px-4 py-2 rounded-xl border ${
                    condition.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' :
                    condition.severity === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                    condition.severity === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {condition.severity || 'Medium'}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Assignments</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500">Observer</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserIcon size={14}/> {condition.observerName}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500">Area Resp.</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserIcon size={14}/> {condition.areaResponsibleName || 'Not Assigned'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500">Manager</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserIcon size={14}/> {condition.areaManagerName || 'Not Assigned'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500">SSMA Point</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserIcon size={14}/> {condition.ssmaFocalPointName || 'Not Assigned'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {renderWorkflowActions()}
        </div>
      </div>
    </div>
  );
}
