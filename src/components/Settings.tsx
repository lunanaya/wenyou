import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Globe, RefreshCw, Sparkles } from "lucide-react";
import { ApiConfig, ApiMode, AppSettings, DEFAULT_CONFIGS } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
}

export function Settings({ settings, onUpdate }: SettingsProps) {
  const handleConfigChange = (mode: ApiMode, field: keyof ApiConfig, value: any) => {
    onUpdate({
      ...settings,
      configs: {
        ...settings.configs,
        [mode]: {
          ...settings.configs[mode],
          [field]: value,
        },
      },
    });
  };

  const resetToDefault = (mode: ApiMode) => {
    onUpdate({
      ...settings,
      configs: {
        ...settings.configs,
        [mode]: DEFAULT_CONFIGS[mode],
      },
    });
  };

  return (
    <ScrollArea className="h-full -mr-3 pr-3">
      <div className="space-y-6 pb-8">
        {/* Global API Config */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold">API 全局配置</h3>
          </div>
          <Card className="border-amber-100">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px]">Gemini API Key</Label>
                <Input
                  type="password"
                  className="h-8 text-xs"
                  placeholder="留空则使用系统默认 Key"
                  value={settings.apiConfig.apiKey}
                  onChange={(e) => onUpdate({
                    ...settings,
                    apiConfig: { ...settings.apiConfig, apiKey: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">模型名称</Label>
                <Input
                  className="h-8 text-xs"
                  value={settings.apiConfig.model}
                  onChange={(e) => onUpdate({
                    ...settings,
                    apiConfig: { ...settings.apiConfig, model: e.target.value }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SillyTavern API */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <RefreshCw className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold">酒馆联动设置</h3>
          </div>
          <Card className="border-amber-100">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs">启用 API 联动</Label>
                  <p className="text-[10px] text-muted-foreground">允许从酒馆抓取上下文</p>
                </div>
                <Switch
                  checked={settings.stApi.enabled}
                  onCheckedChange={(checked) => onUpdate({
                    ...settings,
                    stApi: { ...settings.stApi, enabled: checked }
                  })}
                />
              </div>

              {settings.stApi.enabled && (
                <div className="space-y-3 pt-2 border-t border-amber-50">
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">API 地址</Label>
                    <Input
                      className="h-8 text-xs"
                      value={settings.stApi.baseUrl}
                      onChange={(e) => onUpdate({
                        ...settings,
                        stApi: { ...settings.stApi, baseUrl: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">API Key (可选)</Label>
                    <Input
                      type="password"
                      className="h-8 text-xs"
                      value={settings.stApi.apiKey}
                      onChange={(e) => onUpdate({
                        ...settings,
                        stApi: { ...settings.stApi, apiKey: e.target.value }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px]">自动同步上下文</Label>
                    <Switch
                      checked={settings.stApi.autoSync}
                      onCheckedChange={(checked) => onUpdate({
                        ...settings,
                        stApi: { ...settings.stApi, autoSync: checked }
                      })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Mode Configs */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Globe className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold">生成模式配置</h3>
          </div>
          
          {(['user_plan', 'side_quest', 'main_story'] as ApiMode[]).map((mode) => (
            <Card key={mode} className="border-amber-100 overflow-hidden">
              <div className="bg-amber-50/50 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">{settings.configs[mode].name}</span>
                <Switch
                  checked={settings.configs[mode].isActive}
                  onCheckedChange={(checked) => handleConfigChange(mode, 'isActive', checked)}
                />
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px]">提示词模板</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 text-[9px] text-amber-600 hover:text-amber-700 p-0"
                      onClick={() => resetToDefault(mode)}
                    >
                      恢复默认
                    </Button>
                  </div>
                  <Textarea
                    className="min-h-[120px] text-[10px] leading-relaxed font-mono"
                    value={settings.configs[mode].promptTemplate}
                    onChange={(e) => handleConfigChange(mode, 'promptTemplate', e.target.value)}
                  />
                  <p className="text-[9px] text-muted-foreground">
                    使用 <code className="bg-amber-100 px-1 rounded text-amber-800">{"{{purpose}}"}</code> 代表您的意图引导。
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </ScrollArea>
  );
}

