import React from 'react';

const Terminated = () => {
  return (
    <div className="terminated-overlay animate-fade-in">
      <div style={{ padding: '40px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '12px', textAlign: 'center', maxWidth: '600px' }}>
        <svg style={{ width: '80px', height: '80px', margin: '0 auto 20px', color: '#fca5a5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px', fontWeight: 'bold' }}>Exam Terminated</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '20px' }}>
          Violation Detected: You navigated away from the exam window or exited fullscreen mode.
        </p>
        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fca5a5' }}>
          Your session is permanently terminated. You have been awarded 0 marks.
        </p>
      </div>
    </div>
  );
};

export default Terminated;
