'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import Navbar from '../../../components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Search, Send, ExternalLink, Bot, User, SlidersHorizontal, X, GraduationCap, Building2, Phone, Mail, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThesisResult {
  id: string;
  title: string;
  abstract_id: string;
  abstract_en: string;
  author: string;
  year: number;
  degree_type: string;
  division_name: string;
  division_code: string;
  eprint_url: string;
  subject_codes: string[];
  score?: number;
}

const FAKULTAS_OPTIONS = [
  { value: 'FIP',    label: 'FIP — Fakultas Ilmu Pendidikan' },
  { value: 'FPIPS',  label: 'FPIPS — Fak. Pendidikan Ilmu Pengetahuan Sosial' },
  { value: 'FPBS',   label: 'FPBS — Fak. Pendidikan Bahasa dan Sastra' },
  { value: 'FPMIPA', label: 'FPMIPA — Fak. Pendidikan MIPA' },
  { value: 'FPTK',   label: 'FPTK — Fak. Pendidikan Teknologi dan Kejuruan' },
  { value: 'FPOK',   label: 'FPOK — Fak. Pendidikan Olahraga dan Kesehatan' },
  { value: 'FPEB',   label: 'FPEB — Fak. Pendidikan Ekonomi dan Bisnis' },
  { value: 'FPSD',   label: 'FPSD — Fak. Pendidikan Seni dan Desain' },
];

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    let cleanLine = line;
    // Bold formatting: **text**
    cleanLine = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Headers
    if (cleanLine.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-base md:text-lg font-semibold mt-3 mb-1 text-foreground" dangerouslySetInnerHTML={{ __html: cleanLine.replace('### ', '') }} />
      );
    }
    if (cleanLine.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-lg md:text-xl font-bold mt-4 mb-2 text-foreground" dangerouslySetInnerHTML={{ __html: cleanLine.replace('## ', '') }} />
      );
    }
    if (cleanLine.startsWith('# ')) {
      return (
        <h1 key={idx} className="text-xl md:text-2xl font-bold mt-4 mb-2 text-foreground" dangerouslySetInnerHTML={{ __html: cleanLine.replace('# ', '') }} />
      );
    }

    // List items
    if (cleanLine.trim().startsWith('- ') || cleanLine.trim().startsWith('* ')) {
      const bulletContent = cleanLine.replace(/^[\s]*[-*]\s+/, '');
      return (
        <li key={idx} className="ml-4 list-disc pl-1 text-sm md:text-base leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: bulletContent }} />
      );
    }

    // Empty lines
    if (!cleanLine.trim()) {
      return <div key={idx} className="h-2" />;
    }

    // Normal paragraph
    return (
      <p key={idx} className="text-sm md:text-base leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: cleanLine }} />
    );
  });
}

