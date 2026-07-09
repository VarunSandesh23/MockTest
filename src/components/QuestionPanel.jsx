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
  submitExam,
  isFirstQuestionOfExam,
  isLastQuestionOfExam
}) => {
  if (!question) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, backgroundColor: 'white', borderRight: '1px solid var(--border-color)' }}>
      {/* Question Header */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Question {questionIndex + 1}</h3>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 'bold', 
            color: question.type === 'NUMERICAL' || !question.options || question.options.length === 0 ? 'var(--warning)' : 'var(--primary)', 
            backgroundColor: question.type === 'NUMERICAL' || !question.options || question.options.length === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(37, 99, 235, 0.1)', 
            padding: '3px 10px', 
            borderRadius: '12px',
            border: `1px solid ${question.type === 'NUMERICAL' || !question.options || question.options.length === 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`
          }}>
            {question.type === 'NUMERICAL' || !question.options || question.options.length === 0 ? 'NUMERICAL VALUE TYPE' : 'MULTIPLE CHOICE'}
          </span>
        </div>
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
        
        {question.type === 'NUMERICAL' || !question.options || question.options.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', marginTop: '10px' }}>
            <div style={{ padding: '15px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                <strong>Instructions:</strong> Enter your numerical answer below. You can enter integers or decimal values (e.g., 5, -3.14, 0.5).
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.05rem' }}>Your Numerical Answer:</label>
              <input
                type="number"
                step="any"
                placeholder="Enter numerical value..."
                value={selectedOption !== null && selectedOption !== undefined ? selectedOption : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOption(val === '' ? null : val);
                }}
                style={{
                  padding: '14px 18px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  border: '2px solid var(--primary)',
                  borderRadius: '8px',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.1)',
                  width: '100%',
                  backgroundColor: 'white',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            {/* Virtual Keypad for JEE/GATE feel */}
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>⌨️ Virtual Keypad</span>
                <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>Click or type directly</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '-'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const currentStr = selectedOption !== null && selectedOption !== undefined ? String(selectedOption) : '';
                      if (key === '-' && currentStr.startsWith('-')) {
                        setSelectedOption(currentStr.substring(1) || null);
                      } else if (key === '-' && !currentStr.startsWith('-')) {
                        setSelectedOption('-' + currentStr);
                      } else if (key === '.' && currentStr.includes('.')) {
                        // ignore double decimal
                      } else {
                        setSelectedOption(currentStr + key);
                      }
                    }}
                    style={{
                      padding: '12px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      backgroundColor: 'white',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'all 0.1s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const currentStr = selectedOption !== null && selectedOption !== undefined ? String(selectedOption) : '';
                    const newStr = currentStr.slice(0, -1);
                    setSelectedOption(newStr === '' ? null : newStr);
                  }}
                  style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 'bold', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.1s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                >
                  ⌫ Backspace
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOption(null)}
                  style={{ padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.1s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        ) : (
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
        )}
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
          <button className="btn-outline" onClick={goPrev} disabled={isFirstQuestionOfExam}>&lt;&lt; Back</button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-outline" onClick={goNext} disabled={isLastQuestionOfExam}>Next &gt;&gt;</button>
            <button className="btn-success" onClick={submitExam} style={{ fontWeight: 'bold' }}>Submit Exam</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel;
