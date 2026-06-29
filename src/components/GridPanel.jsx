import React from 'react';

const GridPanel = ({ 
  totalQuestions, 
  questionStatuses, 
  currentQuestionIndex, 
  setCurrentQuestionIndex 
}) => {
  
  // Count statuses
  const counts = {
    notVisited: 0,
    notAnswered: 0,
    answered: 0,
    marked: 0,
    answeredMarked: 0
  };

  questionStatuses.forEach(status => {
    if (status === 'NOT_VISITED') counts.notVisited++;
    else if (status === 'NOT_ANSWERED') counts.notAnswered++;
    else if (status === 'ANSWERED') counts.answered++;
    else if (status === 'MARKED') counts.marked++;
    else if (status === 'ANSWERED_MARKED') counts.answeredMarked++;
  });

  const getStatusClass = (status) => {
    switch(status) {
      case 'NOT_VISITED': return 'status-not-visited';
      case 'NOT_ANSWERED': return 'status-not-answered';
      case 'ANSWERED': return 'status-answered';
      case 'MARKED': return 'status-marked';
      case 'ANSWERED_MARKED': return 'status-answered-marked';
      default: return 'status-not-visited';
    }
  };

  return (
    <div style={{ width: '30%', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Legend */}
      <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'white' }}>
        <h4 style={{ marginBottom: '15px', fontSize: '1rem', fontWeight: 'bold' }}>Status</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="status-not-visited" style={{ width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>{counts.notVisited}</div>
            <span>Not Visited</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="status-not-answered" style={{ width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{counts.notAnswered}</div>
            <span>Not Answered</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="status-answered" style={{ width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{counts.answered}</div>
            <span>Answered</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="status-marked" style={{ width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{counts.marked}</div>
            <span>Marked for Review</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
            <div className="status-answered-marked" style={{ width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{counts.answeredMarked}</div>
            <span>Answered & Marked for Review</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '20px', backgroundColor: 'var(--bg-color)' }}>
        <h4 style={{ marginBottom: '15px', color: 'var(--text-main)', fontWeight: 'bold' }}>Choose a Question</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '10px' }}>
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const status = questionStatuses[idx] || 'NOT_VISITED';
            const isActive = idx === currentQuestionIndex;
            return (
              <button
                key={idx}
                className={getStatusClass(status)}
                onClick={() => setCurrentQuestionIndex(idx)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  border: isActive ? '2px solid black' : '1px solid var(--border-color)',
                  boxShadow: isActive ? '0 0 0 2px rgba(37,99,235,0.3)' : 'none',
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GridPanel;
