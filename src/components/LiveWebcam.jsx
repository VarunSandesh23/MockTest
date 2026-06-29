import React, { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ],
  iceCandidatePoolSize: 10,
};

const LiveWebcam = ({ examId, studentId, studentName, mediaStreamsRef }) => {
  const videoRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    const docId = `${studentId}_${examId}`;
    const feedDocRef = doc(db, 'liveFeeds', docId);

    let unsubscribeDoc = null;
    let currentPc = null;
    let lastReconnectTime = null;

    const cleanupWebRTC = async () => {
      if (currentPc) {
        currentPc.close();
        currentPc = null;
      }
    };

    const startWebRTC = async () => {
      await cleanupWebRTC();
      
      try {
        const { camStream, screenStream } = mediaStreamsRef.current;
        
        if (videoRef.current) {
          videoRef.current.srcObject = camStream;
        }

        const pc = new RTCPeerConnection(servers);
        currentPc = pc;
        pcRef.current = pc;

        camStream.getTracks().forEach((track) => pc.addTrack(track, camStream));
        screenStream.getTracks().forEach((track) => pc.addTrack(track, screenStream));
        
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await updateDoc(feedDocRef, {
              callerCandidates: arrayUnion(event.candidate.toJSON())
            }).catch(e => console.error(e));
          }
        };

        const offerDescription = await pc.createOffer();
        const offerId = Date.now();
        const offer = {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
          offerId
        };

        // Write the new offer and clear old candidates BEFORE starting ICE gathering
        await setDoc(feedDocRef, {
          examId,
          studentId,
          studentName,
          offer,
          answer: null, 
          callerCandidates: [], 
          calleeCandidates: [], 
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Start ICE gathering
        await pc.setLocalDescription(offerDescription);

        let processedCalleeCandidates = 0;

        unsubscribeDoc = onSnapshot(feedDocRef, (snapshot) => {
          const data = snapshot.data();
          if (!data) return;

          if (data.reconnect && data.reconnect !== lastReconnectTime) {
            lastReconnectTime = data.reconnect;
            startWebRTC();
            return;
          }

          if (data.answer && data.answer.offerId === offerId && currentPc && !currentPc.currentRemoteDescription) {
            const answerDescription = new RTCSessionDescription(data.answer);
            currentPc.setRemoteDescription(answerDescription).then(() => {
              // Add any queued candidates now that remote description is set
              if (data.calleeCandidates) {
                const newCandidates = data.calleeCandidates.slice(processedCalleeCandidates);
                newCandidates.forEach(candidate => {
                  currentPc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
                });
                processedCalleeCandidates = data.calleeCandidates.length;
              }
            }).catch(e => console.error(e));
          } else if (data.calleeCandidates && currentPc && currentPc.remoteDescription) {
            const newCandidates = data.calleeCandidates.slice(processedCalleeCandidates);
            newCandidates.forEach(candidate => {
              currentPc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
            });
            processedCalleeCandidates = data.calleeCandidates.length;
          }
        });

      } catch (err) {
        console.error("WebRTC Setup Failed", err);
      }
    };

    if (mediaStreamsRef.current) {
      startWebRTC();
    }

    return () => {
      if (unsubscribeDoc) unsubscribeDoc();
      cleanupWebRTC();
      deleteDoc(feedDocRef).catch(console.error);
    };
  }, [examId, studentId, studentName, mediaStreamsRef]);

  return (
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
  );
};

export default LiveWebcam;
