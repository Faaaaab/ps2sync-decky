import React, { useState, useEffect, useRef } from 'react';
import { ButtonItem, DialogButton, ToggleField } from 'decky-frontend-lib';
import { FiRefreshCw, FiUpload, FiDownload, FiHardDrive } from 'react-icons/fi';

interface CommandStatus {
  status: 'idle' | 'running' | 'success' | 'error';
  lines: string[];
  count: number;
}

const App: React.VFC = () => {
  const [status, setStatus] = useState<CommandStatus>({
    status: 'idle',
    lines: [],
    count: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [verbose, setVerbose] = useState(true);
  const consoleRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Poll for status updates
  const pollStatus = async () => {
    try {
      const response = await fetch('http://localhost:1337/frontend/get_status', {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setIsRunning(data.status === 'running');
      }
    } catch (error) {
      console.error('Error polling status:', error);
    }
  };

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [status.lines]);

  // Start polling when running
  useEffect(() => {
    if (isRunning) {
      pollInterval.current = setInterval(pollStatus, 500);
    } else {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    }
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [isRunning]);

  const executeCommand = async (command: string) => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const endpoint = command === 'mount'
        ? 'http://localhost:1337/frontend/execute_mount'
        : `http://localhost:1337/frontend/execute_${command}?verbose=${verbose}`;
      
      const response = await fetch(endpoint, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
      
      // Keep polling until command finishes
      let attempts = 0;
      while (attempts < 300) { // 5 minutes max
        await new Promise(resolve => setTimeout(resolve, 500));
        const statusResponse = await fetch('http://localhost:1337/frontend/get_status', {
          method: 'GET',
        });
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setStatus(statusData);
          if (statusData.status !== 'running') {
            break;
          }
        }
        attempts++;
      }
    } catch (error) {
      console.error('Error executing command:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = async () => {
    try {
      const response = await fetch('http://localhost:1337/frontend/clear_logs', {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'running':
        return '#3b82f6'; // blue
      case 'success':
        return '#10b981'; // green
      case 'error':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'running':
        return '⏳ Running...';
      case 'success':
        return '✓ Success';
      case 'error':
        return '✗ Error';
      default:
        return 'Ready';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px',
      height: '100%',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #374151',
        paddingBottom: '15px',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#fff',
        }}>🎮 PS2Sync</h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          border: `2px solid ${getStatusColor()}`,
        }}>
          {status.status === 'running' && (
            <span style={{
              display: 'inline-block',
              animation: 'spin 1s linear infinite',
              fontSize: '16px',
            }}>⟳</span>
          )}
          <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
      }}>
        <div
          onClick={() => executeCommand('pull')}
          style={{
            padding: '16px',
            backgroundColor: isRunning ? '#4b5563' : '#1f2937',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            opacity: isRunning ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (!isRunning) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#374151';
          }}
          onMouseOut={(e) => {
            if (!isRunning) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#1f2937';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FiDownload size={24} color="#3b82f6" />
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>PULL</span>
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>SD2PSX → PCSX2</span>
        </div>

        <div
          onClick={() => executeCommand('push')}
          style={{
            padding: '16px',
            backgroundColor: isRunning ? '#4b5563' : '#1f2937',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            opacity: isRunning ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (!isRunning) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#374151';
          }}
          onMouseOut={(e) => {
            if (!isRunning) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#1f2937';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FiUpload size={24} color="#f59e0b" />
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>PUSH</span>
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>PCSX2 → SD2PSX</span>
        </div>
      </div>

      {/* Mount SD Button */}
      <div
        onClick={() => executeCommand('mount')}
        style={{
          padding: '16px',
          backgroundColor: isRunning ? '#4b5563' : '#1f2937',
          border: '2px solid #10b981',
          borderRadius: '8px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          opacity: isRunning ? 0.6 : 1,
        }}
        onMouseOver={(e) => {
          if (!isRunning) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#374151';
        }}
        onMouseOut={(e) => {
          if (!isRunning) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#1f2937';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiHardDrive size={24} color="#10b981" />
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>Mount SD Card</span>
        </div>
      </div>

      {/* Options */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: '#111827',
        borderRadius: '8px',
        border: '1px solid #374151',
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#9ca3af',
          fontSize: '14px',
        }}>
          <input
            type="checkbox"
            checked={verbose}
            onChange={(e) => setVerbose(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
            }}
          />
          Verbose mode (-v)
        </label>
      </div>

      {/* Console Output */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #374151',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#0f1419',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 15px',
          backgroundColor: '#1f2937',
          borderBottom: '1px solid #374151',
        }}>
          <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 'bold' }}>
            Console ({status.count} lines)
          </span>
          <button
            onClick={clearLogs}
            disabled={isRunning}
            style={{
              padding: '6px 12px',
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '4px',
              color: '#d1d5db',
              fontSize: '12px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.5 : 1,
            }}
          >
            Clear
          </button>
        </div>
        <div
          ref={consoleRef}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '15px',
            fontFamily: '"Courier New", monospace',
            fontSize: '12px',
            lineHeight: '1.5',
            color: '#10b981',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            backgroundColor: '#0f1419',
          }}
        >
          {status.lines.map((line, idx) => (
            <div key={idx} style={{
              color: line.includes('❌') || line.includes('ERREUR') ? '#ef4444'
                : line.includes('✓') || line.includes('✓') ? '#10b981'
                : line.includes('🚀') || line.includes('→') ? '#3b82f6'
                : line.includes('===') ? '#9ca3af'
                : '#10b981',
            }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
