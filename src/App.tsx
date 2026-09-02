/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileUp, 
  Search, 
  Trash2, 
  Edit2, 
  Paperclip,
  CheckCircle,
  LayoutDashboard,
  Bell,
  ChevronRight,
  Download,
  List,
  Palette
} from 'lucide-react';
import { Plan, ProgressBlock } from './types';
import { db } from './lib/db';
import { Modal } from './components/Modal';
import { PlanForm } from './components/PlanForm';
import { ImportModal } from './components/ImportModal';
import { CalendarView } from './components/CalendarView';
import { ProgressEditor } from './components/ProgressEditor';
import { useReminders } from './hooks/useReminders';
import { cn } from './lib/utils';
import { format, isToday, parseISO } from 'date-fns';

type Theme = 'classic' | 'rose';

export default function App() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isDBReady, setIsDBReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'completed' | 'pending'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app-theme') as Theme) || 'classic');
  
  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isProgressFullscreen, setIsProgressFullscreen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>();
  const [notificationPlan, setNotificationPlan] = useState<Plan | null>(null);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      try {
        await db.init();
        const allPlans = await db.getAllPlans();
        setPlans(allPlans);
        setIsDBReady(true);
      } catch (err) {
        console.error('Failed to initialize DB:', err);
      }
    };
    init();
  }, []);

  const handleNotify = (plan: Plan) => {
    setNotificationPlan(plan);
    if (Notification.permission === 'granted') {
      new Notification(`计划提醒: ${plan.title}`, {
        body: plan.content || '时间到了！',
        icon: '/favicon.ico'
      });
    }
    
    // Update lastNotified
    const updatedPlan = {
      ...plan,
      reminder: plan.reminder ? { ...plan.reminder, lastNotified: Date.now() } : undefined
    };
    savePlan(updatedPlan);
  };

  const { requestPermission } = useReminders(plans, handleNotify);

  const savePlan = async (plan: Plan) => {
    await db.savePlan(plan);
    setPlans(prev => {
      const index = prev.findIndex(p => p.id === plan.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = plan;
        return next;
      }
      return [...prev, plan];
    });
    setIsPlanModalOpen(false);
    setEditingPlan(undefined);
  };

  const deletePlan = async (id: string) => {
    await db.deletePlan(id);
    setPlans(prev => prev.filter(p => p.id !== id));
    if (selectedPlanId === id) setSelectedPlanId(null);
  };

  const toggleComplete = async (plan: Plan) => {
    const updated = {
      ...plan,
      isCompleted: !plan.isCompleted,
      completedAt: !plan.isCompleted ? Date.now() : undefined,
      updatedAt: Date.now()
    };
    await db.savePlan(updated);
    setPlans(prev => prev.map(p => p.id === plan.id ? updated : p));
  };

  const saveProgress = async (blocks: ProgressBlock[]) => {
    if (!selectedPlan) return;
    const updated = { ...selectedPlan, progressBlocks: blocks, updatedAt: Date.now() };
    await db.savePlan(updated);
    setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
    setIsProgressModalOpen(false);
  };

  const filteredPlans = useMemo(() => {
    let result = plans;
    
    if (filter === 'today') {
      result = result.filter(p => isToday(parseISO(p.date)));
    } else if (filter === 'completed') {
      result = result.filter(p => p.isCompleted);
    } else if (filter === 'pending') {
      result = result.filter(p => !p.isCompleted);
    }

    if (searchQuery) {
      result = result.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [plans, filter, searchQuery]);

  const selectedPlan = useMemo(() => 
    plans.find(p => p.id === selectedPlanId),
  [plans, selectedPlanId]);

  const stats = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter(p => p.isCompleted).length;
    const today = plans.filter(p => isToday(parseISO(p.date))).length;
    return { total, completed, today };
  }, [plans]);

  if (!isDBReady) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        theme === 'rose' ? "bg-rose-50" : "bg-slate-50"
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-12 h-12 border-4 border-t-transparent rounded-full animate-spin",
            theme === 'rose' ? "border-rose-400" : "border-indigo-600"
          )} />
          <p className={cn(
            "font-medium",
            theme === 'rose' ? "text-rose-500" : "text-slate-500"
          )}>正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen flex flex-col overflow-hidden font-sans antialiased transition-colors duration-300",
      theme === 'rose' ? "bg-rose-50/30 text-slate-800" : "bg-[#F8FAFC] text-slate-800"
    )}>
      {/* Header */}
      <header className={cn(
        "h-16 border-b flex items-center justify-between px-6 shrink-0 z-40 transition-colors",
        theme === 'rose' ? "bg-white/80 backdrop-blur-md border-rose-100" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-colors",
            theme === 'rose' ? "bg-rose-400 shadow-rose-100" : "bg-indigo-600 shadow-indigo-100"
          )}>
            <CheckCircle className="text-white w-5 h-5" />
          </div>
          <h1 className={cn(
            "text-xl font-bold tracking-tight transition-colors",
            theme === 'rose' ? "text-rose-900" : "text-slate-900"
          )}>PlanMaster Pro</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggles */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg mr-2">
            <button 
              onClick={() => setTheme('classic')}
              className={cn(
                "p-1.5 rounded transition-all",
                theme === 'classic' ? "bg-white shadow-sm" : "hover:bg-slate-200"
              )}
              title="经典蓝"
            >
              <div className="w-4 h-4 bg-indigo-600 rounded-sm" />
            </button>
            <button 
              onClick={() => setTheme('rose')}
              className={cn(
                "p-1.5 rounded transition-all",
                theme === 'rose' ? "bg-white shadow-sm" : "hover:bg-slate-200"
              )}
              title="梦幻粉"
            >
              <div className="w-4 h-4 bg-rose-400 rounded-sm" />
            </button>
          </div>

          <div className="relative group hidden md:block w-48 lg:w-64">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
              theme === 'rose' ? "text-rose-300 group-focus-within:text-rose-500" : "text-slate-400 group-focus-within:text-indigo-500"
            )} />
            <input 
              type="text" 
              placeholder="搜索计划..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 border outline-none transition-all text-sm",
                theme === 'rose' 
                  ? "bg-rose-50/50 border-transparent focus:bg-white focus:border-rose-300 rounded-xl" 
                  : "bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 rounded-lg"
              )}
            />
          </div>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2",
              theme === 'rose' ? "text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100" : "text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
            )}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导入数据</span>
          </button>
          <button 
            onClick={() => { setEditingPlan(undefined); setIsPlanModalOpen(true); }}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white shadow-sm transition-all flex items-center gap-2 active:scale-95",
              theme === 'rose' ? "bg-rose-400 rounded-lg shadow-rose-100 hover:bg-rose-500" : "bg-indigo-600 rounded-md hover:bg-indigo-700"
            )}
          >
            <Plus className="w-5 h-5" />
            <span>新建计划</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "w-40 border-r hidden lg:flex flex-col p-3 gap-6 shrink-0 overflow-y-auto transition-colors",
          theme === 'rose' ? "bg-white/50 backdrop-blur-sm border-rose-100" : "bg-white border-slate-200"
        )}>
          <nav className="space-y-1">
            <div className={cn(
              "text-xs font-semibold uppercase tracking-wider mb-2 px-3",
              theme === 'rose' ? "text-rose-300" : "text-slate-400"
            )}>视图模式</div>
            <SidebarItem 
              icon={<Calendar className="w-4 h-4" />} 
              label="日历视图" 
              active={viewMode === 'calendar'} 
              onClick={() => setViewMode('calendar')} 
              count={plans.length}
              theme={theme}
            />
            <SidebarItem 
              icon={<List className="w-4 h-4" />} 
              label="列表视图" 
              active={viewMode === 'list'} 
              onClick={() => setViewMode('list')} 
              count={plans.length}
              theme={theme}
            />

            <div className={cn(
              "text-xs font-semibold uppercase tracking-wider mb-2 mt-6 px-3",
              theme === 'rose' ? "text-rose-300" : "text-slate-400"
            )}>任务分类</div>
            <SidebarItem 
              icon={<LayoutDashboard className="w-4 h-4" />} 
              label="全部计划" 
              active={filter === 'all' && viewMode === 'list'} 
              onClick={() => { setFilter('all'); setViewMode('list'); }} 
              count={stats.total}
              theme={theme}
            />
            <SidebarItem 
              icon={<Calendar className="w-4 h-4" />} 
              label="今日计划" 
              active={filter === 'today'} 
              onClick={() => setFilter('today')} 
              count={stats.today}
              theme={theme}
            />
            <SidebarItem 
              icon={<CheckCircle2 className="w-4 h-4" />} 
              label="已完成" 
              active={filter === 'completed'} 
              onClick={() => setFilter('completed')} 
              count={stats.completed}
              theme={theme}
            />
            <SidebarItem 
              icon={<Clock className="w-4 h-4" />} 
              label="待办事项" 
              active={filter === 'pending'} 
              onClick={() => setFilter('pending')} 
              count={stats.total - stats.completed}
              theme={theme}
            />
          </nav>

          <div className="mt-auto">
            <div className={cn(
              "p-4 border shadow-sm transition-colors",
              theme === 'rose' ? "bg-white/80 rounded-2xl border-rose-100 shadow-rose-100/50" : "bg-slate-50 rounded-xl border-slate-100"
            )}>
              <p className={cn(
                "text-xs font-semibold mb-2",
                theme === 'rose' ? "text-rose-400" : "text-slate-500"
              )}>计划完成进度</p>
              <div className={cn(
                "h-2 rounded-full overflow-hidden",
                theme === 'rose' ? "bg-rose-50" : "bg-slate-200"
              )}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' }}
                  className={cn(
                    "h-full transition-colors",
                    theme === 'rose' ? "bg-rose-400" : "bg-emerald-500"
                  )} 
                />
              </div>
              <p className={cn(
                "text-[10px] mt-2 font-medium",
                theme === 'rose' ? "text-rose-300" : "text-slate-400"
              )}>
                {stats.completed} / {stats.total} 已完成
              </p>
            </div>
            
            <button 
              onClick={() => requestPermission()}
              className={cn(
                "flex items-center gap-3 w-full p-3 mt-4 transition-all group",
                theme === 'rose' ? "text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              )}
            >
              <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-medium">开启桌面提醒</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden">
          {viewMode === 'calendar' ? (
            <div className={cn(
              "flex-1 p-6 overflow-hidden flex flex-col transition-colors",
              theme === 'rose' ? "bg-rose-50/20" : "bg-slate-50/50"
            )}>
              <CalendarView 
                plans={plans} 
                theme={theme}
                onSelectPlan={(plan) => {
                  setSelectedPlanId(plan.id);
                }}
                onAddPlan={(date) => {
                  setPreselectedDate(date);
                  setEditingPlan(undefined);
                  setIsPlanModalOpen(true);
                }}
              />
            </div>
          ) : (
            <section className={cn(
              "flex-1 flex flex-col border-r lg:bg-transparent transition-colors",
              theme === 'rose' ? "border-rose-100 bg-white/30 backdrop-blur-sm" : "border-slate-200 bg-white"
            )}>
              <div className={cn(
                "p-6 border-b flex justify-between items-center shrink-0 transition-colors",
                theme === 'rose' ? "bg-white/50 border-rose-50" : "bg-white border-slate-100"
              )}>
                <h2 className={cn(
                  "text-lg font-bold",
                  theme === 'rose' ? "text-rose-900" : "text-slate-900"
                )}>
                  {filter === 'all' && '全部计划'}
                  {filter === 'today' && '今日计划'}
                  {filter === 'completed' && '已完成'}
                  {filter === 'pending' && '待办事项'}
                </h2>
                <div className={cn(
                  "text-sm font-medium",
                  theme === 'rose' ? "text-rose-400" : "text-slate-500"
                )}>
                  {format(new Date(), 'EEEE, MMM d')}
                </div>
              </div>

              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {filteredPlans.length > 0 ? (
                    filteredPlans.map(plan => (
                      <motion.div
                        key={plan.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={cn(
                          "group p-4 border shadow-sm cursor-pointer transition-all flex items-start gap-4",
                          theme === 'rose' ? "bg-white/80 rounded-2xl" : "bg-white rounded-xl",
                          selectedPlanId === plan.id 
                            ? (theme === 'rose' ? "border-rose-200 ring-1 ring-rose-50 shadow-rose-100/50" : "border-indigo-200 ring-1 ring-indigo-50 shadow-indigo-100/50") 
                            : (theme === 'rose' ? "border-rose-100 hover:border-rose-300" : "border-slate-200 hover:border-indigo-200"),
                          plan.isCompleted && (theme === 'rose' ? "opacity-75 bg-rose-50/20" : "opacity-75 bg-slate-50/50")
                        )}
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleComplete(plan); }}
                          className={cn(
                            "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                            plan.isCompleted 
                              ? (theme === 'rose' ? "bg-rose-400 border-rose-400 text-white" : "bg-emerald-500 border-emerald-500 text-white") 
                              : (theme === 'rose' ? "border-rose-200 text-transparent hover:border-rose-400 group-hover:bg-rose-50" : "border-slate-300 text-transparent hover:border-indigo-500 group-hover:bg-indigo-50")
                          )}
                        >
                          {plan.isCompleted ? <span className="text-[10px]">✓</span> : <div className={cn("w-2.5 h-2.5 rounded-full opacity-0 hover:opacity-100", theme === 'rose' ? "bg-rose-400" : "bg-indigo-500")} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className={cn(
                              "font-semibold truncate",
                              plan.isCompleted 
                                ? (theme === 'rose' ? "line-through text-rose-300" : "line-through text-slate-400") 
                                : (theme === 'rose' ? "text-rose-900" : "text-slate-900")
                            )}>
                              {plan.title}
                            </h3>
                            <span className={cn(
                              "text-xs font-medium px-2 py-1 shrink-0",
                              theme === 'rose' ? "rounded-lg" : "rounded",
                              plan.isCompleted 
                                ? (theme === 'rose' ? "text-rose-300" : "text-slate-400") 
                                : (theme === 'rose' ? "text-rose-400 bg-rose-50/50" : "text-slate-400 bg-slate-100")
                            )}>
                              {plan.time}
                            </span>
                          </div>
                          {plan.content && (
                            <p className={cn(
                              "text-sm mt-1 line-clamp-1",
                              theme === 'rose' ? "text-rose-400/80" : "text-slate-500"
                            )}>
                              {plan.content}
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            {plan.reminder?.enabled && (
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                                theme === 'rose' ? "rounded-lg bg-rose-50 text-rose-600 border-rose-100" : "rounded bg-indigo-50 text-indigo-700 border-indigo-100"
                              )}>
                                Reminder On
                              </span>
                            )}
                            {plan.attachments.length > 0 && (
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 text-[10px] font-bold border",
                                theme === 'rose' ? "rounded-lg bg-white text-rose-400 border-rose-50" : "rounded bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                📎 {plan.attachments.length} File{plan.attachments.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                      <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                        theme === 'rose' ? "bg-rose-50" : "bg-slate-50"
                      )}>
                        <LayoutDashboard className={cn(
                          "w-8 h-8",
                          theme === 'rose' ? "text-rose-200" : "text-slate-200"
                        )} />
                      </div>
                      <p className={cn(
                        "font-medium",
                        theme === 'rose' ? "text-rose-300" : "text-slate-400"
                      )}>没有找到相关计划</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Detail Section */}
          <section className={cn(
            "w-80 hidden xl:flex flex-col shrink-0 border-l transition-colors",
            theme === 'rose' ? "bg-white/40 backdrop-blur-md border-rose-100" : "bg-white border-slate-200"
          )}>
            <div className={cn(
              "p-6 border-b shrink-0 transition-colors",
              theme === 'rose' ? "border-rose-50" : "border-slate-100"
            )}>
              <h2 className={cn(
                "text-lg font-bold",
                theme === 'rose' ? "text-rose-900" : "text-slate-900"
              )}>计划详情</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedPlan ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        theme === 'rose' ? "text-rose-300" : "text-slate-400"
                      )}>标题</label>
                      <div className={cn(
                        "mt-1 text-base font-semibold",
                        theme === 'rose' ? "text-rose-900" : "text-slate-900"
                      )}>{selectedPlan.title}</div>
                    </div>
                    
                    {selectedPlan.content && (
                      <div>
                        <label className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          theme === 'rose' ? "text-rose-300" : "text-slate-400"
                        )}>详细内容</label>
                        <div className={cn(
                          "mt-1 text-sm leading-relaxed",
                          theme === 'rose' ? "text-rose-600/90" : "text-slate-600"
                        )}>{selectedPlan.content}</div>
                      </div>
                    )}

                    <div>
                      <label className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        theme === 'rose' ? "text-rose-300" : "text-slate-400"
                      )}>时间 & 日期</label>
                      <div className={cn(
                        "mt-1 flex items-center gap-4 text-sm font-medium",
                        theme === 'rose' ? "text-rose-500" : "text-slate-700"
                      )}>
                        <div className={cn("flex items-center gap-2 px-2 py-1", theme === 'rose' ? "bg-rose-50 rounded-lg" : "rounded")}><Calendar className={cn("w-4 h-4", theme === 'rose' ? "text-rose-300" : "text-slate-400")} /> {selectedPlan.date}</div>
                        <div className={cn("flex items-center gap-2 px-2 py-1", theme === 'rose' ? "bg-rose-50 rounded-lg" : "rounded")}><Clock className={cn("w-4 h-4", theme === 'rose' ? "text-rose-300" : "text-slate-400")} /> {selectedPlan.time}</div>
                      </div>
                    </div>

                    <div>
                      <label className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        theme === 'rose' ? "text-rose-300" : "text-slate-400"
                      )}>提醒设置</label>
                      <div className="mt-2 flex items-center gap-3">
                        <div className={cn(
                          "p-2 shadow-sm transition-colors",
                          theme === 'rose' ? "rounded-xl bg-rose-100 text-rose-600" : "rounded-md bg-indigo-50 text-indigo-600",
                          !selectedPlan.reminder?.enabled && (theme === 'rose' ? "bg-rose-50/50 text-rose-200 shadow-none" : "bg-slate-50 text-slate-400 shadow-none")
                        )}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <span className={cn(
                          "text-sm font-medium transition-colors",
                          theme === 'rose' ? "text-rose-700" : "text-slate-700"
                        )}>
                          {selectedPlan.reminder?.enabled 
                            ? `${selectedPlan.reminder.time} (${selectedPlan.reminder.repeat === 'once' ? '仅一次' : selectedPlan.reminder.repeat})` 
                            : '未开启提醒'}
                        </span>
                      </div>
                    </div>

                    {selectedPlan.attachments.length > 0 && (
                      <div>
                        <label className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          theme === 'rose' ? "text-rose-300" : "text-slate-400"
                        )}>附件</label>
                        <div className="mt-3 space-y-2">
                          {selectedPlan.attachments.map(att => (
                            <div key={att.id} className={cn(
                              "flex items-center gap-2 p-2 border transition-all group shadow-sm",
                              theme === 'rose' ? "bg-white border-rose-50 rounded-xl hover:border-rose-200" : "bg-white border-slate-200 rounded-lg hover:border-indigo-300"
                            )}>
                              <div className={cn(
                                "w-10 h-10 flex items-center justify-center font-bold text-[10px] transition-colors",
                                theme === 'rose' ? "bg-rose-50 rounded-lg text-rose-300" : "bg-slate-50 rounded text-slate-400"
                              )}>
                                {att.name.split('.').pop()?.toUpperCase() || 'FILE'}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className={cn("text-xs font-semibold truncate", theme === 'rose' ? "text-rose-700" : "text-slate-700")}>{att.name}</p>
                                <p className={cn("text-[10px] font-medium", theme === 'rose' ? "text-rose-300" : "text-slate-400")}>{(att.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPlan.progressBlocks && selectedPlan.progressBlocks.length > 0 && (
                      <div className={cn("pt-4 border-t", theme === 'rose' ? "border-rose-50" : "border-slate-100")}>
                        <div className="flex items-center justify-between mb-3">
                          <label className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            theme === 'rose' ? "text-rose-300" : "text-slate-400"
                          )}>计划进展</label>
                          {selectedPlan.progressBlocks.length > 2 && (
                            <button 
                              onClick={() => {
                                // Toggle local state if needed, but for now let's just use a simple limit
                                // and maybe show a toast or open the editor
                                setIsProgressModalOpen(true);
                              }}
                              className={cn(
                                "text-[10px] font-bold uppercase hover:underline",
                                theme === 'rose' ? "text-rose-400" : "text-indigo-600"
                              )}
                            >
                              管理全部 ({selectedPlan.progressBlocks.length})
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          {selectedPlan.progressBlocks.slice(-2).reverse().map((block) => (
                            <div key={block.id} className="relative">
                              {block.type === 'text' ? (
                                block.content && (
                                  <div className={cn(
                                    "prose prose-sm max-w-none line-clamp-3",
                                    theme === 'rose' ? "prose-rose text-rose-800" : "prose-slate text-slate-700"
                                  )}>
                                    <ReactMarkdown>{block.content}</ReactMarkdown>
                                  </div>
                                )
                              ) : (
                                <img 
                                  src={block.content} 
                                  alt="" 
                                  className={cn(
                                    "w-full h-32 object-cover border shadow-sm",
                                    theme === 'rose' ? "rounded-2xl border-rose-100" : "rounded-xl border-slate-100"
                                  )} 
                                />
                              )}
                            </div>
                          ))}
                          {selectedPlan.progressBlocks.length > 2 && (
                            <p className={cn(
                              "text-center text-[10px] font-medium py-2 border-t border-dashed mt-2",
                              theme === 'rose' ? "text-rose-300 border-rose-100" : "text-slate-400 border-slate-100"
                            )}>
                              ↑ 仅展示最新 2 条进展
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={cn("pt-6 border-t space-y-2", theme === 'rose' ? "border-rose-50" : "border-slate-100")}>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingPlan(selectedPlan); setIsPlanModalOpen(true); }}
                        className={cn(
                          "flex-1 py-2.5 text-sm font-bold border transition-colors shadow-sm",
                          theme === 'rose' ? "text-rose-700 bg-white border-rose-100 rounded-xl hover:bg-rose-50" : "text-slate-700 bg-slate-50 border-slate-200 rounded-md hover:bg-slate-100"
                        )}
                      >
                        编辑计划
                      </button>
                      <button 
                        onClick={() => deletePlan(selectedPlan.id)}
                        className={cn(
                          "px-3 py-2.5 text-sm font-semibold transition-colors",
                          theme === 'rose' ? "text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl" : "text-red-600 hover:bg-red-50 rounded-md"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => setIsProgressModalOpen(true)}
                      className={cn(
                        "w-full py-3 text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
                        theme === 'rose' ? "bg-rose-400 rounded-xl shadow-rose-100 hover:bg-rose-500" : "bg-indigo-600 rounded-md shadow-indigo-100 hover:bg-indigo-700"
                      )}
                    >
                      <Edit2 className="w-4 h-4" />
                      计划进展
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                    theme === 'rose' ? "bg-rose-50" : "bg-slate-50"
                  )}>
                    <ChevronRight className={cn("w-6 h-6", theme === 'rose' ? "text-rose-200" : "text-slate-200")} />
                  </div>
                  <p className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    theme === 'rose' ? "text-rose-300" : "text-slate-400"
                  )}>选择一个计划以查看详情</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isPlanModalOpen} 
        onClose={() => { setIsPlanModalOpen(false); setPreselectedDate(undefined); }} 
        title={editingPlan ? '编辑计划' : '创建新计划'}
        className={cn("max-w-md", theme === 'rose' ? "rounded-2xl" : "rounded-xl")}
      >
        <PlanForm 
          plan={editingPlan} 
          initialDate={preselectedDate}
          theme={theme}
          onSave={savePlan} 
          onCancel={() => { setIsPlanModalOpen(false); setPreselectedDate(undefined); }} 
        />
      </Modal>

      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        title="导入计划数据 (.CSV)"
        className={cn("max-w-md", theme === 'rose' ? "rounded-2xl" : "rounded-xl")}
      >
        <ImportModal 
          onImport={(imported) => {
            imported.forEach(p => savePlan(p));
            setIsImportModalOpen(false);
          }} 
          theme={theme}
          onCancel={() => setIsImportModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => {
          setIsProgressModalOpen(false);
          setIsProgressFullscreen(false);
        }}
        title="记录计划进展"
        className={cn(isProgressFullscreen ? "max-w-none max-h-none" : "max-w-4xl", theme === 'rose' ? "rounded-2xl" : "rounded-xl")}
        isFullscreen={isProgressFullscreen}
        noPadding
      >
        {selectedPlan && (
          <ProgressEditor
            initialBlocks={selectedPlan.progressBlocks}
            theme={theme}
            isFullscreen={isProgressFullscreen}
            onToggleFullscreen={() => setIsProgressFullscreen(prev => !prev)}
            onSave={(blocks) => {
              saveProgress(blocks);
              setIsProgressModalOpen(false);
              setIsProgressFullscreen(false);
            }}
            onCancel={() => {
              setIsProgressModalOpen(false);
              setIsProgressFullscreen(false);
            }}
          />
        )}
      </Modal>

      {/* Notification UI */}
      <AnimatePresence>
        {notificationPlan && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "fixed bottom-6 right-6 w-80 backdrop-blur-md shadow-2xl border p-5 z-[100] transition-colors",
              theme === 'rose' ? "bg-white/90 border-rose-100 rounded-2xl" : "bg-white border-slate-200 rounded-xl"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 flex items-center justify-center shrink-0",
                theme === 'rose' ? "bg-rose-50 text-rose-500 rounded-xl" : "bg-indigo-50 text-indigo-600 rounded-lg"
              )}>
                <Bell className="w-5 h-5 animate-ring" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest mb-1",
                  theme === 'rose' ? "text-rose-400" : "text-indigo-600"
                )}>现在时间: {notificationPlan.time}</p>
                <h4 className={cn(
                  "font-bold truncate mb-1",
                  theme === 'rose' ? "text-rose-900" : "text-slate-900"
                )}>{notificationPlan.title}</h4>
                <p className={cn(
                  "text-xs line-clamp-2 leading-relaxed",
                  theme === 'rose' ? "text-rose-50" : "text-slate-500"
                )}>{notificationPlan.content}</p>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => { toggleComplete(notificationPlan); setNotificationPlan(null); }}
                    className={cn(
                      "flex-1 py-2 text-white text-xs font-bold transition-colors shadow-sm",
                      theme === 'rose' ? "bg-rose-400 rounded-lg hover:bg-rose-500" : "bg-indigo-600 rounded-md hover:bg-indigo-700"
                    )}
                  >
                    完成打卡
                  </button>
                  <button 
                    onClick={() => setNotificationPlan(null)}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold transition-colors",
                      theme === 'rose' ? "bg-rose-50 text-rose-400 rounded-lg hover:bg-rose-100" : "bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200"
                    )}
                  >
                    忽略
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, count, theme }: { icon: ReactNode, label: string, active: boolean, onClick: () => void, count: number, theme: 'classic' | 'rose' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-3 py-2.5 transition-all group relative",
        theme === 'rose' ? "rounded-xl" : "rounded-lg",
        active 
          ? (theme === 'rose' ? "bg-rose-100/50 text-rose-700 font-bold shadow-sm" : "bg-indigo-50 text-indigo-700 font-medium") 
          : (theme === 'rose' ? "text-rose-400 hover:bg-rose-50/50" : "text-slate-600 hover:bg-slate-50")
      )}
    >
      <div className="flex items-center gap-3">
        {active && <span className={cn("absolute left-0 w-1 h-4 rounded-r-full", theme === 'rose' ? "bg-rose-400" : "bg-indigo-600")} />}
        <span className={cn(
          "transition-colors",
          active 
            ? (theme === 'rose' ? "text-rose-500" : "text-indigo-600") 
            : (theme === 'rose' ? "text-rose-300 group-hover:text-rose-400" : "text-slate-400 group-hover:text-slate-600")
        )}>
          {icon}
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <span className={cn(
        "text-[10px] font-bold px-1.5 py-0.5",
        theme === 'rose' ? "rounded-lg" : "rounded",
        active 
          ? (theme === 'rose' ? "bg-rose-200/50 text-rose-700" : "bg-indigo-100 text-indigo-700") 
          : (theme === 'rose' ? "bg-rose-50 text-rose-300" : "bg-slate-100 text-slate-500")
      )}>
        {count}
      </span>
    </button>
  );
}

function StatCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</span>
      <span className="text-lg font-black text-neutral-900 leading-none mt-1">{value}</span>
    </div>
  );
}
