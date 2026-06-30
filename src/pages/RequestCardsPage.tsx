
import React, { useState, useMemo } from 'react';
import { Booking, BookingStatus, EmployeeRequirement, RacDef, TrainingSession, UserRole, Company } from '../types';
import CardTemplate from '../components/CardTemplate';
import { Mail, AlertCircle, CheckCircle2, Printer, Search, X, ZoomIn, Filter, Trash2, User, Sparkles, CreditCard, Layers } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { OPS_KEYS } from '../constants';

interface RequestCardsPageProps {
  bookings: Booking[];
  requirements: EmployeeRequirement[];
  racDefinitions: RacDef[];
  sessions: TrainingSession[];
  userRole: UserRole;
  currentEmployeeId?: string;
  currentSiteId: string;
  companies?: Company[]; // Passed from App.tsx
}

const RequestCardsPage: React.FC<RequestCardsPageProps> = ({ bookings, requirements, racDefinitions, sessions, userRole, currentEmployeeId, currentSiteId, companies = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { showAlert } = useToast();
  const [requestSent, setRequestSent] = useState(false);
  
  const [slotInputs, setSlotInputs] = useState<string[]>(() => {
      return location.state?.savedInputs || Array(8).fill('');
  });
  
  const [zoomedBookingId, setZoomedBookingId] = useState<string | null>(null);
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const isSelfService = userRole === UserRole.USER;

  const getEligibilityDetails = (empId: string): { isEligible: boolean; reasons: string[] } => {
      const reasons: string[] = [];
      const req = requirements.find(r => r.employeeId === empId);
      if (!req) {
          return { isEligible: false, reasons: ["No requirements or ASO record found for this employee."] };
      }
      
      const today = new Date().toISOString().split('T')[0];
      if (!req.asoExpiryDate) {
          reasons.push("ASO Medical record is missing.");
      } else if (req.asoExpiryDate <= today) {
          reasons.push(`ASO Medical expired on ${req.asoExpiryDate}.`);
      }

      const mappedRacs = Object.entries(req.requiredRacs).filter(([_, val]) => val === true).map(([k]) => k);
      
      const drivingRacs = ['RAC02', 'RAC11', 'LIB_MOV'];
      const isMultiskilled = mappedRacs.some(k => !drivingRacs.includes(k) && !OPS_KEYS.includes(k));

      const empObj = safeBookings.find(b => b.employee?.id === empId)?.employee;
      const dlExpiry = empObj?.driverLicenseExpiry || '';
      const isDlExpired = !dlExpiry || (dlExpiry <= today);

      mappedRacs.forEach(key => {
         if (drivingRacs.includes(key)) {
             if (isDlExpired) {
                 if (!isMultiskilled) {
                     reasons.push(`Driver's license is expired or missing (required for ${key}).`);
                 }
             } else {
                 const passedBooking = safeBookings.find(b => {
                     if (b.employee.id !== empId) return false;
                     if (b.status !== BookingStatus.PASSED) return false;
                     let racCode = '';
                     const session = sessions.find(s => s.id === b.sessionId);
                     if (session) {
                         racCode = session.racType.split(' - ')[0].replace(' ', '');
                     } else {
                         if (b.sessionId.includes('RAC')) {
                             racCode = b.sessionId.split(' - ')[0].replace(' ', '');
                         } else if (b.sessionId.includes(key)) {
                             racCode = key;
                         }
                     }
                     return racCode === key;
                 });
                 if (!passedBooking) {
                     reasons.push(`Missing passed training for ${key}.`);
                 } else if (!passedBooking.expiryDate) {
                     reasons.push(`Training expiry date is missing for ${key}.`);
                 } else if (passedBooking.expiryDate <= today) {
                     reasons.push(`Training for ${key} expired on ${passedBooking.expiryDate}.`);
                 }
             }
         } else {
             const passedBooking = safeBookings.find(b => {
                 if (b.employee.id !== empId) return false;
                 if (b.status !== BookingStatus.PASSED) return false;
                 let racCode = '';
                 const session = sessions.find(s => s.id === b.sessionId);
                 if (session) {
                     racCode = session.racType.split(' - ')[0].replace(' ', '');
                 } else {
                     if (b.sessionId.includes('RAC')) {
                         racCode = b.sessionId.split(' - ')[0].replace(' ', '');
                     } else if (b.sessionId.includes(key)) {
                         racCode = key;
                     }
                 }
                 return racCode === key;
             });
             if (!passedBooking) {
                 reasons.push(`Missing passed training for ${key}.`);
             } else if (!passedBooking.expiryDate) {
                 reasons.push(`Training expiry date is missing for ${key}.`);
             } else if (passedBooking.expiryDate <= today) {
                 reasons.push(`Training for ${key} expired on ${passedBooking.expiryDate}.`);
             }
         }
      });

      return {
          isEligible: reasons.length === 0,
          reasons
      };
  };

  const isEmployeeCompliant = (empId: string): boolean => {
      return getEligibilityDetails(empId).isEligible;
  };

  const allEligibleBookings = useMemo(() => {
     const uniqueMap = new Map<string, Booking>();
     safeBookings.forEach(b => {
         if (!b || !b.employee) return;  // guard: skip bookings with no employee ref
         const eSiteId = b.employee.siteId || 's1';
         if (currentSiteId !== 'all' && eSiteId !== currentSiteId) return;
         if (b.status === BookingStatus.PASSED && !uniqueMap.has(b.employee.id)) {
             uniqueMap.set(b.employee.id, b);
         }
     });
     return Array.from(uniqueMap.values()).filter(b => isEmployeeCompliant(b.employee.id));
  }, [safeBookings, requirements, racDefinitions, sessions, currentSiteId]);

  const slots = useMemo(() => {
      if (isSelfService && currentEmployeeId) {
          const myBooking = allEligibleBookings.find(b => b.employee.id === currentEmployeeId);
          return myBooking ? [myBooking] : [];
      }
      return slotInputs.map(input => {
          if (!input.trim()) return null;
          const lower = input.toLowerCase();
          return allEligibleBookings.find(b => 
              b.employee.recordId.toLowerCase() === lower ||
              b.employee.name.toLowerCase() === lower || 
              b.employee.recordId.toLowerCase().includes(lower) ||
              b.employee.name.toLowerCase().includes(lower)
          ) || null;
      });
  }, [slotInputs, allEligibleBookings, isSelfService, currentEmployeeId]);

  const activeCount = slots.filter(s => s !== null).length;

  const handleSlotChange = (index: number, value: string) => {
      const newInputs = [...slotInputs];
      newInputs[index] = value;
      setSlotInputs(newInputs);
  };

  const clearSlot = (index: number) => {
      const newInputs = [...slotInputs];
      newInputs[index] = '';
      setSlotInputs(newInputs);
  };

  const handleSendRequest = () => {
    if (activeCount === 0) return;
    setRequestSent(true);
    if (!isSelfService) setSlotInputs(Array(8).fill(''));
    setTimeout(() => {
      setRequestSent(false);
    }, 4000);
  };

  const handleGoToPrint = () => {
      const selectedBookings = slots.filter(b => b !== null) as Booking[];
      if (selectedBookings.length > 0) {
          navigate('/print-cards', { 
              state: { 
                  selectedBookings, 
                  savedInputs: slotInputs 
              } 
          });
      } else {
          showAlert("Print Error", "Please select at least one employee to print.");
      }
  };

  const getRequirement = (empId: string) => {
      if (!Array.isArray(requirements)) return undefined;
      return requirements.find(r => r.employeeId === empId);
  };

  const zoomedBooking = bookings.find(b => b.id === zoomedBookingId);

  return (
    <div className="flex flex-col h-full space-y-6 relative pb-24">
      
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 sticky top-0 z-30 transition-all">
        <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
          
          <div className="flex-shrink-0 min-w-[240px]">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-2xl shadow-lg shadow-pink-500/30 text-white">
                    <CreditCard size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t.cards.title}</h2>
                    <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Issuance Studio</span>
                </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              {isSelfService ? "Review and request your digital safety credential." : "Curate your print batch. Select up to 8 eligible personnel."}
            </p>
            
            {!isSelfService && (
                <div className="mt-6 flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Batch Capacity</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-3xl font-black ${activeCount === 8 ? 'text-green-500' : 'text-slate-800 dark:text-white'}`}>{activeCount}</span>
                            <span className="text-slate-400 text-sm font-medium">/ 8</span>
                        </div>
                    </div>
                    {activeCount > 0 && (
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                    )}
                    {activeCount > 0 && (
                        <button 
                            onClick={handleGoToPrint}
                            className="group flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 font-bold text-sm"
                        >
                            <Printer size={18} className="group-hover:scale-110 transition-transform"/>
                            <span>Print Preview</span>
                        </button>
                    )}
                </div>
            )}
          </div>

          {!isSelfService && (
              <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {slotInputs.map((input, idx) => {
                          const match = slots[idx];
                          const hasInput = input.length > 0;
                          return (
                              <div 
                                key={idx} 
                                className={`
                                    relative flex items-center p-1.5 rounded-xl border-2 transition-all duration-300 group
                                    ${match 
                                        ? 'border-green-400 bg-green-50 dark:bg-green-900/10 shadow-sm shadow-green-200/50 dark:shadow-none' 
                                        : hasInput 
                                            ? 'border-red-300 bg-red-50 dark:bg-red-900/10' 
                                            : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500'}
                                `}
                              >
                                  <div className={`
                                      absolute -left-2 -top-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm z-10 transition-colors
                                      ${match ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}
                                  `}>
                                      {idx + 1}
                                  </div>
                                  <div className="flex-shrink-0 pl-2 pr-2 text-slate-400">
                                      {match ? <User size={14} className="text-green-600"/> : <Search size={14} />}
                                  </div>
                                  <input 
                                      type="text"
                                      autoComplete="off"
                                      className="w-full bg-transparent text-sm font-bold outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400/70"
                                      placeholder="Search ID..."
                                      value={input}
                                      /* Fix: Changed 'index' to 'idx' to correctly reference the map iterator index */
                                      onChange={(e) => handleSlotChange(idx, e.target.value)}
                                  />
                                  <div className="pr-2">
                                      {match ? (
                                          <CheckCircle2 size={16} className="text-green-500 animate-bounce-in" />
                                      ) : hasInput ? (
                                          <AlertCircle size={16} className="text-red-400" />
                                      ) : (
                                          <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-600" />
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
                  <div className="mt-3 flex justify-between items-start border-t border-slate-100 dark:border-slate-700/50 pt-3">
                      <div className="flex-1">
                          {slotInputs.some((input, idx) => !slots[idx] && input.trim().length > 0) && (
                              <div className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 mr-4">
                                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                      <span className="font-bold uppercase tracking-wider text-[10px]">Eligibility Issues:</span>
                                      {slotInputs.map((input, idx) => {
                                          if (slots[idx] || !input.trim()) return null;
                                          
                                          // Find the employee in the full booking records
                                          const foundBooking = safeBookings.find(b => 
                                              b.employee && (
                                                  b.employee.recordId.toLowerCase() === input.toLowerCase() ||
                                                  b.employee.name.toLowerCase() === input.toLowerCase()
                                              )
                                          ) || safeBookings.find(b => 
                                              b.employee && (
                                                  b.employee.recordId.toLowerCase().includes(input.toLowerCase()) ||
                                                  b.employee.name.toLowerCase().includes(input.toLowerCase())
                                              )
                                          );
                                          
                                          if (!foundBooking) {
                                              return (
                                                  <div key={idx} className="text-slate-500 dark:text-slate-400">
                                                      Slot {idx + 1}: Personnel <span className="font-bold">"{input}"</span> not found in database.
                                                  </div>
                                              );
                                          }
                                          
                                          const details = getEligibilityDetails(foundBooking.employee.id);
                                          return (
                                              <div key={idx} className="pl-2 border-l-2 border-rose-300 dark:border-rose-800">
                                                  <span className="font-bold text-slate-800 dark:text-slate-200">{foundBooking.employee.name} ({foundBooking.employee.recordId})</span>:
                                                  <div className="text-[11px] text-rose-500 dark:text-rose-400 list-none mt-0.5 space-y-0.5">
                                                      {details.reasons.map((r, ri) => <div key={ri}>• {r}</div>)}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}
                      </div>
                      <button onClick={() => setSlotInputs(Array(8).fill(''))} className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors shrink-0 mt-1">
                          <Trash2 size={12} /> CLEAR BATCH
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[500px] relative">
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] radial-grid-slate"></div>
        </div>

        {activeCount === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            {isSelfService ? (
               <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-md backdrop-blur-sm relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                   <div className="bg-red-50 dark:bg-red-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                        <AlertCircle size={40} className="text-red-500" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{t.cards.eligibility.failedTitle}</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                       {t.cards.eligibility.failedMsg}
                   </p>
                   <button onClick={() => navigate('/manuals')} className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                       {t.cards.eligibility.checkReqs}
                   </button>
               </div>
            ) : (
                <div className="opacity-40 flex flex-col items-center">
                    <Layers size={64} className="text-slate-400 mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold text-slate-500">Canvas Empty</h3>
                    <p className="text-sm text-slate-400">Add employees to the batch above to preview cards.</p>
                </div>
            )}
          </div>
        ) : (
          <div className={`relative z-10 grid gap-8 p-8 ${isSelfService ? 'place-items-center' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'}`}>
               {slots.map((booking, idx) => {
                   if (!booking) return null;
                   return (
                   <div key={String(booking.id)} className="group relative perspective-1000">
                     <div className="absolute -top-3 -right-3 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        {!isSelfService && (
                            <button 
                                aria-label="Remove slot"
                                onClick={() => clearSlot(idx)}
                                className="bg-white dark:bg-slate-800 text-red-500 p-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button 
                            aria-label="Zoom card"
                            onClick={() => setZoomedBookingId(booking.id)}
                            className="bg-white dark:bg-slate-800 text-blue-500 p-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            <ZoomIn size={16} />
                        </button>
                     </div>

                     <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                        <div className="absolute top-4 left-4 z-20">
                            {!isSelfService && (
                                <span className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-md">
                                    SLOT {idx + 1}
                                </span>
                            )}
                        </div>
                        <div className="absolute top-4 right-4 z-20">
                            <div className="bg-green-500 text-white p-1 rounded-full shadow-lg shadow-green-500/40">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-800 p-6 flex justify-center items-center h-[320px] relative">
                            <div className="transform scale-[0.85] origin-center shadow-lg transition-transform duration-500">
                                <CardTemplate 
                                    booking={booking} 
                                    requirement={getRequirement(booking.employee.id)} 
                                    allBookings={bookings}
                                    racDefinitions={racDefinitions}
                                    sessions={sessions}
                                    companies={companies} // Pass companies for live branding
                                />
                            </div>
                        </div>
                        <div className="px-5 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{booking.employee.name}</h4>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{booking.employee.recordId}</span>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{booking.employee.company}</span>
                            </div>
                        </div>
                     </div>
                   </div>
                 );
               })}
          </div>
        )}
      </div>

      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-full shadow-2xl border border-white/20 dark:border-slate-700 ring-1 ring-black/5 flex items-center gap-2">
            <button
                onClick={handleSendRequest}
                disabled={activeCount === 0 || requestSent}
                className={`
                    relative group flex items-center gap-3 px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all duration-300
                    ${activeCount === 0 || requestSent 
                        ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:scale-105 hover:shadow-blue-500/30'}
                `}
            >
                {requestSent ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                ) : (
                    <Mail size={20} className={activeCount > 0 ? "group-hover:rotate-12 transition-transform" : ""} />
                )}
                <span className="tracking-wide">
                    {requestSent ? t.cards.sending : t.cards.requestButton}
                </span>
                {!isSelfService && activeCount > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-1">
                        {activeCount}
                    </span>
                )}
            </button>
        </div>
      </div>

      {zoomedBooking && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setZoomedBookingId(null)}>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button aria-label="Close preview" onClick={() => setZoomedBookingId(null)} className="absolute -top-16 right-0 text-white/70 hover:text-white bg-white/10 p-3 rounded-full transition-all">
                      <X size={24} />
                  </button>
                  <div className="transform scale-[1.5] md:scale-[1.8] origin-center shadow-2xl rounded-lg overflow-hidden ring-8 ring-white/10">
                      <CardTemplate 
                        booking={zoomedBooking} 
                        requirement={getRequirement(zoomedBooking.employee.id)} 
                        allBookings={bookings}
                        racDefinitions={racDefinitions}
                        sessions={sessions}
                        companies={companies} // Pass companies for live branding
                      />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RequestCardsPage;
