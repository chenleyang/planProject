import React, { useState, ChangeEvent } from 'react';
import { Plan } from '../types';
import { FileUp, Info, AlertCircle, Clipboard } from 'lucide-react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface ImportModalProps {
  onImport: (plans: Plan[]) => void;
  theme: 'classic' | 'rose';
  onCancel: () => void;
}

type ImportMode = 'file' | 'smart';

export function ImportModal({ onImport, theme, onCancel }: ImportModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportMode>('file');
  const [smartText, setSmartText] = useState('');

  const parseSmartContent = (text: string): Plan[] => {
    const plans: Plan[] = [];
    const lines = text.split('\n');
    const currentYear = 2026;

    lines.forEach(line => {
      // Look for markdown table rows with date format like "9 月 2 日" or "10 月 24 日"
      const match = line.match(/\|\s*(\d+)\s*[月\-]\s*(\d+)\s*[日]?\s*\|\s*([^|]+)\|\s*([^|]+)\|/);
      if (match) {
        const [_, month, day, topic, task] = match;
        const formattedDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        plans.push({
          id: Math.random().toString(36).substr(2, 9),
          title: topic.trim().substring(0, 50),
          content: `学习内容: ${topic.trim()}\n任务: ${task.trim()}`,
          date: formattedDate,
          time: '09:00',
          isCompleted: false,
          attachments: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    });

    return plans;
  };

  const handleSmartImport = () => {
    if (!smartText.trim()) {
      setError('请输入内容');
      return;
    }
    const imported = parseSmartContent(smartText);
    if (imported.length === 0) {
      setError('未能识别到有效的计划表格，请确保粘贴了完整的表格内容');
    } else {
      onImport(imported);
    }
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      const extension = file.name.split('.').pop()?.toLowerCase();

      try {
        if (extension === 'csv') {
          Papa.parse(content, {
            header: true,
            complete: (results) => {
              const importedPlans = results.data.map((row: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: row.title || row.名称 || '未命名计划',
                content: row.content || row.内容 || '',
                date: row.date || row.日期 || format(new Date(), 'yyyy-MM-dd'),
                time: row.time || row.时间 || '09:00',
                isCompleted: false,
                attachments: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
              })).filter((p: any) => p.title);
              onImport(importedPlans as Plan[]);
            },
            error: (err) => setError('CSV解析失败: ' + err.message)
          });
        } else if (extension === 'txt') {
          const lines = content.split('\n');
          const importedPlans = lines.map(line => {
            const [title, content, date, time] = line.split('|').map(s => s.trim());
            if (!title) return null;
            return {
              id: Math.random().toString(36).substr(2, 9),
              title,
              content: content || '',
              date: date || format(new Date(), 'yyyy-MM-dd'),
              time: time || '09:00',
              isCompleted: false,
              attachments: [],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
          }).filter((p): p is Plan => p !== null);
          onImport(importedPlans);
        } else {
          setError('仅支持 .csv 或 .txt 文件');
        }
      } catch (err) {
        setError('导入出错，请检查文件格式');
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-slate-100 rounded-lg">
        <button 
          onClick={() => setMode('file')}
          className={cn(
            "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
            mode === 'file' 
              ? (theme === 'rose' ? "bg-white text-rose-500 shadow-sm" : "bg-white text-indigo-600 shadow-sm") 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          文件上传
        </button>
        <button 
          onClick={() => setMode('smart')}
          className={cn(
            "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
            mode === 'smart' 
              ? (theme === 'rose' ? "bg-white text-rose-500 shadow-sm" : "bg-white text-indigo-600 shadow-sm") 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          智能粘贴
        </button>
      </div>

      {mode === 'file' ? (
        <div className="space-y-6">
          <div className={cn(
            "p-4 border flex gap-3 transition-colors",
            theme === 'rose' ? "bg-rose-50/50 rounded-2xl border-rose-100" : "bg-indigo-50/50 rounded-xl border-indigo-100"
          )}>
            <Info className={cn("w-5 h-5 shrink-0 mt-0.5", theme === 'rose' ? "text-rose-400" : "text-indigo-500")} />
            <div className={cn("text-sm", theme === 'rose' ? "text-rose-900/70" : "text-indigo-900/70")}>
              <p className={cn("font-bold mb-1", theme === 'rose' ? "text-rose-900" : "text-indigo-900")}>文件格式说明：</p>
              <ul className="list-disc list-inside space-y-1 text-xs leading-relaxed">
                <li><span className="font-bold">CSV：</span>需包含标题行 (title, content, date, time)</li>
                <li><span className="font-bold">TXT：</span>格式为 "名称 | 内容 | 日期 | 时间" (每行一个)</li>
              </ul>
            </div>
          </div>

          <label className={cn(
            "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed cursor-pointer transition-all group",
            theme === 'rose' 
              ? "border-rose-100 rounded-2xl hover:border-rose-400 hover:bg-rose-50/50" 
              : "border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50"
          )}>
            <div className={cn(
              "flex flex-col items-center",
              theme === 'rose' ? "text-rose-300 group-hover:text-rose-500" : "text-slate-400 group-hover:text-indigo-600"
            )}>
              <FileUp className="w-8 h-8 mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-wider">选择数据文件</span>
              <span className="text-[10px] mt-1 font-medium">支持 CSV, TXT 格式</span>
            </div>
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={cn(
            "p-4 border flex gap-3 transition-colors",
            theme === 'rose' ? "bg-rose-50/50 rounded-2xl border-rose-100" : "bg-indigo-50/50 rounded-xl border-indigo-100"
          )}>
            <Info className={cn("w-5 h-5 shrink-0 mt-0.5", theme === 'rose' ? "text-rose-400" : "text-indigo-500")} />
            <div className={cn("text-sm", theme === 'rose' ? "text-rose-900/70" : "text-indigo-900/70")}>
              <p className={cn("font-bold mb-1", theme === 'rose' ? "text-rose-900" : "text-indigo-900")}>智能解析说明：</p>
              <p className="text-xs leading-relaxed">
                您可以直接将包含日期和任务的表格文本粘贴到下方，系统将自动识别日期并为您排期。
              </p>
            </div>
          </div>
          
          <textarea
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            placeholder="在此处粘贴您的计划表格..."
            className={cn(
              "w-full h-48 px-4 py-3 bg-slate-50 border outline-none transition-all resize-none text-xs font-medium leading-relaxed",
              theme === 'rose' 
                ? "border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400" 
                : "border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            )}
          />

          <button
            onClick={handleSmartImport}
            className={cn(
              "w-full py-3 text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98]",
              theme === 'rose' ? "bg-rose-400 rounded-2xl shadow-rose-100 hover:bg-rose-500" : "bg-indigo-600 rounded-xl shadow-indigo-100 hover:bg-indigo-700"
            )}
          >
            开始智能导入
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 uppercase tracking-wide">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className={cn("flex gap-3 pt-2", theme === 'rose' ? "border-rose-50" : "border-slate-100")}>
        <button
          onClick={onCancel}
          className={cn(
            "flex-1 px-4 py-2.5 text-sm font-bold border transition-colors",
            theme === 'rose' ? "text-rose-400 bg-rose-50 border-rose-100 rounded-xl hover:bg-rose-100" : "text-slate-600 bg-slate-50 border-slate-200 rounded-lg hover:bg-slate-100"
          )}
        >
          取消
        </button>
      </div>
    </div>
  );
}
