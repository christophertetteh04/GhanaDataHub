import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../services/api';
import { BookText, FileText, FileSpreadsheet, FileJson, Search, Database } from 'lucide-react';
import { BLOG_POSTS } from '../pages/BlogPage';

const SYNONYMS = {
  'cacao': 'cocoa',
  'election': 'electoral voter',
  'cedi': 'forex exchange rate',
  'ghs': 'forex ghana cedi',
  'usd': 'forex dollar',
  'farm': 'agriculture farming',
  'school': 'education literacy',
  'hospital': 'health facility medical',
  'doctor': 'health physician',
  'road': 'infrastructure transport',
  'light': 'electricity energy power',
  'water': 'sanitation water access',
  'birth': 'maternal health population',
  'death': 'mortality health',
  'job': 'employment labour unemployment',
  'work': 'employment labour',
  'money': 'finance economy gdp',
  'tree': 'environment forest land',
  'rain': 'climate rainfall weather',
  'gse': 'stock exchange market shares',
};

function expandQuery(q) {
  const lower = q.toLowerCase().trim();
  return SYNONYMS[lower] ? `${q} ${SYNONYMS[lower]}` : q;
}

function isQuestion(q) {
  return /^(what|why|how|when|where|which|who|is|are|does|did)\b/i.test(q.trim());
}

export default function SearchDropdown({ query, onSelectDataset, onSelectStory, onClose }) {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setDatasets([]);
      setStories([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      const expandedQ = expandQuery(query);
      
      searchApi.search({ q: expandedQ, per_page: 6 })
        .then((res) => {
          const items = res.data.items || [];
          setDatasets(items);
          
          if (items.length === 0) {
            try {
              const zeroResults = JSON.parse(localStorage.getItem('gdh_zero_searches') || '[]');
              zeroResults.unshift({ q: query, ts: Date.now() });
              localStorage.setItem('gdh_zero_searches', JSON.stringify(zeroResults.slice(0, 50)));
            } catch (e) {
              console.error("Failed to save zero-search", e);
            }
          }
          
          if (isQuestion(query)) {
            const searchTerms = query.toLowerCase().split(' ').filter(w => w.length > 2);
            const matchedStories = BLOG_POSTS.filter(post => {
              const text = (post.title + ' ' + post.body).toLowerCase();
              return searchTerms.some(term => text.includes(term));
            });
            setStories(matchedStories.slice(0, 2));
          } else {
            setStories([]);
          }
          
          setHasSearched(true);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FileText size={14} />;
    if (mimeType.includes("csv") || mimeType.includes("excel") || mimeType.includes("spreadsheet")) return <FileSpreadsheet size={14} color="#059669" />;
    if (mimeType.includes("json")) return <FileJson size={14} color="#D97706" />;
    if (mimeType.includes("pdf")) return <FileText size={14} color="#DC2626" />;
    return <Database size={14} color="#4F46E5" />;
  };

  const getFileBadgeColor = (mimeType) => {
    if (!mimeType) return "#F3F4F6";
    if (mimeType.includes("csv") || mimeType.includes("excel")) return "#D1FAE5";
    if (mimeType.includes("json")) return "#FEF3C7";
    if (mimeType.includes("pdf")) return "#FEE2E2";
    return "#E0F2FE";
  };

  if (!query || query.trim().length < 2) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: 0,
      right: 0,
      zIndex: 300,
      background: 'white',
      borderRadius: '14px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {loading && !hasSearched && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>
          Searching...
        </div>
      )}

      {hasSearched && datasets.length === 0 && stories.length === 0 && (
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
            No results found for "{query}"
          </div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>
            <span style={{ color: 'var(--gray-400)' }}>Try: </span>
            {['cocoa', 'GDP', 'voter registration', 'health'].map((s, i) => (
              <React.Fragment key={s}>
                <span 
                  style={{ color: 'var(--green)', cursor: 'pointer' }}
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(s)}`);
                    onClose();
                  }}
                >
                  {s}
                </span>
                {i < 3 && <span style={{ color: 'var(--gray-300)' }}>, </span>}
              </React.Fragment>
            ))}
          </div>
          <button 
            className="btn btn-outline" 
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={() => { navigate('/datasets'); onClose(); }}
          >
            Request this dataset &rarr;
          </button>
        </div>
      )}

      {hasSearched && stories.length > 0 && (
        <div style={{ borderBottom: datasets.length > 0 ? '1px solid var(--gray-100)' : 'none' }}>
          <div style={{ 
            fontSize: '11px', textTransform: 'uppercase', color: 'var(--gray-500)', 
            padding: '12px 16px 4px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 
          }}>
            <BookText size={12} /> Data Stories
          </div>
          {stories.map(post => (
            <div 
              key={post.id}
              onClick={() => { onSelectStory(post.id); onClose(); }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-900)' }}>{post.title}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{post.readingTime} min read</div>
            </div>
          ))}
        </div>
      )}

      {hasSearched && datasets.length > 0 && (
        <div>
          <div style={{ 
            fontSize: '11px', textTransform: 'uppercase', color: 'var(--gray-500)', 
            padding: '10px 16px 4px', fontWeight: 800 
          }}>
            Datasets
          </div>
          {datasets.map(d => (
            <div 
              key={d.id}
              onClick={() => { onSelectDataset(d); onClose(); }}
              style={{
                padding: '10px 16px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--green-pale)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ 
                width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                background: getFileBadgeColor(d.file_type),
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {getFileIcon(d.file_type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: 13, fontWeight: 700, color: 'var(--gray-900)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {d.title}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{d.category?.name || 'Uncategorized'}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{d.download_count || 0} dl</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div 
        onClick={() => { navigate(`/search?q=${encodeURIComponent(query)}`); onClose(); }}
        style={{ 
          borderTop: '1px solid var(--gray-100)', 
          padding: '12px 16px',
          background: 'var(--gray-50)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--green)',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--green-pale)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-50)'}
      >
        <Search size={14} /> Search all results for "{query}"
      </div>
    </div>
  );
}
