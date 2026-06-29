import React, { useState, useEffect } from 'react';

const OfflineOverlay = ({ offlineSince, onTerminate, onLogout }) => {
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  useEffect(() => {
    if (!offlineSince) return;

    const intervalId = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - offlineSince) / 1000);
      const remaining = 180 - elapsedSeconds;
      
      if (remaining <= 0) {
        clearInterval(intervalId);
        onTerminate("Exam terminated due to prolonged network disconnection.");
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [offlineSince, onTerminate]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📵</div>
      <h1 style={{ color: '#ef4444', marginBottom: '10px' }}>Connection Lost</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px', textAlign: 'center', maxWidth: '600px', lineHeight: '1.5' }}>
        Your internet connection has dropped. The exam is paused. Please reconnect to Wi-Fi to resume your exam.
      </p>
      
      <div style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '2px solid #ef4444',
        padding: '20px 40px',
        borderRadius: '12px',
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1rem', color: '#fca5a5', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Time remaining before termination
        </div>
        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <button 
          onClick={onLogout}
          style={{
            padding: '15px 30px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          Save & Logout Safely
        </button>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem', maxWidth: '400px', textAlign: 'center' }}>
          Logging out safely will save your current progress. You can login later from another device using your Exam PIN.
        </p>
      </div>
    </div>
  );
};

export default OfflineOverlay;
