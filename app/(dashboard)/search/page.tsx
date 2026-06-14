'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  FaSearch,
  FaTimes,
  FaCalendarAlt,
  FaFilter,
  FaArrowRight,
  FaSpinner,
  FaYoutube,
  FaUpload,
  FaLink,
  FaFileAlt
} from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  title: string;
  status: string;
  sourceType: 'upload' | 'youtube' | 'url';
  language: string | null;
  durationSeconds: number | null;
  wordCount: number | null;
  createdAt: string;
  excerpt: string;
}

const LANGUAGES = [
  { value: '', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

const SOURCES = [
  { value: '', label: 'All Sources' },
  { value: 'upload', label: 'File Uploads' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'url', label: 'Direct URL' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // '7days', '30days', ''

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = useCallback(async (q: string, lang: string, src: string, date: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (lang) params.append('language', lang);
      if (src) params.append('source', src);

      if (date === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.append('dateFrom', d.toISOString());
      } else if (date === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.append('dateFrom', d.toISOString());
      }

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();
      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, langFilter, sourceFilter, dateFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, langFilter, sourceFilter, dateFilter, performSearch]);

  const sourceIcon = (type: string) => {
    if (type === 'youtube') return <FaYoutube className="text-red-500" />;
    if (type === 'url') return <FaLink className="text-blue-400" />;
    return <FaUpload className="text-cyan-400" />;
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-heading font-bold tracking-tight text-foreground mb-1">Search Database</h2>
        <p className="text-sm text-muted-foreground">Perform global search across transcript titles, contents, and summaries.</p>
      </div>

      {/* Input panel */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <FaSearch size={14} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type keywords (e.g. 'analytics', 'marketing update')..."
            className="w-full h-12 pl-11 pr-10 rounded-xl border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-[10px] text-muted-foreground" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-border bg-muted/50 text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-muted/50 text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <FaCalendarAlt className="text-[10px] text-muted-foreground" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-border bg-muted/50 text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">Any Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card border border-border rounded-2xl">
            <FaSpinner className="animate-spin text-primary text-xl" />
            <p className="text-xs text-muted-foreground font-semibold">Searching database...</p>
          </div>
        ) : query.trim().length < 2 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-2xl bg-card">
            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4 text-muted-foreground">
              <FaSearch size={20} />
            </div>
            <p className="font-semibold text-foreground mb-1">Enter search term</p>
            <p className="text-xs text-muted-foreground">Type at least 2 characters to start searching</p>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-2xl bg-card">
            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4 text-muted-foreground animate-pulse">
              <FaSearch size={20} />
            </div>
            <p className="font-semibold text-foreground mb-1">No results found</p>
            <p className="text-xs text-muted-foreground">Try modifying your query or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              Search Results ({results.length})
            </p>
            <div className="space-y-3">
              {results.map((res) => (
                <Link
                  key={res.id}
                  href={`/transcripts/${res.id}`}
                  className="group flex flex-col gap-3 p-5 rounded-2xl border border-border hover:border-primary/30 bg-card hover:bg-muted/10 transition duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center text-xs flex-shrink-0">
                        {sourceIcon(res.sourceType)}
                      </span>
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition truncate">
                        {highlightText(res.title, query)}
                      </p>
                    </div>
                    <Badge variant={res.status as any} className="text-[9px] py-0.5">
                      {res.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pl-1 whitespace-pre-wrap select-text">
                    {highlightText(res.excerpt, query)}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-3">
                    <div className="flex items-center gap-3">
                      {res.language && <span className="font-semibold uppercase">{res.language}</span>}
                      {res.durationSeconds && (
                        <span>
                          {Math.floor(res.durationSeconds / 60)}m {res.durationSeconds % 60}s
                        </span>
                      )}
                      {res.wordCount && <span>{res.wordCount.toLocaleString()} words</span>}
                      <span>{new Date(res.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="flex items-center gap-1 text-primary group-hover:underline font-semibold">
                      Open <FaArrowRight size={8} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
