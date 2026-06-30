import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { UnsafeCondition, User } from '../../types';
import L from 'leaflet';
import { MapPin, Info, ArrowRight, LayoutDashboard, List } from 'lucide-react';
import ConditionWorkflowModal from './ConditionWorkflowModal';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  conditions: UnsafeCondition[];
  onConditionUpdated: () => void;
  users: User[];
}

// Custom Icons for different statuses
const createStatusIcon = (color: string) => L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const redIcon = createStatusIcon('#ef4444');
const yellowIcon = createStatusIcon('#eab308');
const greenIcon = createStatusIcon('#22c55e');

export default function GlobalMapDashboard({ conditions, onConditionUpdated, users }: Props) {
  const [selectedCondition, setSelectedCondition] = useState<UnsafeCondition | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const getCompanyCenter = (): [number, number] => {
    if (user?.companyGpsCoordinates) {
        const parts = user.companyGpsCoordinates.split(',').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return [parts[0], parts[1]];
        }
    }
    return [-15.914093, 33.013188]; // Default fallback
  };

  const mapCenter = getCompanyCenter();

  const getIconForStatus = (status: string) => {
    switch (status) {
      case 'Atrasado': return redIcon;
      case 'Recente': return yellowIcon;
      case 'Resolvido': return greenIcon;
      default: return yellowIcon;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="p-6 pb-0">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <MapPin className="text-indigo-500 h-8 w-8" />
                  {t.safesite.map.title}
                </h1>
                <p className="text-slate-500 mt-2">{t.safesite.map.subtitle}</p>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => navigate('/safemap/analytics')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-bold transition-all"
                >
                    <LayoutDashboard size={18} />
                    {t.safesite.nav.dashboard}
                </button>
                <button 
                    onClick={() => navigate('/safemap/report')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl font-bold transition-all"
                >
                    <List size={18} />
                    {t.safesite.nav.reportingTable}
                </button>
            </div>
        </div>
        
        {/* Legend */}
        <div className="flex gap-6 mt-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.safesite.dashboard.delayed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow"></div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.safesite.dashboard.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.safesite.dashboard.resolved}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 pt-2">
        <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative z-0">
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; Google'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
            {conditions.map(condition => (
              <Marker 
                key={condition.id} 
                position={[condition.latitude, condition.longitude]}
                icon={getIconForStatus(condition.mapStatus)}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <div className="font-black text-slate-900 text-base mb-1">{condition.conditionType}</div>
                    <div className="text-xs text-slate-500 mb-2">{condition.functionLocation}</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                        condition.severity === 'Critical' ? 'bg-red-100 text-red-600' :
                        condition.severity === 'High' ? 'bg-orange-100 text-orange-600' :
                        condition.severity === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {condition.severity || 'Medium'}
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">{condition.state}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-4">
                      <span>{new Date(condition.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedCondition(condition)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      View Details
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {selectedCondition && (
        <ConditionWorkflowModal
          condition={selectedCondition}
          onClose={() => setSelectedCondition(null)}
          onUpdate={() => {
            onConditionUpdated();
            setSelectedCondition(null);
          }}
          users={users}
        />
      )}
    </div>
  );
}
