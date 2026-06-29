import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const PreExam = ({ startExam, activeExamId }) => {
  const [checked, setChecked] = useState(false);
  const [examStatus, setExamStatus] = useState('PENDING');

  useEffect(() => {
    if (!activeExamId) return;

    const unsubscribe = onSnapshot(doc(db, 'exams', activeExamId), (docSnap) => {
      if (docSnap.exists()) {
        setExamStatus(docSnap.data().status);
      }
    });

    return () => unsubscribe();
  }, [activeExamId]);

  const isExamActive = examStatus === 'ACTIVE';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="animate-fade-in" style={{ backgroundColor: 'var(--panel-bg)', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '600px', width: '100%' }}>
        <h1 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Exam Instructions</h1>
        
        <div style={{ marginBottom: '30px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
          <p>1. The exam duration is 180 minutes.</p>
          <p>2. There are three sections: Physics, Chemistry, and Mathematics.</p>
          <p>3. Each correct answer awards +4 marks. Each incorrect answer deducts -1 mark.</p>
          <p>4. <strong>Security Warning:</strong> This exam requires Fullscreen mode. Do not exit fullscreen, switch tabs, or use keyboard shortcuts. Doing so will immediately terminate the exam and award 0 marks.</p>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="agree" 
            checked={checked} 
            onChange={(e) => setChecked(e.target.checked)} 
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="agree" style={{ cursor: 'pointer', fontWeight: '500' }}>
            I have read and understood the instructions.
          </label>
        </div>

        <button 
          className={isExamActive ? "btn-primary" : "btn-secondary"} 
          disabled={!checked || !isExamActive} 
          onClick={startExam}
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '16px', 
            fontWeight: 'bold',
            opacity: (!checked || !isExamActive) ? 0.6 : 1, 
            cursor: (!checked || !isExamActive) ? 'not-allowed' : 'pointer',
            backgroundColor: isExamActive ? 'var(--primary)' : 'var(--text-muted)',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          {isExamActive ? 'Start Exam' : 'Waiting for Admin to Start...'}
        </button>
      </div>
    </div>
  );
};

export default PreExam;
