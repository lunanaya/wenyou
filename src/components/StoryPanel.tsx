import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Trash2, ChevronDown, ChevronUp, Copy, Check, RefreshCw, Brain } from "lucide-react";
import { ApiMode, AppSettings, StoryOption, WorldInfoEntry } from '../types';
import { generateOptions, filterRelevantMemories } from '../lib/gemini';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface StoryPanelProps {
  settings: AppSettings;
}

export function StoryPanel({ settings }: StoryPanelProps) {
  const [context, setContext] = useState('');
  const [purpose, setPurpose] = useState('');
  const [options, setOptions] = useState<StoryOption[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<Record<ApiMode, boolean>>({
    user_plan: false,
    side_quest: false,
    main_story: false,
  });
  const [isCapturing, setIsCapturing] = useState(false);

  const fetchSillyTavernContext = async () => {
    if (!settings.stApi.enabled) return null;
    setIsCapturing(true);
    try {
      const response = await fetch(`${settings.stApi.baseUrl}/api/chats/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.stApi.apiKey ? { 'X-API-Key': settings.stApi.apiKey } : {})
        },
        body: JSON.stringify({ chat_id: 'current' })
      });
      
      if (response.ok) {
        const data = await response.json();
        const messages = data.chat || [];
        const formatted = messages.slice(-15).map((m: any) => `${m.name}: ${m.mes}`).join('\n');
        setContext(formatted);
        return formatted;
      }
      return null;
    } catch (error) {
      console.error('ST API Error:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const handleGenerate = useCallback(async (mode: ApiMode) => {
    setIsLoading(prev => ({ ...prev, [mode]: true }));
    try {
      let currentContext = context;
      if (settings.stApi.enabled && settings.stApi.autoSync) {
        const fetched = await fetchSillyTavernContext();
        if (fetched) currentContext = fetched;
      }

      if (!currentContext.trim()) {
        alert('未检测到有效上下文，请确保酒馆已连接或手动同步。');
        return;
      }

      const config = settings.configs[mode];
      if (!config.isActive) return;

      // Fetch selected World Info entries content
      let selectedWorldInfo: WorldInfoEntry[] = [];
      if (settings.stApi.enabled && settings.selectedBook && settings.selectedEntries.length > 0) {
        try {
          const response = await fetch(`${settings.stApi.baseUrl}/api/worldinfo/get`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(settings.stApi.apiKey ? { 'X-API-Key': settings.stApi.apiKey } : {})
            },
            body: JSON.stringify({ name: settings.selectedBook })
          });
          if (response.ok) {
            const data = await response.json();
            const rawEntries = data.entries || {};
            selectedWorldInfo = Object.values(rawEntries)
              .filter((e: any) => settings.selectedEntries.includes(e.uid))
              .map((e: any) => ({
                uid: e.uid,
                key: e.key || [],
                content: e.content || '',
                isActive: true
              }));
          }
        } catch (e) {
          console.error('Failed to fetch WI for generation:', e);
        }
      }

      const newOptions = await generateOptions(
        currentContext, 
        config, 
        settings.apiConfig,
        selectedWorldInfo,
        purpose
      );
      
      setOptions(prev => {
        const filtered = prev.filter(opt => opt.mode !== mode);
        return [...filtered, ...newOptions];
      });
    } catch (error) {
      console.error(`Failed to generate ${mode} options:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [mode]: false }));
    }
  }, [context, settings, purpose]);

  const handleSelectOption = (option: StoryOption) => {
    copyToClipboard(option.description, option.id);
    alert('已复制选项内容，请粘贴回酒馆。');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearOptions = () => {
    setOptions([]);
    setExpandedId(null);
  };

  const removeOption = (id: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="flex flex-col gap-6 h-full max-w-md mx-auto">
      {/* Generation Controls */}
      <div className="space-y-4">
        <Card className="border-amber-100 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              意图引导 (可选)
            </CardTitle>
            <CardDescription className="text-[10px]">
              输入您接下来的目的或期望走向，留空则由 AI 随机发挥。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Input
              className="h-9 text-sm border-amber-100 focus-visible:ring-amber-400"
              placeholder="例如：寻找破局线索 / 搞钱 / 调查某事"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-2">
          {(['user_plan', 'side_quest', 'main_story'] as ApiMode[]).map((mode) => (
            <Button
              key={mode}
              variant="outline"
              className={cn(
                "justify-start h-11 px-4 border-dashed hover:border-solid transition-all bg-white/50 relative overflow-hidden group",
                settings.configs[mode].isActive ? "opacity-100" : "opacity-50 pointer-events-none"
              )}
              onClick={() => handleGenerate(mode)}
              disabled={isLoading[mode] || (settings.stApi.enabled && isCapturing)}
            >
              {isLoading[mode] ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-sm font-medium">{settings.configs[mode].name}</span>
              {isLoading[mode] && (
                <motion.div 
                  className="absolute bottom-0 left-0 h-0.5 bg-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">生成结果</h3>
            {options.length > 0 && (
              <Badge variant="secondary" className="text-[8px] h-4 px-1 bg-amber-100 text-amber-700 border-none">
                {options.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCapturing && (
              <Badge variant="outline" className="text-[8px] animate-pulse border-amber-200 text-amber-600">
                正在同步酒馆...
              </Badge>
            )}
            {options.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 text-[9px] text-muted-foreground hover:text-red-500 p-0"
                onClick={clearOptions}
              >
                清空全部
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 -mr-2 pr-2">
          <div className="space-y-3 pb-4">
            {options.length === 0 && !Object.values(isLoading).some(Boolean) && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-white/40">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">点击上方按钮开始织梦</p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {options.map((option) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <Card
                    className={cn(
                      "group overflow-hidden transition-all duration-300 bg-white border-amber-100",
                      expandedId === option.id ? "ring-1 ring-amber-400 shadow-md" : "hover:border-amber-300 hover:shadow-sm"
                    )}
                  >
                    <div 
                      className={cn(
                        "p-3 cursor-pointer flex items-center justify-between transition-colors",
                        expandedId === option.id ? "bg-amber-50/30" : "hover:bg-amber-50/10"
                      )}
                      onClick={() => setExpandedId(expandedId === option.id ? null : option.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          option.mode === 'user_plan' ? "bg-blue-400" : 
                          option.mode === 'side_quest' ? "bg-green-400" : "bg-purple-400"
                        )} />
                        <CardTitle className="text-xs font-bold truncate leading-tight">
                          {option.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] px-1 py-0 uppercase tracking-tighter shrink-0 border-amber-100 text-amber-600 bg-amber-50/50">
                          {settings.configs[option.mode].name.slice(0, 2)}
                        </Badge>
                        {expandedId === option.id ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedId === option.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <CardContent className="p-3 pt-0 space-y-3">
                            <div className="p-3 rounded-lg bg-slate-50 text-[11px] leading-relaxed text-slate-700 border border-slate-100 whitespace-pre-wrap font-medium">
                              {option.description}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 font-bold shadow-sm"
                                onClick={() => handleSelectOption(option)}
                              >
                                {copiedId === option.id ? '已复制！' : '复制并粘贴'}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-8 w-8 border-amber-100 hover:bg-amber-50"
                                onClick={() => removeOption(option.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
                              </Button>
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {Object.values(isLoading).some(Boolean) && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="relative">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  <Sparkles className="h-3 w-3 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <p className="text-[10px] font-medium text-amber-700/70 animate-pulse tracking-wide">
                  AI 正在为您编织无限可能...
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
