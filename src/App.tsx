import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, BookOpen, ScrollText, BrainCircuit } from "lucide-react";
import { StoryPanel } from './components/StoryPanel';
import { Settings } from './components/Settings';
import { WorldInfo } from './components/WorldInfo';
import { AppSettings, DEFAULT_CONFIGS } from './types';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'tavern_story_weaver_settings';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          selectedBook: parsed.selectedBook || '',
          selectedEntries: parsed.selectedEntries || [],
          apiConfig: parsed.apiConfig || {
            apiKey: '',
            model: 'gemini-3-flash-preview'
          },
          stApi: parsed.stApi || {
            enabled: false,
            baseUrl: 'http://localhost:8000',
            apiKey: '',
            autoSync: true
          },
          configs: {
            ...DEFAULT_CONFIGS,
            ...parsed.configs
          }
        };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return { 
      selectedBook: '',
      selectedEntries: [],
      apiConfig: {
        apiKey: '',
        model: 'gemini-3-flash-preview'
      },
      configs: DEFAULT_CONFIGS,
      stApi: {
        enabled: false,
        baseUrl: 'http://localhost:8000',
        apiKey: '',
        autoSync: true
      }
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-900 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Compact Header */}
        <header className="shrink-0 border-b border-amber-100 bg-white/80 backdrop-blur-md z-10 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 p-1 rounded-lg">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-amber-900">Tavern Weaver</h1>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              settings.stApi.enabled ? "bg-green-500 animate-pulse" : "bg-amber-500"
            )} />
            <span className="text-[10px] font-medium text-muted-foreground">
              {settings.stApi.enabled ? "已连接" : "离线"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <Tabs defaultValue="story" className="h-full flex flex-col">
            <div className="shrink-0 px-4 pt-2 bg-white/40">
              <TabsList className="grid w-full grid-cols-3 h-9 bg-amber-100/50 p-1">
                <TabsTrigger value="story" className="text-[10px] py-1">
                  <ScrollText className="h-3 w-3 mr-1" />
                  生成
                </TabsTrigger>
                <TabsTrigger value="world_info" className="text-[10px] py-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  世界书
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-[10px] py-1">
                  <SettingsIcon className="h-3 w-3 mr-1" />
                  设置
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden px-3 py-4">
              <TabsContent value="story" className="h-full mt-0 focus-visible:ring-0">
                <StoryPanel settings={settings} />
              </TabsContent>
              <TabsContent value="world_info" className="h-full mt-0 focus-visible:ring-0">
                <WorldInfo settings={settings} onUpdate={setSettings} />
              </TabsContent>
              <TabsContent value="settings" className="h-full mt-0 focus-visible:ring-0">
                <Settings settings={settings} onUpdate={setSettings} />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

