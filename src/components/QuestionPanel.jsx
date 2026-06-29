import React from 'react';

const QuestionPanel = ({ 
  question, 
  questionIndex, 
  selectedOption, 
  setSelectedOption,
  handleAction,
  totalQuestions,
  goNext,
  goPrev,
  submitExam
}) => {
  if (!question) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, backgroundColor: 'white', borderRight: '1px solid var(--border-color)' }}>
      {/* Question Header */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Question {questionIndex + 1}</h3>
        <span style={{ color: 'var(--text-muted)' }}>▼</span>
      </div>

      {/* Question Content */}
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{question.text}</p>
        
        {question.questionImageUrl && (
          <div style={{ marginBottom: '25px' }}>
            <img src={question.questionImageUrl} alt="Question context" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {question.options.map((opt, idx) => (
            <label 
              key={idx} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '12px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                cursor: 'pointer',
                backgroundColor: selectedOption === idx ? 'rgba(37, 99, 235, 0.05)' : 'white',
                borderColor: selectedOption === idx ? 'var(--primary)' : 'var(--border-color)',
                transition: 'all 0.2s'
              }}
            >
              <input 
                type="radio" 
                name={`q-${question.id}`} 
                checked={selectedOption === idx} 
                onChange={() => setSelectedOption(idx)}
                style={{ marginRight: '15px', width: '18px', height: '18px', flexShrink: 0 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>{opt}</span>
                {question.optionImageUrls && question.optionImageUrls[idx] && (
                  <img src={question.optionImageUrls[idx]} alt={`Option ${String.fromCharCode(65 + idx)}`} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid var(--border-color)', alignSelf: 'flex-start', marginTop: '5px' }} />
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button className="btn-success" onClick={() => handleAction('SAVE_NEXT')}>Save & Next</button>
          <button className="btn-warning" onClick={() => handleAction('SAVE_MARK')}>Save & Mark for Review</button>
          <button className="btn-outline" onClick={() => setSelectedOption(null)}>Clear Response</button>
          <button className="btn-info" onClick={() => handleAction('MARK_NEXT')}>Mark for Review & Next</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '15px' }}>
          <button className="btn-outline" onClick={goPrev} disabled={questionIndex === 0}>&lt;&lt; Back</button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-outline" onClick={goNext} disabled={questionIndex === totalQuestions - 1}>Next &gt;&gt;</button>
            <button className="btn-success" onClick={submitExam} style={{ fontWeight: 'bold' }}>Submit Exam</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel;
