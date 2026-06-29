import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const WebRTCPlayer = ({ feed }) => {
  const [camSnapshot, setCamSnapshot] = useState(null);
  const [screenSnapshot, setScreenSnapshot] = useState(null);

  useEffect(() => {
    const docRef = doc(db, 'liveFeeds', feed.id);
    let isMounted = true;

    const unsubscribeDoc = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      if (!data || !isMounted) return;
      
      if (data.camSnapshot) setCamSnapshot(data.camSnapshot);
      if (data.screenSnapshot) setScreenSnapshot(data.screenSnapshot);
    });

    return () => {
      isMounted = false;
      unsubscribeDoc();
    };
  }, [feed.id]); 
  
  return (
    <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>{feed.studentName}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 2s infinite' }}></span> LIVE
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {screenSnapshot ? (
          <img 
            src={screenSnapshot} 
            alt="Screen" 
            style={{ flex: 1.5, height: '140px', objectFit: 'contain', backgroundColor: '#111', borderRadius: '4px' }} 
          />
        ) : (
          <div style={{ flex: 1.5, height: '140px', backgroundColor: '#111', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.8rem' }}>No Screen</div>
        )}
        
        {camSnapshot ? (
          <img 
            src={camSnapshot} 
            alt="Camera" 
            style={{ flex: 1, height: '140px', objectFit: 'cover', backgroundColor: '#111', borderRadius: '4px' }} 
          />
        ) : (
          <div style={{ flex: 1, height: '140px', backgroundColor: '#111', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.8rem' }}>No Camera</div>
        )}
      </div>
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default WebRTCPlayer;
