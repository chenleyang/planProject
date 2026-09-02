import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  GripVertical,
  Save,
  Type,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ProgressBlock } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ProgressEditorProps {
  initialBlocks?: ProgressBlock[];
  theme: 'classic' | 'rose';
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onSave: (blocks: ProgressBlock[]) => void;
  onCancel: () => void;
}

export function ProgressEditor({ 
  initialBlocks = [], 
  theme, 
  isFullscreen,
  onToggleFullscreen,
  onSave, 
  onCancel 
}: ProgressEditorProps) {
  // Ensure we have at least one text block if empty
  const [blocks, setBlocks] = useState<ProgressBlock[]>(
    initialBlocks.length > 0 
      ? initialBlocks 
      : [{ id: Math.random().toString(36).substr(2, 9), type: 'text', content: '' }]
  );

  const addBlock = (type: 'text' | 'image', content: string = '', index?: number) => {
    const newBlock: ProgressBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content
    };
    
    setBlocks(prev => {
      const next = [...prev];
      if (typeof index === 'number') {
        next.splice(index + 1, 0, newBlock);
      } else {
        next.push(newBlock);
      }
      return next;
    });
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => {
      if (prev.length === 1 && prev[0].type === 'text') return [{ ...prev[0], content: '' }];
      return prev.filter(b => b.id !== id);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addBlock('image', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent, blockIndex: number) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            
            // Split current text block if pasting into it
            const currentBlock = blocks[blockIndex];
            if (currentBlock.type === 'text') {
              const selectionStart = (e.target as HTMLTextAreaElement).selectionStart;
              const textBefore = currentBlock.content.substring(0, selectionStart);
              const textAfter = currentBlock.content.substring(selectionStart);

              setBlocks(prev => {
                const next = [...prev];
                // Update current block to textBefore
                next[blockIndex] = { ...currentBlock, content: textBefore };
                // Insert image block
                next.splice(blockIndex + 1, 0, { id: Math.random().toString(36).substr(2, 9), type: 'image', content: base64 });
                // Insert new text block with textAfter
                next.splice(blockIndex + 2, 0, { id: Math.random().toString(36).substr(2, 9), type: 'text', content: textAfter });
                return next;
              });
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-white transition-all duration-300",
      isFullscreen ? "h-full" : "h-[750px]"
    )}>
      {/* Toolbar */}
      <div className={cn(
        "p-3 border-b flex items-center justify-between transition-colors",
        theme === 'rose' ? "border-rose-50 bg-rose-50/30" : "border-slate-100 bg-slate-50"
      )}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addBlock('text')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 bg-white border transition-all shadow-sm text-xs font-bold",
              theme === 'rose' ? "rounded-xl border-rose-100 text-rose-600 hover:text-rose-700 hover:border-rose-200" : "rounded-lg border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200"
            )}
          >
            <Type className={cn("w-3.5 h-3.5", theme === 'rose' ? "text-rose-400" : "text-slate-400")} />
            添加文字段落
          </button>
          <label className={cn(
            "flex items-center gap-2 px-3 py-1.5 bg-white border transition-all text-xs font-bold shadow-sm cursor-pointer",
            theme === 'rose' ? "rounded-xl border-rose-100 text-rose-600 hover:text-rose-700 hover:border-rose-200" : "rounded-lg border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200"
          )}>
            <ImageIcon className={cn("w-3.5 h-3.5", theme === 'rose' ? "text-rose-400" : "text-slate-400")} />
            插入图片
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <button
            onClick={onToggleFullscreen}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 bg-white border transition-all shadow-sm text-xs font-bold",
              theme === 'rose' ? "rounded-xl border-rose-100 text-rose-600 hover:text-rose-700 hover:border-rose-200" : "rounded-lg border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200"
            )}
            title={isFullscreen ? "退出全屏" : "全屏编辑"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isFullscreen ? "退出全屏" : "全屏模式"}
          </button>
        </div>
        <div className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          theme === 'rose' ? "text-rose-300" : "text-slate-400"
        )}>
          混合编排模式
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {blocks.map((block, idx) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative group p-1"
            >
              {/* Action Buttons - Top Right for clarity */}
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20 scale-90 group-hover:scale-100">
                <button 
                  onClick={() => removeBlock(block.id)}
                  className={cn(
                    "p-2 shadow-lg hover:scale-110 transition-all",
                    theme === 'rose' ? "bg-rose-500 text-white rounded-xl" : "bg-red-500 text-white rounded-lg"
                  )}
                  title="删除此项"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className={cn(
                  "p-2 cursor-grab active:cursor-grabbing shadow-lg border",
                  theme === 'rose' ? "bg-white text-rose-300 rounded-xl border-rose-100" : "bg-white text-slate-400 rounded-lg border-slate-200"
                )}>
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="w-full">
                {block.type === 'text' ? (
                  <AutoResizeTextarea
                    value={block.content}
                    onChange={(val) => updateBlock(block.id, val)}
                    onPaste={(e) => handlePaste(e, idx)}
                    placeholder="在此输入内容... 支持 Markdown"
                  />
                ) : (
                  <div className={cn(
                    "relative overflow-hidden border shadow-sm transition-colors",
                    theme === 'rose' ? "rounded-2xl border-rose-100 bg-rose-50/10" : "rounded-xl border-slate-100 bg-slate-50/50"
                  )}>
                    <img 
                      src={block.content} 
                      alt="" 
                      className="w-full h-auto max-h-[400px] object-contain block mx-auto" 
                    />
                    <div className={cn("absolute inset-0 transition-colors pointer-events-none opacity-20", theme === 'rose' ? "bg-rose-400/0 hover:bg-rose-400/5" : "bg-indigo-400/0 hover:bg-indigo-400/5")} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Floating Add Button at the end */}
        <div className="flex justify-center pt-4 opacity-0 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => addBlock('text')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border border-dashed text-xs font-bold transition-all",
              theme === 'rose' 
                ? "bg-rose-50/50 text-rose-300 hover:text-rose-500 hover:bg-rose-50 border-rose-100 rounded-xl" 
                : "bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200 rounded-lg"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            点击添加更多内容
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t flex gap-3 transition-colors",
        theme === 'rose' ? "border-rose-50 bg-rose-50/30" : "border-slate-100 bg-slate-50"
      )}>
        <button
          onClick={onCancel}
          className={cn(
            "flex-1 py-3 text-sm font-bold border transition-colors shadow-sm",
            theme === 'rose' ? "text-rose-400 bg-white border-rose-100 rounded-xl hover:bg-rose-50" : "text-slate-600 bg-white border-slate-200 rounded-lg hover:bg-slate-50"
          )}
        >
          取消
        </button>
        <button
          onClick={() => onSave(blocks)}
          className={cn(
            "flex-[2] py-3 text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2",
            theme === 'rose' ? "bg-rose-400 rounded-xl shadow-rose-100 hover:bg-rose-500" : "bg-indigo-600 rounded-lg shadow-indigo-100 hover:bg-indigo-700"
          )}
        >
          <Save className="w-4 h-4" />
          保存完整进展
        </button>
      </div>
    </div>
  );
}

function AutoResizeTextarea({ 
  value, 
  onChange, 
  onPaste,
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  onPaste: (e: React.ClipboardEvent) => void;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onPaste={onPaste}
      placeholder={placeholder}
      className="w-full outline-none resize-none text-base font-medium leading-relaxed text-slate-700 placeholder:text-slate-300 min-h-[1.5em] bg-transparent"
      rows={1}
    />
  );
}
