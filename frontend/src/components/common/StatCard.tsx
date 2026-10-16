import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'critical' | 'default';
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  onClick,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'emerald':
        return {
          border: 'border-em/30 hover:border-em',
          iconBg: 'bg-em/10 text-em border-em/30',
          glow: 'hover:shadow-[0_0_25px_rgba(57,255,176,0.15)]',
          text: 'text-em',
        };
      case 'cyan':
        return {
          border: 'border-cyan/30 hover:border-cyan',
          iconBg: 'bg-cyan/10 text-cyan border-cyan/30',
          glow: 'hover:shadow-[0_0_25px_rgba(60,224,232,0.15)]',
          text: 'text-cyan',
        };
      case 'amber':
        return {
          border: 'border-amber-500/30 hover:border-amber-400',
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
          text: 'text-amber-400',
        };
      case 'rose':
      case 'critical':
        return {
          border: 'border-rose-500/30 hover:border-rose-400',
          iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          glow: 'hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]',
          text: 'text-rose-400',
        };
      default:
        return {
          border: 'border-line hover:border-line-bright',
          iconBg: 'bg-white/5 text-mist border-line',
          glow: '',
          text: 'text-white',
        };
    }
  };

  const style = getColors();

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-xl border transition-all duration-200 ${style.border} ${style.glow} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono tracking-wider text-mist uppercase">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-display font-semibold mt-2 tracking-tight">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-mist/80 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg border ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-line/60 flex items-center text-xs text-mist font-mono">
          <span className="text-em mr-1">●</span> {trend}
        </div>
      )}
    </div>
  );
};
