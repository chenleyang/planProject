import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import React from 'react';
import { Plan, Attachment, Reminder } from '../types';
import { Bell, Paperclip, Clock, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface PlanFormProps {
  plan?: Plan;
  initialDate?: string;
  theme: 'classic' | 'rose';
  onSave: (plan: Plan) => void;
  onCancel: () => void;
}

export function PlanForm({ plan, initialDate, theme, onSave, onCancel }: PlanFormProps) {
  const [title, setTitle] = useState(plan?.title || '');
  const [content, setContent] = useState(plan?.content || '');
  const [date, setDate] = useState(plan?.date || initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(plan?.time || format(new Date(), 'HH:mm'));
  const [reminder, setReminder] = useState<Reminder>(plan?.reminder || { enabled: false, time: '09:00', repeat: 'once' });
  const [attachments, setAttachments] = useState<Attachment[]>(plan?.attachments || []);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: Attachment = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target?.result as string,
          createdAt: Date.now()
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPlan: Plan = {
      id: plan?.id || Math.random().toString(36).substr(2, 9),
      title,
      content,
      date,
      time,
      isCompleted: plan?.isCompleted || false,
      completedAt: plan?.completedAt,
      reminder,
      attachments,
      createdAt: plan?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(newPlan);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div>
          <label className={cn(
            "block text-[10px] font-bold uppercase tracking-widest mb-1.5",
            theme === 'rose' ? "text-rose-300" : "text-slate-400"
          )}>计划名称</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例如: 撰写季度财务报告"
            className={cn(
              "w-full px-4 py-2.5 bg-slate-50 border outline-none transition-all text-sm font-medium",
              theme === 'rose' 
                ? "border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400" 
                : "border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            )}
          />
        </div>

        <div>
          <label className={cn(
            "block text-[10px] font-bold uppercase tracking-widest mb-1.5",
            theme === 'rose' ? "text-rose-300" : "text-slate-400"
          )}>详细内容 (可选)</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="记录更详细的任务要求或备注信息..."
            rows={3}
            className={cn(
              "w-full px-4 py-2.5 bg-slate-50 border outline-none transition-all resize-none text-sm leading-relaxed",
              theme === 'rose' 
                ? "border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400" 
                : "border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={cn(
              "block text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2",
              theme === 'rose' ? "text-rose-300" : "text-slate-400"
            )}>
              <CalendarIcon className="w-3.5 h-3.5" /> 截止日期
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={cn(
                "w-full px-4 py-2 bg-slate-50 border outline-none text-sm font-medium",
                theme === 'rose' ? "border-rose-100 rounded-xl" : "border-slate-200 rounded-lg"
              )}
            />
          </div>
          <div>
            <label className={cn(
              "block text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2",
              theme === 'rose' ? "text-rose-300" : "text-slate-400"
            )}>
              <Clock className="w-3.5 h-3.5" /> 提醒时间
            </label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className={cn(
                "w-full px-4 py-2 bg-slate-50 border outline-none text-sm font-medium",
                theme === 'rose' ? "border-rose-100 rounded-xl" : "border-slate-200 rounded-lg"
              )}
            />
          </div>
        </div>

        <div className={cn(
          "p-4 border space-y-4 transition-colors",
          theme === 'rose' ? "bg-rose-50/50 rounded-2xl border-rose-100" : "bg-slate-50 rounded-xl border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
              theme === 'rose' ? "text-rose-600" : "text-slate-600"
            )}>
              <Bell className={cn("w-4 h-4", theme === 'rose' ? "text-rose-500" : "text-indigo-500")} />
              定时提醒
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={reminder.enabled}
                onChange={e => setReminder(prev => ({ ...prev, enabled: e.target.checked }))}
              />
              <div className={cn(
                "w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all",
                theme === 'rose' ? "peer-checked:bg-rose-400 after:border-rose-200" : "peer-checked:bg-indigo-600 after:border-slate-300"
              )}></div>
            </label>
          </div>

          {reminder.enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <input
                type="time"
                value={reminder.time}
                onChange={e => setReminder(prev => ({ ...prev, time: e.target.value }))}
                className={cn(
                  "px-3 py-1.5 bg-white border outline-none text-sm font-medium",
                  theme === 'rose' ? "border-rose-100 rounded-lg" : "border-slate-200 rounded-md"
                )}
              />
              <select
                value={reminder.repeat}
                onChange={e => setReminder(prev => ({ ...prev, repeat: e.target.value as any }))}
                className={cn(
                  "px-3 py-1.5 bg-white border outline-none text-sm font-medium",
                  theme === 'rose' ? "border-rose-100 rounded-lg" : "border-slate-200 rounded-md"
                )}
              >
                <option value="once">仅一次</option>
                <option value="daily">每天</option>
                <option value="weekdays">工作日</option>
                <option value="weekly">每周</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className={cn(
            "block text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2",
            theme === 'rose' ? "text-rose-300" : "text-slate-400"
          )}>
            <Paperclip className="w-3.5 h-3.5" /> 附件管理
          </label>
          <div className="space-y-3">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map(att => (
                  <div key={att.id} className={cn(
                    "group flex items-center gap-2 px-2.5 py-1.5 border text-xs font-medium",
                    theme === 'rose' 
                      ? "bg-rose-50 text-rose-700 rounded-lg border-rose-100" 
                      : "bg-slate-100 text-slate-700 rounded-md border-slate-200"
                  )}>
                    <span className="max-w-[120px] truncate">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className={cn(
                        "p-0.5 rounded transition-colors",
                        theme === 'rose' ? "hover:bg-rose-100 text-rose-300 hover:text-rose-600" : "hover:bg-slate-200 text-slate-400 hover:text-red-500"
                      )}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className={cn(
              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed cursor-pointer transition-all group",
              theme === 'rose' 
                ? "border-rose-100 rounded-2xl hover:border-rose-400 hover:bg-rose-50/50" 
                : "border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50"
            )}>
              <div className={cn(
                "flex flex-col items-center",
                theme === 'rose' ? "text-rose-300 group-hover:text-rose-500" : "text-slate-400 group-hover:text-indigo-600"
              )}>
                <Paperclip className="w-5 h-5 mb-1.5 group-hover:rotate-12 transition-transform" />
                <span className="text-[11px] font-bold uppercase tracking-wider">点击或拖拽上传</span>
              </div>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </div>

      <div className={cn("flex gap-3 pt-6 border-t", theme === 'rose' ? "border-rose-50" : "border-slate-100")}>
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "flex-1 px-4 py-2.5 text-sm font-bold border transition-colors",
            theme === 'rose' ? "text-rose-400 bg-rose-50 border-rose-100 rounded-xl hover:bg-rose-100" : "text-slate-600 bg-slate-50 border-slate-200 rounded-lg hover:bg-slate-100"
          )}
        >
          取消
        </button>
        <button
          type="submit"
          className={cn(
            "flex-1 px-4 py-2.5 text-white text-sm font-bold shadow-lg transition-all active:scale-[0.98]",
            theme === 'rose' ? "bg-rose-400 rounded-xl shadow-rose-100 hover:bg-rose-500" : "bg-indigo-600 rounded-lg shadow-indigo-100 hover:bg-indigo-700"
          )}
        >
          保存计划
        </button>
      </div>
    </form>
  );
}