// ponytail: extracted so desktop panel and mobile overlay share one implementation
function DetailContent({ result, onClose: _onClose }: { result: ThesisResult; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Show button when not scrolled to bottom
    const check = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 40);
    check();
    el.addEventListener('scroll', check);
    // Also re-check when content changes
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); };
  }, [result]);

  return (
    <div className="relative flex flex-col h-full">
      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll">
        <div className="p-5 space-y-5">
          {/* Score */}
          {result.score !== undefined && (
            <Badge variant="secondary" className="text-xs">
              Skor relevansi: {(result.score * 100).toFixed(1)}%
            </Badge>
          )}

          {/* Title */}
          <h2 className="text-base font-semibold leading-snug text-foreground">{result.title}</h2>

          {/* Meta — icon grid for consistent alignment */}
          <div className="grid grid-cols-[1rem_1fr] items-start gap-x-2.5 gap-y-2">
            <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm text-muted-foreground">{result.author}</span>

            <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm text-muted-foreground">{result.degree_type} · {result.year}</span>

            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm text-muted-foreground">{result.division_name}</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button size="sm" className="w-full justify-start gap-2 text-xs h-9" asChild>
              <a href={result.eprint_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span>Buka di Repositori UPI</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-9" asChild>
              <a
                href={`https://scholar.google.com/citations?hl=en&view_op=search_authors&mauthors=${encodeURIComponent(result.author)}&btnG=`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span>Cari Penulis di Google Scholar</span>
              </a>
            </Button>
          </div>

          {/* Subject codes */}
          {result.subject_codes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Kode Subjek</p>
              <div className="flex flex-wrap gap-1">
                {result.subject_codes.map((code, i) => (
                  <Badge key={i} variant="outline" className="text-xs px-1.5 py-0">{code}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Abstrak */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Abstrak</p>
            <p className="text-sm leading-relaxed text-foreground text-justify hyphens-auto">
              {result.abstract_id || result.abstract_en || '—'}
            </p>
            {result.abstract_id && result.abstract_en && (
              <>
                <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">Abstract (English)</p>
                <p className="text-sm leading-relaxed text-foreground text-justify hyphens-auto">
                  {result.abstract_en}
                </p>
              </>
            )}
          </div>

          <Separator />

          {/* Library contact */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">Perpustakaan Universitas Pendidikan Indonesia</p>
            <div className="grid grid-cols-[1rem_1fr] items-start gap-x-2.5 gap-y-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-xs text-muted-foreground">JL. Dr. Setiabudhi No. 229 Bandung 40154</span>

              <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-xs text-muted-foreground">022-2019487, 022-2013163 Pes. 4414–4416</span>

              <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <a href="https://wa.me/6285959999300" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                0859-5999-9300 (WhatsApp)
              </a>

              <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <a href="mailto:perpustakaan@upi.edu" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                perpustakaan@upi.edu
              </a>
            </div>
          </div>

          {/* bottom sentinel */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ponytail: scroll-down indicator — shown when content overflows */}
      {showScrollBtn && (
        <button
          onClick={() => scrollRef.current?.scrollBy({ top: 200, behavior: 'smooth' })}
          className="absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background border border-border shadow-md text-muted-foreground hover:text-foreground hover:shadow-lg transition-all animate-bounce"
          aria-label="Scroll ke bawah"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function SearchDashboard() {
  // Tab states
  const [activeTab, setActiveTab] = useState('semantic');

  // Semantic search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ThesisResult[]>([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [division, setDivision] = useState('');
  const [degreeType, setDegreeType] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // ponytail: client-side pagination over already-fetched results — no API changes needed
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [selectedResult, setSelectedResult] = useState<ThesisResult | null>(null);

  // Chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, isLoading: chatLoading } = useChat({
    api: '/api/chat',
    onError: (err) => toast.error('Terjadi kesalahan: ' + err.message),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    resultsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Lock body scroll on mount
  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    setPage(1);
    try {
      const filters: Record<string, unknown> = {};
      if (yearFrom) filters.yearFrom = parseInt(yearFrom);
      if (yearTo)   filters.yearTo   = parseInt(yearTo);
      if (division) filters.division = division;
      if (degreeType) filters.degree_type = degreeType;

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), filters }),
      });

      if (res.status === 429) {
        toast.error('Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.');
        return;
      }
      if (!res.ok) {
        toast.error('Gagal mengambil hasil pencarian.');
        return;
      }
      const data = await res.json();
      setResults(data.results ?? []);
      if ((data.results ?? []).length === 0) toast.info('Tidak ditemukan hasil untuk pencarian ini.');
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  // ponytail: derive pagination slice in render, no extra state
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pagedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Navbar />

      {/* ponytail: h-dvh on root caps layout to viewport — prevents body scroll when results load */}
      <main className="flex-1 flex flex-col min-h-0 w-full overflow-hidden bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
          <div className="px-4 pt-4 pb-2 shrink-0 w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
              <TabsTrigger value="semantic">Pencarian Semantik</TabsTrigger>
              <TabsTrigger value="chat">Natural Language (RAG)</TabsTrigger>
            </TabsList>
          </div>

          {/* ── SEMANTIC SEARCH ── */}
          <TabsContent value="semantic" className="flex-1 min-h-0 m-0 p-0 border-0 flex flex-col overflow-hidden focus-visible:ring-0 focus-visible:ring-offset-0">

            {/* ponytail: flex-row split — results shrink when panel opens (Claude artifact pattern) */}
            <div className="flex-1 min-h-0 flex overflow-hidden">

              {/* Left: scrollable results list */}
              <div ref={resultsScrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 chat-scroll bg-background">
                <div className="max-w-2xl mx-auto w-full space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <div className="flex gap-2 pt-1">
                              <Skeleton className="h-5 w-16 rounded-full" />
                              <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : !searched ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center text-muted-foreground text-sm gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center text-foreground mb-2">
                        <Search className="h-6 w-6" />
                      </div>
                      <p className="text-base md:text-lg font-semibold text-foreground">
                        Cari skripsi UPI menggunakan pencarian semantik (vektor).
                      </p>
                      <p className="text-sm max-w-md">
                        Masukkan topik pencarian Anda di kolom bawah. Gunakan filter untuk hasil yang lebih spesifik.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-lg">
                        {['pembelajaran berbasis game', 'kecerdasan buatan dalam pendidikan', 'media pembelajaran berbasis web', 'sistem informasi akademik'].map((chip) => (
                          <Button key={chip} variant="outline" size="sm" onClick={() => setQuery(chip)} className="text-xs rounded-full">
                            {chip}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      Tidak ada hasil untuk &ldquo;{query}&rdquo;.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pagedResults.map((r) => (
                        <Card
                          key={r.id}
                          className={cn(
                            'transition-all hover:shadow-md cursor-pointer select-none',
                            selectedResult?.id === r.id && 'ring-2 ring-primary'
                          )}
                          onClick={() => setSelectedResult(selectedResult?.id === r.id ? null : r)}
                        >
                          <CardHeader className="pb-2 pt-4 px-4">
                            <div className="flex items-start justify-between gap-4">
                              <CardTitle className="text-sm font-semibold leading-snug">{r.title}</CardTitle>
                              {r.score !== undefined && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  {(r.score * 100).toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-xs">
                              {r.author} · {r.year} · {r.degree_type} · {r.division_name}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="px-4 pb-4 space-y-2">
                            <p className={cn('text-sm text-muted-foreground', selectedResult ? 'line-clamp-2' : 'line-clamp-3')}>
                              {r.abstract_id || r.abstract_en || '—'}
                            </p>
                            {r.subject_codes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {r.subject_codes.slice(0, selectedResult ? 3 : 5).map((code, i) => (
                                  <Badge key={i} variant="outline" className="text-xs px-1.5 py-0">{code}</Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2 pb-1">
                          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 px-3 text-xs">
                            ← Sebelumnya
                          </Button>
                          <span className="text-xs text-muted-foreground tabular-nums">{page} / {totalPages}</span>
                          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 px-3 text-xs">
                            Berikutnya →
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: desktop inline panel — flex sibling so results shrink */}
              {selectedResult && (
                <div className="hidden md:flex flex-col w-[420px] shrink-0 border-l bg-background overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                    <span className="text-sm font-semibold">Detail Karya Ilmiah</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedResult(null)} aria-label="Tutup">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <DetailContent result={selectedResult} onClose={() => setSelectedResult(null)} />
                  </div>
                </div>
              )}

            </div>{/* end split row */}

            {/* Mobile: full-screen overlay */}
            {selectedResult && (
              <>
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSelectedResult(null)} />
                <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                    <span className="text-sm font-semibold">Detail Karya Ilmiah</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedResult(null)} aria-label="Tutup">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <DetailContent result={selectedResult} onClose={() => setSelectedResult(null)} />
                  </div>
                </div>
              </>
            )}

            {/* Sticky bottom form area */}
            <div className="border-t bg-background w-full shrink-0 py-3 md:py-4">
              <div className="max-w-3xl mx-auto w-full px-4 space-y-2 relative">
                <form onSubmit={handleSemanticSearch} className="space-y-3">
                  {showFilters && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 z-20 bg-card border border-border p-4 rounded-xl shadow-lg grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowFilters(false)}
                        aria-label="Tutup filter"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div>
                        <label htmlFor="year-from" className="text-xs font-medium text-muted-foreground mb-1 block">Tahun Dari</label>
                        <Input
                          id="year-from"
                          type="number"
                          placeholder="Tahun dari"
                          className="w-full h-9 text-xs"
                          value={yearFrom}
                          onChange={(e) => setYearFrom(e.target.value)}
                          min={1900}
                          max={2100}
                        />
                      </div>
                      <div className="pr-8 md:pr-0">
                        <label htmlFor="year-to" className="text-xs font-medium text-muted-foreground mb-1 block">Tahun Sampai</label>
                        <Input
                          id="year-to"
                          type="number"
                          placeholder="Tahun sampai"
                          className="w-full h-9 text-xs"
                          value={yearTo}
                          onChange={(e) => setYearTo(e.target.value)}
                          min={1900}
                          max={2100}
                        />
                      </div>
                      <div>
                        <label htmlFor="faculty-filter" className="text-xs font-medium text-muted-foreground mb-1 block">Fakultas</label>
                        <Select value={division} onValueChange={(val) => setDivision(val ?? '')}>
                          <SelectTrigger id="faculty-filter" className="w-full h-9 text-xs">
                            <SelectValue placeholder="Semua Fakultas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Fakultas</SelectItem>
                            {FAKULTAS_OPTIONS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pr-8">
                        <label htmlFor="degree-filter" className="text-xs font-medium text-muted-foreground mb-1 block">Jenjang</label>
                        <Select value={degreeType} onValueChange={(val) => setDegreeType(val ?? '')}>
                          <SelectTrigger id="degree-filter" className="w-full h-9 text-xs">
                            <SelectValue placeholder="Semua Jenjang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Jenjang</SelectItem>
                            <SelectItem value="S1">S1</SelectItem>
                            <SelectItem value="S2">S2</SelectItem>
                            <SelectItem value="S3">S3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn("h-10 w-10 shrink-0", showFilters && "bg-accent text-accent-foreground")}
                      onClick={() => setShowFilters(!showFilters)}
                      aria-label="Filter"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="semantic-search-input"
                        className="pl-9 h-10 text-sm md:text-base"
                        placeholder="Cari topik skripsi, misalnya: media pembelajaran berbasis web..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="h-10 px-4" disabled={loading}>
                      Cari
                    </Button>
                  </div>
                </form>
                {/* Footer with CC license */}
                <p className="text-[10px] text-center text-muted-foreground leading-normal">
                  Dataset berlisensi{' '}
                  <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                    CC BY-SA 4.0
                  </a>{' '}
                  —{' '}
                  <a href="https://www.kaggle.com/datasets/arsyapermana/repository-universitas-pendidikan-indonesia-2025" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                    Repositori UPI
                  </a>{' '}
                  · 92.482 karya ilmiah
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ── RAG CHAT ── */}
          <TabsContent
            value="chat"
            className="flex-1 min-h-0 m-0 p-0 border-0 flex flex-col overflow-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 chat-scroll bg-background">
              <div className="max-w-3xl mx-auto w-full space-y-6">
                {messages.length === 0 && (
                  <div className="h-full py-20 flex flex-col items-center justify-center text-center text-muted-foreground text-sm gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center text-foreground mb-2">
                      <Bot className="h-6 w-6" />
                    </div>
                    <p className="text-base md:text-lg font-semibold text-foreground">
                      Tanyakan apapun tentang skripsi di repositori UPI.
                    </p>
                    <p className="text-sm max-w-md">
                      Contoh: <em>&ldquo;Apa saja penelitian tentang pembelajaran berbasis game?&rdquo;</em>
                    </p>
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'flex gap-3 text-sm md:text-base w-full',
                      m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn(
                      'px-4 py-2.5 max-w-[85%] md:max-w-[80%]',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm whitespace-pre-wrap'
                        : 'bg-muted/50 border border-border/50 text-foreground rounded-2xl rounded-tl-sm'
                    )}>
                      {m.role === 'user' ? m.content : (
                        <div className="space-y-1">
                          {renderMarkdown(m.content)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="px-4 py-2.5 bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm flex items-center">
                      <span className="inline-flex gap-1 text-foreground/75 font-bold">
                        <span className="animate-bounce [animation-delay:0ms]">.</span>
                        <span className="animate-bounce [animation-delay:150ms]">.</span>
                        <span className="animate-bounce [animation-delay:300ms]">.</span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t bg-background w-full shrink-0 py-3 md:py-4">
              <div className="max-w-3xl mx-auto w-full px-4 space-y-2">
                <form
                  onSubmit={handleChatSubmit}
                  className="flex gap-2"
                >
                  <Input
                    id="chat-input"
                    placeholder="Tanyakan sesuatu tentang skripsi UPI..."
                    value={input}
                    onChange={handleInputChange}
                    disabled={chatLoading}
                    className="flex-1 text-sm md:text-base h-10 md:h-11 px-4"
                  />
                  <Button type="submit" size="icon" className="h-10 w-10 md:h-11 md:w-11 shrink-0" disabled={chatLoading || !input.trim()} aria-label="Kirim">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-[10px] text-center text-muted-foreground leading-normal">
                  Dataset berlisensi{' '}
                  <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                    CC BY-SA 4.0
                  </a>{' '}
                  —{' '}
                  <a href="https://www.kaggle.com/datasets/arsyapermana/repository-universitas-pendidikan-indonesia-2025" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                    Repositori UPI
                  </a>{' '}
                  · 92.482 karya ilmiah
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
