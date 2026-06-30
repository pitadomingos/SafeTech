
import React from 'react';
import { Booking, BookingStatus, EmployeeRequirement, RacDef, TrainingSession, UserRole, Company } from '../types';
import CardTemplate from '../components/CardTemplate';
import { Printer, AlertCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface CardsPageProps {
  bookings: Booking[];
  requirements: EmployeeRequirement[];
  racDefinitions: RacDef[];
  sessions: TrainingSession[];
  userRole?: UserRole;
  companies?: Company[]; // Passed from App.tsx
}

const CardsPage: React.FC<CardsPageProps> = ({ bookings, requirements, racDefinitions, sessions, userRole, companies = [] }) => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we have specific selection from Request Page
  const stateSelectedBookings = location.state?.selectedBookings as Booking[] | undefined;
  const savedInputs = location.state?.savedInputs as string[] | undefined;

  // STRICT mode: Only show what was passed. If nothing passed, show empty.
  const bookingsToShow = stateSelectedBookings || [];

  // De-duplicate: 1 card per person
  const uniqueEmployeeBookings: Booking[] = [];
  const seenIds = new Set();
  
  bookingsToShow.forEach(b => {
      if (b.employee && !seenIds.has(b.employee.id)) {
          uniqueEmployeeBookings.push(b);
          seenIds.add(b.employee.id);
      }
  });

  // Chunk array into groups of 8 (4 cols * 2 rows)
  const chunkArray = (arr: Booking[], size: number) => {
    const chunkedArr = [];
    for (let i = 0; i < arr.length; i += size) {
      chunkedArr.push(arr.slice(i, i + size));
    }
    return chunkedArr;
  };

  const pages = chunkArray(uniqueEmployeeBookings, 8);
  const getRequirement = (empId: string) => requirements.find(r => r.employeeId === empId);

  const handleBack = () => {
      if (savedInputs) {
          navigate('/request-cards', { state: { savedInputs }, replace: true });
      } else {
          navigate(-1);
      }
  };

  const printerName = userRole ? String(userRole) : 'System';

  return (
    <div className="flex flex-col h-full">
      {/* Control Bar */}
      <div className="no-print bg-white p-4 rounded-lg shadow-sm mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full text-slate-500">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-xl font-bold text-slate-800">{t.cards.title} - Print View</h2>
                <p className="text-sm text-gray-500">
                    {uniqueEmployeeBookings.length > 0 
                        ? `${uniqueEmployeeBookings.length} cards selected for printing.` 
                        : "No cards selected."}
                </p>
            </div>
        </div>
        
        {uniqueEmployeeBookings.length > 0 && (
          <button 
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm cursor-pointer font-bold"
          >
            <Printer size={18} />
            <span>{t.common.print}</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-200 overflow-auto flex justify-center p-8 print:p-0 print:bg-white print:overflow-visible">
        <style>{`
          @media print {
            @page { size: landscape; margin: 0; }
            body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
            .break-before-page { break-before: page; }
            .print-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                grid-template-rows: repeat(2, 1fr);
                gap: 5mm;
                padding: 10mm;
                width: 297mm;
                height: 210mm;
                box-sizing: border-box;
                page-break-after: always;
            }
          }
        `}</style>
        {uniqueEmployeeBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 max-w-lg">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full">
              <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Cards Selected</h3>
              <p>Please return to the Request Cards page and select employees using the filters.</p>
              <button onClick={() => navigate('/request-cards')} className="mt-4 text-blue-600 font-bold hover:underline">Return to Selection</button>
            </div>
          </div>
        ) : (
          /* Printable Container */
          <div className="print:w-full print:h-full">
             {pages.map((pageGroup, pageIndex) => (
                <div 
                  key={`page-${pageIndex}`} 
                  className="bg-white shadow-lg print:shadow-none mx-auto print-grid break-before-page hidden print:grid"
                >
                    {pageGroup.map((booking) => (
                        <div key={String(booking.id)} className="flex justify-center items-center">
                            <CardTemplate 
                              booking={booking} 
                              requirement={getRequirement(booking.employee.id)}
                              allBookings={bookings} 
                              racDefinitions={racDefinitions}
                              sessions={sessions}
                              printedBy={printerName}
                              companies={companies} // Dynamic lookup
                            />
                        </div>
                    ))}
                </div>
            ))}
            {/* Screen Preview (Just standard Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                {uniqueEmployeeBookings.map(b => (
                    <div key={b.id} className="flex justify-center scale-90 origin-top-left">
                        <CardTemplate 
                            booking={b} 
                            requirement={getRequirement(b.employee.id)} 
                            allBookings={bookings}
                            racDefinitions={racDefinitions}
                            sessions={sessions}
                            printedBy={printerName}
                            companies={companies} // Dynamic lookup
                        />
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardsPage;
