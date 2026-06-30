
import React from 'react';
import { 
    ArrowUpCircle, Truck, Lock, ShieldAlert, Box, 
    Anchor, Mountain, Zap, Bomb, Flame, Map, 
    FileSignature, AlertTriangle, Hammer, LucideIcon 
} from 'lucide-react';

interface RacIconProps {
    racCode?: string;
    racName?: string;
    size?: number;
    className?: string;
}

const RacIcon: React.FC<RacIconProps> = ({ racCode = '', racName = '', size = 24, className = '' }) => {
    const code = racCode.toUpperCase().replace(/\s+/g, '');
    const name = racName.toLowerCase();

    let Icon: LucideIcon = FileSignature;
    let colorClass = 'text-slate-400';

    // RAC 01 - Heights
    if (code.includes('RAC01') || name.includes('height') || name.includes('altura')) {
        Icon = ArrowUpCircle;
        colorClass = 'text-blue-500';
    } 
    // RAC 02 - Vehicles (Bukkie / LV)
    else if (code.includes('RAC02') || name.includes('lv') || name.includes('vehicle') || name.includes('veiculo') || name.includes('bukkie')) {
        Icon = Truck;
        colorClass = 'text-orange-500';
    } 
    // RAC 03 - Lockout Tagout (LOTO)
    else if (code.includes('RAC03') || name.includes('loto') || name.includes('lockout') || name.includes('bloqueio')) {
        Icon = Lock;
        colorClass = 'text-red-500';
    } 
    // RAC 04 - Machine Guarding
    else if (code.includes('RAC04') || name.includes('machine') || name.includes('maquina') || name.includes('guarding')) {
        Icon = ShieldAlert;
        colorClass = 'text-indigo-500';
    } 
    // RAC 05 - Confined Spaces
    else if (code.includes('RAC05') || name.includes('confined') || name.includes('confinado')) {
        Icon = Box;
        colorClass = 'text-amber-600';
    } 
    // RAC 06 - Lifting Operations (Replaced Crane with Anchor)
    else if (code.includes('RAC06') || name.includes('lifting') || name.includes('içamento')) {
        Icon = Anchor;
        colorClass = 'text-cyan-600';
    } 
    // RAC 07 - Ground Stability
    else if (code.includes('RAC07') || name.includes('ground') || name.includes('solo') || name.includes('stability')) {
        Icon = Mountain;
        colorClass = 'text-emerald-600';
    } 
    // RAC 08 - Electrical Safety
    else if (code.includes('RAC08') || name.includes('elect') || name.includes('elétrica')) {
        Icon = Zap;
        colorClass = 'text-yellow-500';
    } 
    // RAC 09 - Explosives
    else if (code.includes('RAC09') || name.includes('explosive') || name.includes('explosivo')) {
        Icon = Bomb;
        colorClass = 'text-rose-600';
    } 
    // RAC 10 - Molten Metal
    else if (code.includes('RAC10') || name.includes('metal') || name.includes('fogo')) {
        Icon = Flame;
        colorClass = 'text-orange-600';
    } 
    // RAC 11 - Traffic Rules
    else if (code.includes('RAC11') || name.includes('traffic') || name.includes('tráfego')) {
        Icon = Map;
        colorClass = 'text-blue-600';
    } 
    // Operational Permissions
    else if (code.includes('PTS')) {
        Icon = AlertTriangle;
        colorClass = 'text-red-600';
    } else if (code.includes('ART')) {
        Icon = Hammer;
        colorClass = 'text-slate-600';
    }

    return (
        <div className={`flex items-center justify-center p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 shadow-sm hover:scale-110 transition-transform duration-300 ${className}`}>
            <Icon size={size} className={`${colorClass} animate-pulse-slow`} />
        </div>
    );
};

export default RacIcon;
