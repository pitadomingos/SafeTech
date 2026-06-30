import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, MapPin, Send, AlertTriangle, X } from 'lucide-react';
import { db } from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
  onConditionAdded: () => void;
}

export default function NewConditionForm({ onConditionAdded }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [position, setPosition] = useState<[number, number]>([-15.914093, 33.013188]); // Jindal Chirodzi Mine
  const [functionLocation, setFunctionLocation] = useState('');
  const [conditionType, setConditionType] = useState('');
  const [category, setCategory] = useState<'Unsafe Condition' | 'Unsafe Act' | 'Near Miss' | 'Positive Observation'>('Unsafe Condition');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [responsibleArea, setResponsibleArea] = useState('');
  const [description, setDescription] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        setFunctionLocation(`Loc: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
      },
    });

    useEffect(() => {
      if (position) {
        map.flyTo(position, map.getZoom());
      }
    }, [position, map]);

    return position === null ? null : (
      <Marker position={position}></Marker>
    );
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5)); // High compression
        };
      };
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (photos.length >= 2) {
        alert("Maximum 2 photos allowed.");
        return;
      }
      
      const file = e.target.files[0];
      try {
        const compressed = await compressImage(file);
        setPhotos(prev => [...prev, compressed]);
      } catch (err) {
        console.error("Error compressing image", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conditionType || !responsibleArea || photos.length === 0) {
      alert('Please fill all required fields and add at least 1 photo.');
      return;
    }

    setSubmitting(true);

    try {
      await db.createUnsafeCondition({
        latitude: position[0],
        longitude: position[1],
        functionLocation: functionLocation || 'Unknown Location',
        conditionType,
        category,
        responsibleArea,
        severity,
        description,
        actionPlan,
        initialPhotos: photos,
        correctionPhotos: [],
        observerId: user?.id?.toString() || 'unknown',
        observerName: user?.name || 'Unknown User',
        state: 'Criado',
        mapStatus: 'Recente',
        createdAt: new Date().toISOString()
      });
      
      onConditionAdded();
      navigate('/safemap/global');
    } catch (err) {
      console.error(err);
      alert('Failed to save condition');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900">
      {/* LEFT: Map */}
      <div className="w-1/2 h-full relative z-0">
        <MapContainer center={[-15.914093, 33.013188]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; Google'
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          />
          <LocationMarker />
        </MapContainer>
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 dark:bg-slate-800/90 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm pointer-events-none">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin className="text-red-500" />
                Drop a Pin
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Click anywhere on the map to log the location of the unsafe condition.</p>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="w-1/2 h-full overflow-y-auto p-8 border-l border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <AlertTriangle className="text-yellow-500 h-8 w-8" />
                Report Unsafe Condition
            </h1>
            <p className="text-slate-500 mt-2">Log a new safety hazard to initiate the correction workflow.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                    <input 
                        type="number" 
                        step="any"
                        title="Latitude"
                        aria-label="Latitude"
                        placeholder="e.g. -16.171"
                        value={position[0]}
                        onChange={e => setPosition([parseFloat(e.target.value) || 0, position[1]])}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                    <input 
                        type="number" 
                        step="any"
                        title="Longitude"
                        aria-label="Longitude"
                        placeholder="e.g. 33.763"
                        value={position[1]}
                        onChange={e => setPosition([position[0], parseFloat(e.target.value) || 0])}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Function Location</label>
                    <input 
                        type="text" 
                        value={functionLocation}
                        onChange={e => setFunctionLocation(e.target.value)}
                        placeholder="e.g. CHPP Plant A - Level 2"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Condition Type <span className="text-red-500">*</span></label>
                    <select 
                        required
                        title="Condition Type"
                        aria-label="Condition Type"
                        value={conditionType}
                        onChange={e => setConditionType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Select Type</option>
                        <option value="Missing Guardrail">Missing Guardrail</option>
                        <option value="Oil Spill">Oil Spill</option>
                        <option value="Exposed Wiring">Exposed Wiring</option>
                        <option value="Fire Hazard">Fire Hazard</option>
                        <option value="Unsafe Equipment">Unsafe Equipment</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Observation Category <span className="text-red-500">*</span></label>
                    <select 
                        required
                        title="Category"
                        aria-label="Category"
                        value={category}
                        onChange={e => setCategory(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Unsafe Condition">Unsafe Condition</option>
                        <option value="Unsafe Act">Unsafe Act</option>
                        <option value="Near Miss">Near Miss (Potential Incident)</option>
                        <option value="Positive Observation">Positive Observation (Safe Act)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Severity <span className="text-red-500">*</span></label>
                    <select 
                        required
                        title="Severity"
                        aria-label="Severity"
                        value={severity}
                        onChange={e => setSeverity(e.target.value as any)}
                        className={`w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 ${
                            severity === 'Critical' ? 'border-red-500 text-red-500' : 
                            severity === 'High' ? 'border-orange-500 text-orange-500' :
                            severity === 'Medium' ? 'border-yellow-500 text-yellow-500' : 'border-emerald-500 text-emerald-500'
                        }`}
                    >
                        <option value="Low">Low (Informational)</option>
                        <option value="Medium">Medium (Attention Required)</option>
                        <option value="High">High (Urgent Action)</option>
                        <option value="Critical">Critical (Immediate Stop)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Responsible Area <span className="text-red-500">*</span></label>
                    <select 
                        required
                        title="Responsible Area"
                        aria-label="Responsible Area"
                        value={responsibleArea}
                        onChange={e => setResponsibleArea(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Select Area</option>
                        <option value="Equipment Maintenance">Equipment Maintenance</option>
                        <option value="Operations">Operations</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Facilities">Facilities</option>
                        <option value="Logistics">Logistics</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea 
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Provide detailed comments about the condition..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Plano de Ação (Opcional)</label>
                <textarea 
                    value={actionPlan}
                    onChange={e => setActionPlan(e.target.value)}
                    rows={3}
                    placeholder="Sugira um plano de ação para a correção deste desvio..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Evidence Photos (Min 1, Max 2) <span className="text-red-500">*</span></label>
                <div className="flex gap-4 items-center">
                    {photos.map((p, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={p} alt="evidence" className="w-full h-full object-cover" />
                            <button 
                                type="button" 
                                title="Remove Photo"
                                aria-label="Remove Photo"
                                onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {photos.length < 2 && (
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                            <Camera size={24} />
                            <span className="text-xs font-bold mt-1">Add Photo</span>
                        </button>
                    )}
                    <input 
                        type="file" 
                        title="Upload Photo"
                        aria-label="Upload Photo"
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <button 
                    disabled={submitting}
                    type="submit" 
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                    <Send size={20} />
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
