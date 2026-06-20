'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '../../../components/Navbar';
import { useChat } from 'ai/react';

interface Result {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  division: string;
  url: string;
  keywords: string[];
  score?: number;
}

export default function SearchDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'semantic' | 'nl'>('semantic');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [division, setDivision] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vercel AI SDK chat integration
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    error: chatError,
    isLoading: chatLoading
  } = useChat({
    api: '/api/chat',
  });

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (yearFrom) filters.yearFrom = parseInt(yearFrom);
      if (yearTo) filters.yearTo = parseInt(yearTo);
      if (division) filters.division = division;

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setError("Terlalu banyak permintaan (Rate limit terlampaui). Silakan tunggu satu menit.");
        } else {
          setError("Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.");
        }
        setResults([]);
        return;
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      setError("Gagal terhubung ke server.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar userEmail={session?.user?.email || ''} />

      <div className="dashboard-container">
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'semantic' ? 'active' : ''}`}
            onClick={() => setActiveTab('semantic')}
          >
            Pencarian Semantik (Retrieval)
          </button>
          <button
            className={`tab-btn ${activeTab === 'nl' ? 'active' : ''}`}
            onClick={() => setActiveTab('nl')}
          >
            Natural Language Chat (RAG)
          </button>
        </div>

        {activeTab === 'semantic' ? (
          <div>
            <form onSubmit={handleSemanticSearch} className="search-control-panel glass">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Ketik topik skripsi yang ingin dicari (contoh: media pembelajaran interaktif berbasis web)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input"
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Mencari...' : 'Cari'}
                </button>
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <label>Tahun Dari</label>
                  <input
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    className="filter-num"
                    placeholder="2018"
                  />
                </div>
                <div className="filter-group">
                  <label>Tahun Sampai</label>
                  <input
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    className="filter-num"
                    placeholder="2025"
                  />
                </div>
                <div className="filter-group">
                  <label>Fakultas / Prodi</label>
                  <select
                     value={division}
                     onChange={(e) => setDivision(e.target.value)}
                     className="filter-select"
                  >
                    <option value="">Semua</option>
                    <option value="FIP">FIP</option>
                    <option value="FPIPS">FPIPS</option>
                    <option value="FPBS">FPBS</option>
                    <option value="FPMIPA">FPMIPA</option>
                    <option value="FPTK">FPTK</option>
                    <option value="FPOK">FPOK</option>
                    <option value="FPEB">FPEB</option>
                    <option value="FPSD">FPSD</option>
                  </select>
                </div>
              </div>
            </form>

            {error && (
              <div
                className="alert-box glass"
                style={{
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--danger)',
                  borderRadius: '8px',
                  color: 'var(--danger)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {loading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'var(--accent)',
                  fontSize: '1.1rem',
                  fontWeight: 500
                }}
              >
                Mencari data skripsi...
              </div>
            )}

            {!loading && !error && (
              <div className="results-grid">
                {results.length > 0 ? (
                  results.map((r) => (
                    <div key={r.id} className="result-card glass">
                      <div className="result-header">
                        <a href={r.url} target="_blank" rel="noreferrer" className="result-title">
                          {r.title}
                        </a>
                        {r.score !== undefined && (
                          <span className="result-score">Skor: {r.score.toFixed(3)}</span>
                        )}
                      </div>
                      <p className="result-abstract">{r.abstract}</p>
                      <div className="result-meta">
                        <span>Penulis: {r.authors.join(', ')}</span>
                        <span>Tahun: {r.year}</span>
                        <span>Fakultas: {r.division}</span>
                      </div>
                      {r.keywords.length > 0 && (
                        <div className="result-tags">
                          {r.keywords.map((kw, idx) => (
                            <span key={idx} className="tag">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Tidak ada hasil. Silakan lakukan pencarian.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="chat-container glass">
            {chatError && (
              <div
                className="alert-box glass"
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  border: '1px solid var(--danger)',
                  borderRadius: '8px',
                  color: 'var(--danger)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <span>⚠️</span>
                <span>Terjadi kesalahan pada obrolan: {chatError.message}</span>
              </div>
            )}

            <div className="chat-history">
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble ${m.role}`}>
                  <strong>{m.role === 'user' ? 'Anda: ' : 'CariSkripsi AI: '}</strong>
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{m.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-bubble assistant" style={{ opacity: 0.7 }}>
                  <strong>CariSkripsi AI: </strong>
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>Sedang merumuskan jawaban</span>
                    <span className="dot-flashing">...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="search-input-wrapper">
              <input
                type="text"
                placeholder="Tanyakan sesuatu tentang skripsi UPI..."
                value={input}
                onChange={handleInputChange}
                className="search-input"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={chatLoading}>
                {chatLoading ? 'Mengirim...' : 'Kirim'}
              </button>
            </form>
          </div>
        )}
      </div>

      <footer className="license-footer" style={{ textAlign: 'center', padding: '2rem 0', marginTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
        Dataset berlisensi CC BY-SA 4.0 — Repositori UPI
      </footer>
    </div>
  );
}
