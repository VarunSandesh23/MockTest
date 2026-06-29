import React, { useState } from 'react';
import { getExamPin } from '../utils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const StudentDashboard = ({ student, onLogout, onStartExam }) => {
  const [examPin, setExamPin] = useState('');
  const [error, setError] = useState('');

  const handleStart = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const querySnapshot = await getDocs(collection(db, 'exams'));
      const exams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let matchingExam = null;
      let isExpired = false;

    for (const ex of exams) {
      let isMatch = false;
      
      // Check a window of -15 to +15 minutes to allow for extreme clock drift between computers
      for (let offset = -15; offset <= 15; offset++) {
        if (examPin === getExamPin(ex.id, offset)) {
          isMatch = true;
          break;
        }
      }
      
      if (isMatch) {
        matchingExam = ex;
        break;
      }
    }

    if (matchingExam) {
      if (matchingExam.status === 'ENDED') {
        setError('This exam has already ended.');
      } else {
        // Check if student already took this exam
        const resultsQuery = query(
          collection(db, 'studentResults'), 
          where('studentId', '==', student.id), 
          where('examId', '==', matchingExam.id)
        );
        const resultSnap = await getDocs(resultsQuery);
        
        if (!resultSnap.empty) {
          setError('You have already completed this exam.');
        } else {
          onStartExam(matchingExam);
        }
      }
    } else {
      setError('Invalid PIN. Please check the code and try again (ensure your system clock is accurate).');
    }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the server. Please try again later.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="animate-fade-in" style={{ backgroundColor: 'var(--panel-bg)', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>Student Dashboard</h2>
          <button onClick={onLogout} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
            Logout
          </button>
        </div>
        
        <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.05)', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)' }}>Welcome,</p>
          <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{student.name}</h3>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>ID: {student.id}</p>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Enter Exam PIN to Start</label>
            <input 
              type="text" 
              value={examPin}
              onChange={(e) => setExamPin(e.target.value)}
              placeholder="6-digit PIN from Administrator"
              required
              maxLength={6}
              style={{ width: '100%', padding: '15px', borderRadius: '6px', border: '2px solid var(--border-color)', fontSize: '1.2rem', letterSpacing: '3px', textAlign: 'center', outline: 'none' }}
            />
          </div>

          <button type="submit" className="btn-success" style={{ padding: '16px', fontSize: '1.1rem', fontWeight: 'bold' }}>
            Begin Examination
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;
