import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Plan } from '../types';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarViewProps {
  plans: Plan[];
  theme: 'classic' | 'rose';
  onSelectPlan: (plan: Plan) => void;
  onAddPlan: (date: string) => void;
}

export function CalendarView({ plans, theme, onSelectPlan, onAddPlan }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getPlansForDay = (day: Date) => {
    return plans.filter(plan => isSameDay(parseISO(plan.date), day));
  };

  return (
    <div className={cn(
      "flex flex-col h-full backdrop-blur-md overflow-hidden shadow-xl transition-all duration-300",
      theme === 'rose' 
        ? "bg-white/60 rounded-3xl border-rose-100 shadow-rose-100/30" 
        : "bg-white rounded-xl border-slate-200 shadow-slate-200/20 border"
    )}>
      {/* Calendar Header */}
      <div className={cn(
        "flex items-center justify-between p-6 border-b transition-colors",
        theme === 'rose' ? "border-rose-50 bg-rose-50/30" : "border-slate-100 bg-slate-50/50"
      )}>
        <div className="flex items-center gap-4">
          <h2 className={cn(
            "text-xl font-bold transition-colors",
            theme === 'rose' ? "text-rose-900" : "text-slate-900"
          )}>
            {format(currentMonth, 'yyyy年 MMMM', { locale: zhCN })}
          </h2>
          <div className={cn(
            "flex items-center gap-1 bg-white border p-1 shadow-sm transition-all",
            theme === 'rose' ? "border-rose-100 rounded-xl" : "border-slate-200 rounded-lg"
          )}>
            <button
              onClick={prevMonth}
              className={cn(
                "p-1.5 transition-colors",
                theme === 'rose' ? "hover:bg-rose-50 rounded-lg text-rose-400" : "hover:bg-slate-100 rounded-md text-slate-400"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className={cn(
                "px-3 py-1 text-xs font-bold transition-colors",
                theme === 'rose' ? "text-rose-500 hover:bg-rose-50 rounded-lg" : "text-indigo-600 hover:bg-slate-100 rounded-md"
              )}
            >
              今天
            </button>
            <button
              onClick={nextMonth}
              className={cn(
                "p-1.5 transition-colors",
                theme === 'rose' ? "hover:bg-rose-50 rounded-lg text-rose-400" : "hover:bg-slate-100 rounded-md text-slate-400"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Day Names */}
        <div className={cn(
          "grid grid-cols-7 border-b transition-colors",
          theme === 'rose' ? "border-rose-50 bg-rose-50/10" : "border-slate-100 bg-slate-50/30"
        )}>
          {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((day) => (
            <div key={day} className={cn(
              "py-3 text-center text-[10px] font-black uppercase tracking-widest transition-colors",
              theme === 'rose' ? "text-rose-300" : "text-slate-400"
            )}>
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="flex-1 grid grid-cols-7 overflow-y-auto">
          {days.map((day, idx) => {
            const dayPlans = getPlansForDay(day);
            const isTodayDate = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] p-2 border-b border-r flex flex-col gap-1 transition-all group relative",
                  theme === 'rose' ? "border-rose-50 hover:bg-rose-50/50" : "border-slate-100 hover:bg-slate-50/50",
                  !isCurrentMonth && (theme === 'rose' ? "bg-rose-50/10 text-rose-200" : "bg-slate-50/30 text-slate-300"),
                  idx % 7 === 6 && "border-r-0"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-bold w-7 h-7 flex items-center justify-center transition-all",
                    isTodayDate 
                      ? (theme === 'rose' ? "bg-rose-400 text-white shadow-lg shadow-rose-200 rounded-xl" : "bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-md") 
                      : (isCurrentMonth 
                          ? (theme === 'rose' ? "text-rose-700" : "text-slate-700") 
                          : (theme === 'rose' ? "text-rose-200" : "text-slate-300"))
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <button 
                    onClick={() => onAddPlan(format(day, 'yyyy-MM-dd'))}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 p-1 transition-all",
                      theme === 'rose' ? "text-rose-400 hover:bg-rose-50 rounded-lg" : "text-slate-400 hover:bg-slate-100 rounded-md"
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                  {dayPlans.map(plan => (
                    <motion.button
                      key={plan.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlan(plan);
                      }}
                      className={cn(
                        "text-[10px] text-left px-2 py-1 border transition-all truncate font-bold",
                        theme === 'rose' ? "rounded-lg" : "rounded",
                        plan.isCompleted 
                          ? (theme === 'rose' ? "bg-rose-50/50 border-rose-100 text-rose-200 line-through" : "bg-slate-50 border-slate-100 text-slate-300 line-through") 
                          : (theme === 'rose' ? "bg-rose-50 border-rose-100 text-rose-700 hover:border-rose-200 hover:shadow-sm" : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:border-indigo-200 hover:shadow-sm")
                      )}
                    >
                      {plan.title}
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
