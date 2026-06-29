import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ],
  iceCandidatePoolSize: 10,
};

const WebRTCPlayer = ({ feed }) => {
  const camVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const pcRef = useRef(null);
  
  // Store the offer we saw on mount so we can ignore it and wait for the fresh one
  const [initialOfferSdp] = useState(feed.offer?.sdp);

  useEffect(() => {
    // Trigger a reconnect when the admin views the stream
    // This tells the student to generate a fresh WebRTC offer
    const docRef = doc(db, 'liveFeeds', feed.id);
    updateDoc(docRef, { reconnect: Date.now() }).catch(e => console.log('Error triggering reconnect', e));
    
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [feed.id]);

  useEffect(() => {
    let unsubscribeDoc = null;
    let isMounted = true;
    
    if (!feed.offer) return;
    
    // Ignore the stale offer we saw on mount. We requested a reconnect!
    if (feed.offer.sdp === initialOfferSdp) return;
    
    // Fallback to SDP if offerId is not present (if student tab hasn't been refreshed)
    const currentOfferId = feed.offer.offerId || feed.offer.sdp;
    const docRef = doc(db, 'liveFeeds', feed.id);

    const initWebRTC = async () => {
      if (pcRef.current) {
        pcRef.current.close();
      }

      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;

      let trackCount = 0;
      pc.ontrack = (event) => {
        if (!isMounted) return;
        if (trackCount === 0 && camVideoRef.current) {
          camVideoRef.current.srcObject = event.streams[0];
        } else if (trackCount === 1 && screenVideoRef.current) {
          screenVideoRef.current.srcObject = event.streams[0];
        }
        trackCount++;
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await updateDoc(docRef, {
            calleeCandidates: arrayUnion(event.candidate.toJSON())
          }).catch(e => console.error(e));
        }
      };

      try {
        const offerDescription = new RTCSessionDescription(feed.offer);
        await pc.setRemoteDescription(offerDescription);

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
          offerId: currentOfferId
        };

        await updateDoc(docRef, { answer });

        let processedCallerCandidates = 0;

        unsubscribeDoc = onSnapshot(docRef, (snapshot) => {
          const data = snapshot.data();
          if (!data || !isMounted) return;
          
          if (data.offer?.offerId !== currentOfferId) {
             // The offer changed! We should ignore any updates, the useEffect will re-run.
             return;
          }

          if (data.callerCandidates && pc.remoteDescription) {
            const newCandidates = data.callerCandidates.slice(processedCallerCandidates);
            newCandidates.forEach(c => {
               pc.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error(e));
            });
            processedCallerCandidates = data.callerCandidates.length;
          }
        });
      } catch (err) {
        console.error("WebRTC Error on Admin side", err);
      }
    };

    initWebRTC();

    return () => {
      isMounted = false;
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [feed.offer?.offerId, feed.id]); 
  
  return (
    <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>{feed.studentName}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 2s infinite' }}></span> LIVE
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <video 
          ref={screenVideoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ flex: 1.5, height: '140px', objectFit: 'contain', backgroundColor: '#111', borderRadius: '4px' }} 
          title="Screen"
        />
        <video 
          ref={camVideoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ flex: 1, height: '140px', objectFit: 'cover', backgroundColor: '#111', borderRadius: '4px' }} 
          title="Camera"
        />
      </div>
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default WebRTCPlayer;
