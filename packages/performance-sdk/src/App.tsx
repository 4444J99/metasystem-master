import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { dispatchWorkspaceCheck } from './shared/utils/dispatch-workspace';

const API_URL = 'https://omni-dromenon-core-dkxnci5fua-uc.a.run.app';

// =============================================================================
// COMPONENTS
// =============================================================================

function Home() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Omni-Dromenon</h1>
      <p style={{ fontSize: '1.2rem', color: '#888', marginBottom: '3rem' }}>
        Real-time computational agency for participatory performance.
      </p>
      <nav style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <Link to="/audience" style={cardStyle('#646cff')}>
          <span style={{ fontSize: '2rem' }}>👥</span>
          <h3>Audience</h3>
          <p>Join the consensus and influence the performance.</p>
        </Link>
        <Link to="/performer" style={cardStyle('#ff4646')}>
          <span style={{ fontSize: '2rem' }}>🎭</span>
          <h3>Performer</h3>
          <p>Monitor real-time data and exercise authority.</p>
        </Link>
      </nav>
    </div>
  );
}

function Audience() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [values, setValues] = useState<Record<string, number>>({
    density: 0.5,
    tempo: 0.5,
    timbre: 0.5,
    reverb: 0.5
  });

  useEffect(() => {
    const s = io(`${API_URL}/audience`, { transports: ['websocket'] });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => { s.close(); };
  }, []);

  const handleInput = (param: string, val: number) => {
    setValues(prev => ({ ...prev, [param]: val }));
    if (socket) {
      socket.emit('input', { parameter: param, value: val });
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Audience Interface</h2>
        <div style={{ 
          width: '12px', height: '12px', borderRadius: '50%', 
          backgroundColor: connected ? '#4caf50' : '#f44336' 
        }} title={connected ? 'Connected' : 'Disconnected'} />
      </header>
      
      <div style={{ marginTop: '2rem' }}>
        {Object.entries(values).map(([param, val]) => (
          <div key={param} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'capitalize' }}>
              <label>{param}</label>
              <span>{Math.round(val * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={val} 
              onChange={(e) => handleInput(param, parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
          </div>
        ))}
      </div>
      <Link to="/" style={{ color: '#888', textDecoration: 'none', display: 'block', marginTop: '2rem' }}>← Back Home</Link>
    </div>
  );
}

function Performer() {
  const [liveValues, setLiveValues] = useState<Record<string, any>>({});
  const [universe, setUniverse] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(`${API_URL}/performer`, { transports: ['websocket'] });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('values', (data) => {
      setLiveValues(data);
    });
    s.on('metasystem:health', (data) => {
      setUniverse(data);
    });
    return () => { s.close(); };
  }, []);

  const handleDispatch = async (workspaceName: string) => {
    try {
      await dispatchWorkspaceCheck(API_URL, workspaceName);
      alert(`Dispatch request accepted for ${workspaceName}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Dispatch failed');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Performer Dashboard</h2>
        <span>{connected ? '🟢 Live' : '🔴 Offline'}</span>
      </header>

      {/* METASYSTEM UNIVERSE VIEW */}
      <section style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#888', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>🌌 Metasystem Health</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {universe.map(project => (
            <div key={project.name} style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '6px', border: '1px solid #333' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{project.name}</span>
                <span style={{ color: project.lastTestResult ? '#4caf50' : '#f44336' }}>
                  {project.lastTestResult ? '✓' : '✗'}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.5rem' }}>
                {project.techStack.join(', ')}
              </div>
              <button 
                onClick={() => handleDispatch(project.name)}
                style={{ 
                  marginTop: '1rem', width: '100%', padding: '0.5rem', 
                  background: '#333', color: 'white', border: 'none', 
                  borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' 
                }}
              >
                ⚡ Dispatch Agent
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* PARAMETERS VIEW */}
      <h3 style={{ color: '#888', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginTop: '3rem' }}>🎛️ Live Parameters</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {Object.entries(liveValues).map(([key, data]: [string, any]) => (
          <div key={key} style={{ background: '#2a2a2a', padding: '1.5rem', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 1rem 0', textTransform: 'capitalize' }}>{key}</h4>
            <div style={{ height: '20px', background: '#111', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', width: `${data.value * 100}%`, 
                backgroundColor: '#646cff', transition: 'width 0.1s linear' 
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
              <span>Value: {data.value.toFixed(2)}</span>
              <span>Confidence: {(data.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
      <Link to="/" style={{ color: '#888', textDecoration: 'none', display: 'block', marginTop: '2rem' }}>← Back Home</Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/audience" element={<Audience />} />
        <Route path="/performer" element={<Performer />} />
      </Routes>
    </BrowserRouter>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const cardStyle = (color: string) => ({
  padding: '2rem',
  background: '#252525',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'inherit',
  border: '1px solid #333',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  gap: '0.5rem',
  ':hover': {
    transform: 'translateY(-5px)',
    borderColor: color
  }
});

export default App;