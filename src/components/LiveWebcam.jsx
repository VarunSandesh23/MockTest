import React, { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

const LiveWebcam = ({ examId, studentId, studentName, mediaStreamsRef }) => {
  const videoRef = useRef(null);
  const hiddenScreenRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const docId = `${studentId}_${examId}`;
    const feedDocRef = doc(db, 'liveFeeds', docId);
    let intervalId = null;

    const startSnapshotPolling = async () => {
      const { camStream, screenStream } = mediaStreamsRef.current;
      
      if (videoRef.current) {
        videoRef.current.srcObject = camStream;
      }
      if (hiddenScreenRef.current) {
        hiddenScreenRef.current.srcObject = screenStream;
      }

      const captureFrame = (videoElement) => {
        if (!videoElement || !canvasRef.current || videoElement.videoWidth === 0) return null;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Scale down to max 640px width to save bandwidth
        const MAX_WIDTH = 640;
        let width = videoElement.videoWidth;
        let height = videoElement.videoHeight;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(videoElement, 0, 0, width, height);
        
        // Compress JPEG to 0.4 quality to keep the base64 string extremely small
        return canvas.toDataURL('image/jpeg', 0.4);
      };

      // Poll every 4 seconds
      intervalId = setInterval(async () => {
        try {
          const camSnapshot = captureFrame(videoRef.current);
          const screenSnapshot = captureFrame(hiddenScreenRef.current);

          if (camSnapshot || screenSnapshot) {
            await setDoc(feedDocRef, {
              examId,
              studentId,
              studentName,
              camSnapshot: camSnapshot || null,
              screenSnapshot: screenSnapshot || null,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (err) {
          console.error("Failed to push snapshots", err);
        }
      }, 4000);
    };

    if (mediaStreamsRef.current) {
      startSnapshotPolling();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      deleteDoc(feedDocRef).catch(console.error);
    };
  }, [examId, studentId, studentName, mediaStreamsRef]);

  return (
    <>
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', width: '240px', height: '135px',
        backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.1)'
      }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '10px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 2s infinite' }}></div>
          <span style={{ color: 'white', fontSize: '0.5rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>LIVE</span>
        </div>
        <style>{`
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        `}</style>
      </div>
      
      {/* Hidden elements for capturing frames */}
      <video ref={hiddenScreenRef} autoPlay playsInline muted style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
};

export default LiveWebcam;
