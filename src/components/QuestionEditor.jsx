import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const JEE_SYMBOLS = {
  Math: ['∫', '∑', '√', '±', 'π', '∞', '∈', '∉', '⊂', '∪', '∩', '∠', '∴', '∵', '≈', '≠', '≤', '≥', '½', '¼', 'x²', 'x³'],
  Physics: ['α', 'β', 'γ', 'θ', 'λ', 'μ', 'ω', 'Ω', 'Δ', 'Φ', 'ε', 'ρ', 'τ', '°', 'ħ', '→', '↑', '↓'],
  Chemistry: ['⇌', '⇄', '↑', '↓', '°C', '∆H', '∆S', '∆G', 'E°']
};

const QuestionEditor = ({ question, onSave, onCancel }) => {
  const [editedQ, setEditedQ] = useState({
    ...question,
    options: question.options || ['', '', '', ''],
    optionImageUrls: question.optionImageUrls || [null, null, null, null],
  });
  
  const [focusedField, setFocusedField] = useState('text'); // 'text' or 0,1,2,3
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const textRef = useRef(null);
  const opt0Ref = useRef(null);
  const opt1Ref = useRef(null);
  const opt2Ref = useRef(null);
  const opt3Ref = useRef(null);

  const textRefs = {
    'text': textRef,
    0: opt0Ref,
    1: opt1Ref,
    2: opt2Ref,
    3: opt3Ref
  };

  const getSymbolsToDisplay = () => {
    if (activeCategory === 'All') {
      const allSyms = Object.values(JEE_SYMBOLS).flat();
      return Array.from(new Set(allSyms));
    }
    return JEE_SYMBOLS[activeCategory];
  };

  const handleTextChange = (field, value) => {
    if (field === 'text') {
      setEditedQ({ ...editedQ, text: value });
    } else {
      const newOptions = [...editedQ.options];
      newOptions[field] = value;
      setEditedQ({ ...editedQ, options: newOptions });
    }
  };

  const insertSymbol = (symbol) => {
    const textarea = textRefs[focusedField].current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = focusedField === 'text' ? editedQ.text : editedQ.options[focusedField];
    
    const newValue = currentValue.substring(0, start) + symbol + currentValue.substring(end);
    
    handleTextChange(focusedField, newValue);
    
    // Set cursor position after inserted symbol (needs a slight timeout to let React render)
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
      textarea.focus();
    }, 0);
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `question_images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      if (field === 'question') {
        setEditedQ({ ...editedQ, questionImageUrl: url });
      } else {
        const newOptionImages = [...editedQ.optionImageUrls];
        newOptionImages[field] = url;
        setEditedQ({ ...editedQ, optionImageUrls: newOptionImages });
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image.");
    }
    setUploading(false);
    e.target.value = null; // reset input
  };

  const modalContent = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        <h2 style={{ color: 'var(--text-main)', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}>
          Edit Question
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        </h2>

        {/* Math Keyboard */}
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            {['All', ...Object.keys(JEE_SYMBOLS)].map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', backgroundColor: activeCategory === cat ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: activeCategory === cat ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {getSymbolsToDisplay().map((sym, idx) => (
              <button 
                key={`${sym}-${idx}`} 
                onClick={() => insertSymbol(sym)}
                style={{ width: '35px', height: '35px', fontSize: '1.1rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                title={`Insert ${sym}`}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                {sym}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
            Click a symbol to insert it into the currently active text box.
          </div>
        </div>

        {/* Question Text & Image */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Question Prompt</label>
          <textarea 
            ref={textRefs['text']}
            value={editedQ.text} 
            onChange={(e) => handleTextChange('text', e.target.value)}
            onFocus={() => setFocusedField('text')}
            style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'vertical' }}
          />
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="file" id="q-img-upload" accept="image/*" onChange={(e) => handleImageUpload(e, 'question')} style={{ display: 'none' }} disabled={uploading} />
            <label htmlFor="q-img-upload" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-block' }}>
              🖼️ {uploading ? 'Uploading...' : 'Upload Question Image'}
            </label>
            {editedQ.questionImageUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={editedQ.questionImageUrl} alt="Question" style={{ height: '40px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                <button onClick={() => setEditedQ({...editedQ, questionImageUrl: null})} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Option {String.fromCharCode(65 + i)}</label>
              <textarea 
                ref={textRefs[i]}
                value={editedQ.options[i]} 
                onChange={(e) => handleTextChange(i, e.target.value)}
                onFocus={() => setFocusedField(i)}
                style={{ width: '100%', height: '50px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'vertical' }}
              />
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="file" id={`opt-img-${i}`} accept="image/*" onChange={(e) => handleImageUpload(e, i)} style={{ display: 'none' }} disabled={uploading} />
                <label htmlFor={`opt-img-${i}`} style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }}>
                  {uploading ? '...' : '+ Add Image'}
                </label>
                {editedQ.optionImageUrls[i] && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <img src={editedQ.optionImageUrls[i]} alt={`Option ${i}`} style={{ height: '30px', borderRadius: '4px' }} />
                    <button onClick={() => {
                      const newArr = [...editedQ.optionImageUrls];
                      newArr[i] = null;
                      setEditedQ({...editedQ, optionImageUrls: newArr});
                    }} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✖</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Correct Answer & Save */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Correct Answer:</label>
            <select 
              value={editedQ.correctAnswer} 
              onChange={(e) => setEditedQ({...editedQ, correctAnswer: parseInt(e.target.value)})}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '1rem' }}
            >
              {[0, 1, 2, 3].map(i => (
                <option key={i} value={i}>Option {String.fromCharCode(65 + i)}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-outline" onClick={onCancel} style={{ padding: '10px 20px' }}>Cancel</button>
            <button className="btn-primary" onClick={() => onSave(editedQ)} style={{ padding: '10px 20px' }} disabled={uploading}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default QuestionEditor;
