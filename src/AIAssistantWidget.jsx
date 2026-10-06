import React, { useState } from 'react';
import { 
  Bot, Send, Sparkles, TrendingUp, DollarSign, Leaf, Plane, HelpCircle, 
  CheckCircle, ArrowRight
} from 'lucide-react';
import { api } from './api';

export default function AIAssistantWidget() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello, Administrator! I am your AeroIntellect AI Assistant connected directly to the live Jalgaon Airline database. Ask me anything about flight revenue, top-performing routes, passenger occupancy, or estimated carbon emissions."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleQuestions = [
    "Which flight generated the highest revenue?",
    "Which route has the highest occupancy?",
    "Show flights with low occupancy.",
    "What is our total estimated carbon emission?",
    "Which aircraft consumed the most fuel?",
    "Show upcoming flights."
  ];

  const handleSend = async (questionText) => {
    const query = questionText || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await api.askAiAssistant(query);
      if (res.success && res.answer) {
        setMessages(prev => [...prev, { sender: 'ai', text: res.answer, data: res.data }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: "Unable to retrieve database insights at this time." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Error connecting to AI service: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '680px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 60%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
          }}>
            <Bot color="#ffffff" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
              Admin AI Flight & Operations Assistant
            </h3>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              Real-time grounded database query answering (Zero fabricated metrics)
            </p>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
          Live DB Connected
        </span>
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ marginBottom: '14px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingRight: '6px',
        marginBottom: '16px'
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              background: m.sender === 'user'
                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              border: m.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
              color: '#f8fafc',
              fontSize: '13px',
              lineHeight: '1.5'
            }}
          >
            {m.sender === 'ai' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>
                <Sparkles size={12} /> AI Grounded Intelligence:
              </div>
            )}
            <div>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8', fontSize: '12px' }}>
            Querying airline database...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
      >
        <input
          type="text"
          placeholder="Ask a question about flights, routes, fuel, or revenue..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            color: '#f8fafc',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)'
          }}
        >
          <Send size={15} /> Ask
        </button>
      </form>
    </div>
  );
}
