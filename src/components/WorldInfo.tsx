import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, RefreshCw, CheckCircle2, Circle } from "lucide-react";
import { WorldInfoEntry, AppSettings } from '../types';
import { cn } from '@/lib/utils';

interface WorldInfoProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
}

export function WorldInfo({ settings, onUpdate }: WorldInfoProps) {
  const [books, setBooks] = useState<string[]>([]);
  const [entries, setEntries] = useState<WorldInfoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBooks = useCallback(async () => {
    if (!settings.stApi.enabled) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${settings.stApi.baseUrl}/api/worldinfo/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.stApi.apiKey ? { 'X-API-Key': settings.stApi.apiKey } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBooks(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setIsLoading(false);
    }
  }, [settings.stApi]);

  const fetchEntries = useCallback(async (bookName: string) => {
    if (!settings.stApi.enabled || !bookName) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${settings.stApi.baseUrl}/api/worldinfo/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.stApi.apiKey ? { 'X-API-Key': settings.stApi.apiKey } : {})
        },
        body: JSON.stringify({ name: bookName })
      });
      if (response.ok) {
        const data = await response.json();
        // SillyTavern WI entries are usually in data.entries
        const rawEntries = data.entries || {};
        const formatted: WorldInfoEntry[] = Object.values(rawEntries).map((e: any) => ({
          uid: e.uid,
          key: e.key || [],
          content: e.content || '',
          comment: e.comment || '',
          isActive: true
        }));
        setEntries(formatted);
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [settings.stApi]);

  useEffect(() => {
    if (settings.stApi.enabled) {
      fetchBooks();
    }
  }, [settings.stApi.enabled, fetchBooks]);

  useEffect(() => {
    if (settings.selectedBook) {
      fetchEntries(settings.selectedBook);
    }
  }, [settings.selectedBook, fetchEntries]);

  const toggleEntrySelection = (uid: number) => {
    const isSelected = settings.selectedEntries.includes(uid);
    const newSelected = isSelected 
      ? settings.selectedEntries.filter(id => id !== uid)
      : [...settings.selectedEntries, uid];
    
    onUpdate({
      ...settings,
      selectedEntries: newSelected
    });
  };

  const handleBookSelect = (book: string) => {
    onUpdate({
      ...settings,
      selectedBook: book,
      selectedEntries: [] // Reset selection when book changes
    });
  };

  return (
    <ScrollArea className="h-full -mr-3 pr-3">
      <div className="space-y-6 pb-8">
        {/* Book Selection */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold">选择世界书</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={fetchBooks}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
          </div>
          
          {!settings.stApi.enabled ? (
            <Card className="border-dashed border-amber-200 bg-amber-50/20">
              <CardContent className="p-6 text-center">
                <p className="text-xs text-muted-foreground">请先在设置中启用酒馆 API 联动</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {books.map((book) => (
                <Button
                  key={book}
                  variant={settings.selectedBook === book ? "default" : "outline"}
                  className={cn(
                    "h-9 text-xs justify-start px-3 truncate",
                    settings.selectedBook === book ? "bg-amber-600 hover:bg-amber-700" : "border-amber-100"
                  )}
                  onClick={() => handleBookSelect(book)}
                >
                  {book}
                </Button>
              ))}
            </div>
          )}
        </section>

        {/* Entry Selection */}
        {settings.selectedBook && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold">选择条目</h3>
              </div>
              <Badge variant="outline" className="text-[9px] border-amber-200">
                已选 {settings.selectedEntries.length} 条
              </Badge>
            </div>

            <div className="space-y-2">
              {entries.length === 0 && !isLoading ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-white/40">
                  <p className="text-xs">该世界书暂无条目</p>
                </div>
              ) : (
                entries.map((entry) => {
                  const isSelected = settings.selectedEntries.includes(entry.uid);
                  return (
                    <Card 
                      key={entry.uid} 
                      className={cn(
                        "border-amber-100 cursor-pointer transition-all hover:border-amber-300",
                        isSelected ? "bg-amber-50/50 ring-1 ring-amber-400" : "bg-white"
                      )}
                      onClick={() => toggleEntrySelection(entry.uid)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-amber-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold truncate">
                                {entry.key.join(', ') || '无关键词'}
                              </span>
                              {entry.comment && (
                                <span className="text-[9px] text-muted-foreground truncate italic">
                                  ({entry.comment})
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {entry.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}


