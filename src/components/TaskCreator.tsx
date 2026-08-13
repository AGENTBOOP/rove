import React, { useState } from 'react';
import { 
  Plus, X, Check, Brain, Terminal, TrendingUp, BookOpen, Target, Search, Zap,
  Flame, Activity, Dribbble, ShieldAlert, Trophy, BatteryCharging, Dumbbell,
  Compass, Sunrise, Moon, Shield, UserCheck, Sparkles, Eye,
  Palette, Music, Heart, Droplet, Users, DollarSign, Clock
} from 'lucide-react';

interface TaskCreatorProps {
  onAddTask: (task: {
    name: string;
    category: string;
    target: string;
    duration: string;
    color: string;
    icon: string;
  }) => void;
}

const COLOR_SWATCHES = [
  { name: 'Dark Purple', value: '#6B21A8' },
  { name: 'Teal', value: '#0D9488' },
  { name: 'Pink', value: '#DB2777' },
  { name: 'Green', value: '#16A34A' },
  { name: 'Orange', value: '#EA580C' },
  { name: 'Yellow', value: '#CA8A04' },
  { name: 'Blue', value: '#2563EB' },
];

const METRIC_TRACKS = [
  {
    category: 'FOCUS',
    icons: [
      { name: 'Brain', label: 'Deep Work', Icon: Brain },
      { name: 'Terminal', label: 'Dev Mode', Icon: Terminal },
      { name: 'TrendingUp', label: 'Growth', Icon: TrendingUp },
      { name: 'BookOpen', label: 'Study Grind', Icon: BookOpen },
      { name: 'Target', label: 'Precision Focus', Icon: Target },
      { name: 'Search', label: 'Analysis', Icon: Search },
      { name: 'Zap', label: 'Flow State', Icon: Zap },
    ]
  },
  {
    category: 'ENDURANCE',
    icons: [
      { name: 'Flame', label: 'Pure Grind', Icon: Flame },
      { name: 'Activity', label: 'Physical Power', Icon: Activity },
      { name: 'Dribbble', label: 'Athletic Training', Icon: Dribbble },
      { name: 'ShieldAlert', label: 'Cardio Edge', Icon: ShieldAlert },
      { name: 'Trophy', label: 'Victory', Icon: Trophy },
      { name: 'BatteryCharging', label: 'Energy', Icon: BatteryCharging },
      { name: 'Dumbbell', label: 'Heavy Session', Icon: Dumbbell },
    ]
  },
  {
    category: 'MINDSET',
    icons: [
      { name: 'Compass', label: 'Zen Control', Icon: Compass },
      { name: 'Sunrise', label: 'Morning Routine', Icon: Sunrise },
      { name: 'Moon', label: 'Vision Planning', Icon: Moon },
      { name: 'Shield', label: 'Unbreakable Resilience', Icon: Shield },
      { name: 'UserCheck', label: 'High Status', Icon: UserCheck },
      { name: 'Sparkles', label: 'Apex Intent', Icon: Sparkles },
      { name: 'Eye', label: 'Mental Clarity', Icon: Eye },
    ]
  },
  {
    category: 'PERSONAL',
    icons: [
      { name: 'Palette', label: 'Creative Build', Icon: Palette },
      { name: 'Music', label: 'Skill Practice', Icon: Music },
      { name: 'Heart', label: 'Premium Fuel', Icon: Heart },
      { name: 'Droplet', label: 'Hydration Lock', Icon: Droplet },
      { name: 'Users', label: 'Networking', Icon: Users },
      { name: 'DollarSign', label: 'Financial Assets', Icon: DollarSign },
      { name: 'Clock', label: 'Time Management', Icon: Clock },
    ]
  }
];

export const TaskCreator: React.FC<TaskCreatorProps> = ({ onAddTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState('FOCUS');
  const [target, setTarget] = useState('TODAY');
  const [duration, setDuration] = useState('30m');
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0].value);
  const [selectedIcon, setSelectedIcon] = useState('Brain');

  const handleDone = () => {
    if (!taskName.trim()) return;

    onAddTask({
      name: taskName,
      category,
      target,
      duration,
      color: selectedColor,
      icon: selectedIcon,
    });

    // Reset Form & Collapse Panel
    setTaskName('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDone();
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/50 rounded-lg flex items-center justify-center gap-2 text-purple-200 font-semibold transition-all cursor-pointer"
      >
        <Plus className="w-5 h-5 text-purple-400" />
        <span>+ Add Task</span>
      </button>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 text-slate-200">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase">Create New Task</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Input: Task Name */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">TASK NAME *</label>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 45-min Technical Drill Session"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600"
          autoFocus
        />
      </div>

      {/* Target & Category Selector Pills Side-by-Side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">TARGET TIMELINE</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
          >
            <option value="TODAY">TODAY</option>
            <option value="TOMORROW">TOMORROW</option>
            <option value="THIS WEEK">THIS WEEK</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">CATEGORY</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
          >
            <option value="FOCUS">FOCUS</option>
            <option value="ENDURANCE">ENDURANCE</option>
            <option value="MINDSET">MINDSET</option>
            <option value="PERSONAL">PERSONAL</option>
          </select>
        </div>
      </div>

      {/* Time / Duration Input Row */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">ESTIMATED DURATION</label>
        <input
          type="text"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g., 30m, 1h"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
        />
      </div>

      {/* Color Swatch Row */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400">CARD BORDER COLOR</label>
        <div className="flex items-center gap-3">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              onClick={() => setSelectedColor(swatch.value)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: swatch.value }}
            >
              {selectedColor === swatch.value && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Icons Matrix */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-semibold text-slate-400">SELECT METRIC ICON</label>
        {METRIC_TRACKS.map((track) => (
          <div key={track.category} className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{track.category} TRACK</span>
            <div className="flex flex-wrap gap-2">
              {track.icons.map(({ name, label, Icon }) => {
                const isSelected = selectedIcon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    title={label}
                    onClick={() => setSelectedIcon(name)}
                    className={`p-2 rounded-lg border transition-all relative group ${
                      isSelected 
                        ? 'bg-slate-800 border-slate-500 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[1.5]" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDone}
          disabled={!taskName.trim()}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
        >
          Done Adding Task
        </button>
      </div>
    </div>
  );
};
