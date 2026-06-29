import React, { useEffect, useState } from 'react';

const ExamNavbar = ({ subjects, activeSubject, setActiveSubject, studentName, examTitle }) => {
  const [timeLeft, setTimeLeft] = useState(180 * 60); // 180 minutes in seconds
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    effectiveType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || 0
  });

  useEffect(() => {
    const handleOnline = () => setNetworkStatus(prev => ({ ...prev, online: true }));
    const handleOffline = () => setNetworkStatus(prev => ({ ...prev, online: false }));
    const handleConnectionChange = () => {
      setNetworkStatus(prev => ({
        ...prev,
        effectiveType: navigator.connection?.effectiveType || 'unknown',
        downlink: navigator.connection?.downlink || 0
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleConnectionChange);
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timerId);
          // Automatic submission logic could go here
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getNetworkIndicator = () => {
    if (!networkStatus.online) {
      return <span title="Offline" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}>📵 Offline</span>;
    }
    // Network is online
    let color = '#4ade80'; // Green (Good)
    let text = 'Good';
    if (networkStatus.effectiveType === '3g' || (networkStatus.downlink > 0 && networkStatus.downlink < 3)) {
      color = '#facc15'; // Yellow (Fair)
      text = 'Fair';
    } else if (networkStatus.effectiveType === '2g' || networkStatus.effectiveType === 'slow-2g') {
      color = '#fb923c'; // Orange (Weak)
      text = 'Weak';
    }
    
    return (
      <span title={`${networkStatus.effectiveType.toUpperCase()} - ~${networkStatus.downlink}Mbps`} style={{ color: color, display: 'flex', alignItems: 'center', gap: '5px' }}>
        📶 {text}
      </span>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--primary)',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, marginBottom: '5px' }}>{examTitle || 'JEE Main CBT Mock Test'}</h2>
          {studentName && <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Candidate: <span style={{fontWeight: 'bold', color: 'white'}}>{studentName}</span></div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
            {getNetworkIndicator()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 'bold' }}>
            <span>Time Left:</span>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '5px 10px', borderRadius: '4px' }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Subject Tabs */}
      <div style={{ display: 'flex', backgroundColor: 'var(--primary-hover)', padding: '0 20px' }}>
        {subjects.map(sub => (
          <button
            key={sub}
            onClick={() => setActiveSubject(sub)}
            style={{
              padding: '12px 24px',
              backgroundColor: activeSubject === sub ? 'white' : 'transparent',
              color: activeSubject === sub ? 'var(--primary)' : 'white',
              borderBottom: activeSubject === sub ? '3px solid var(--primary)' : '3px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            {sub}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExamNavbar;
