import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getExamPin, generateId } from '../utils';
import { parsePdfQuestions } from '../pdfParser';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import WebRTCPlayer from './WebRTCPlayer';
import QuestionEditor from './QuestionEditor';

const AdminDashboard = ({ onBackToLogin }) => {
  const [exams, setExams] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [questionBank, setQuestionBank] = useState([]);
  
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD', 'STUDENTS', 'QUESTION_BANK'
  const [activeExamId, setActiveExamId] = useState(null);
  const [liveFeeds, setLiveFeeds] = useState([]);
  
  // Question Bank states
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  
  const [uploadStatus, setUploadStatus] = useState({ loading: false, message: '', type: '' });
  const [newExamTitle, setNewExamTitle] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60 - new Date().getSeconds());

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');

  useEffect(() => {
    const timerId = setInterval(() => {
      setSecondsLeft(60 - new Date().getSeconds());
    }, 1000);

    const unsubscribeExams = onSnapshot(collection(db, 'exams'), (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExams(examsData);
    });

    const unsubscribeResults = onSnapshot(collection(db, 'studentResults'), (snapshot) => {
      const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentResults(resultsData);
    });

    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const stData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      setStudentsList(stData);
    });

    const unsubscribeQB = onSnapshot(collection(db, 'questionBank'), (snapshot) => {
      const qbData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      setQuestionBank(qbData);
    });

    return () => {
      clearInterval(timerId);
      unsubscribeExams();
      unsubscribeResults();
      unsubscribeStudents();
      unsubscribeQB();
    };
  }, []);

  // Real-time listener for live feeds
  useEffect(() => {
    if (activeExamId) {
      const q = query(collection(db, 'liveFeeds'), where('examId', '==', activeExamId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const feedsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLiveFeeds(feedsData);
      });
      return () => unsubscribe();
    } else {
      setLiveFeeds([]);
    }
  }, [activeExamId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadStatus({ loading: false, message: 'Please upload a valid PDF file.', type: 'error' });
      return;
    }

    setUploadStatus({ loading: true, message: 'Parsing PDF...', type: 'info' });

    try {
      const parsedData = await parsePdfQuestions(file);
      
      const allQuestions = [];
      Object.keys(parsedData.questions).forEach(subject => {
        allQuestions.push(...parsedData.questions[subject]);
      });

      for (const q of allQuestions) {
        await addDoc(collection(db, 'questionBank'), {
          ...q,
          createdAt: new Date().toISOString()
        });
      }
      
      if (parsedData.hasImages) {
        setUploadStatus({ 
          loading: false, 
          message: `Successfully added ${allQuestions.length} questions. Note: Some questions have diagrams/images! Look for the ⚠️ icon.`, 
          type: 'success' 
        });
        alert(`Successfully added ${allQuestions.length} questions!\n\nIMPORTANT: The AI detected that some questions contain diagrams or images. Please look for the ⚠️ icon in the Question Bank and click 'Edit' to manually upload screenshots for those questions.`);
      } else {
        setUploadStatus({ 
          loading: false, 
          message: `Successfully added ${allQuestions.length} questions to the bank!`, 
          type: 'success' 
        });
      }
    } catch (err) {
      console.error(err);
      setUploadStatus({ 
        loading: false, 
        message: err.message || 'Failed to parse the PDF. Please check the format.', 
        type: 'error' 
      });
    }
    
    e.target.value = null;
  };

  const handleSaveQuestion = async (editedQ) => {
    if (editedQ.docId === 'new') {
      await addDoc(collection(db, 'questionBank'), {
        subject: editedQ.subject || 'Custom',
        text: editedQ.text,
        options: editedQ.options,
        correctAnswer: editedQ.correctAnswer,
        questionImageUrl: editedQ.questionImageUrl || null,
        optionImageUrls: editedQ.optionImageUrls || null,
        createdAt: new Date().toISOString()
      });
    } else {
      const qRef = doc(db, 'questionBank', editedQ.docId);
      await updateDoc(qRef, {
        text: editedQ.text,
        options: editedQ.options,
        correctAnswer: editedQ.correctAnswer,
        questionImageUrl: editedQ.questionImageUrl || null,
        optionImageUrls: editedQ.optionImageUrls || null,
      });
    }
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (docId) => {
    if (window.confirm("Delete this question from the bank?")) {
      await deleteDoc(doc(db, 'questionBank', docId));
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (window.confirm("Are you sure you want to completely clear the Question Bank? This action cannot be undone.")) {
      const qbSnapshot = await getDocs(collection(db, 'questionBank'));
      qbSnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'questionBank', document.id));
      });
      setSelectedQuestions([]);
    }
  };

  const handleAddBlankQuestion = () => {
    setEditingQuestion({
      docId: 'new',
      subject: 'Custom',
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      questionImageUrl: null,
      optionImageUrls: [null, null, null, null]
    });
  };

  const handleCreateExamFromSelected = async () => {
    if (selectedQuestions.length === 0) {
      alert("Please select at least one question.");
      return;
    }
    if (!newExamTitle.trim()) {
      alert("Please enter an Exam Title first.");
      return;
    }

    const selectedQData = questionBank.filter(q => selectedQuestions.includes(q.docId));
    
    const subjects = [...new Set(selectedQData.map(q => q.subject))];
    const questionsObj = {};
    subjects.forEach(sub => {
      questionsObj[sub] = selectedQData.filter(q => q.subject === sub);
    });

    const newExam = {
      title: newExamTitle,
      status: 'PENDING',
      questionsData: {
        subjects,
        questions: questionsObj,
        totalQuestions: selectedQData.length
      },
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'exams'), newExam);
    setNewExamTitle('');
    setSelectedQuestions([]);
    setActiveTab('DASHBOARD');
    alert("Exam created successfully!");
  };

  const toggleExamStatus = async (examId) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    const examRef = doc(db, 'exams', examId);
    await updateDoc(examRef, {
      status: exam.status === 'ACTIVE' ? 'ENDED' : 'ACTIVE'
    });
  };
  
  const downloadLeaderboardCSV = (results, examTitle) => {
    if (!results || results.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Student Name,Student ID,Score,Max Score\n";
    
    results.forEach((result, index) => {
      const rank = index + 1;
      const name = result.studentName ? result.studentName.replace(/,/g, '') : 'Unknown';
      const id = result.studentId ? result.studentId.replace(/,/g, '') : 'Unknown';
      const score = result.totalScore;
      const max = result.maxScore;
      csvContent += `${rank},${name},${id},${score},${max}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${examTitle ? examTitle.replace(/\s+/g, '_') : 'Exam'}_Leaderboard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearResultsForExam = async (examId) => {
    if (window.confirm("Are you sure you want to clear all results for this exam?")) {
      const q = query(collection(db, 'studentResults'), where('examId', '==', examId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'studentResults', document.id));
      });
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm("Are you sure you want to completely delete this exam? This action cannot be undone.")) {
      await deleteDoc(doc(db, 'exams', examId));
      if (activeExamId === examId) {
        setActiveExamId(null);
      }
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentId.trim()) return;
    await addDoc(collection(db, 'students'), {
      name: newStudentName,
      id: newStudentId,
      password: 'student123'
    });
    setNewStudentName('');
    setNewStudentId('');
  };

  const handleDeleteStudent = async (docId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      await deleteDoc(doc(db, 'students', docId));
    }
  };

  const renderStudentsView = () => (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
      <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}><span>👥</span> Student Roster</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input type="text" placeholder="Student Name" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
        <input type="text" placeholder="Student ID (e.g. N24...)" value={newStudentId} onChange={e => setNewStudentId(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
        <button className="btn-primary" onClick={handleAddStudent} style={{ padding: '0 24px' }}>Add Student</button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>Student Name</th>
              <th style={{ padding: '16px' }}>Student ID</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {studentsList.length === 0 ? (
              <tr><td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No students found. Add one above!</td></tr>
            ) : studentsList.map(student => (
              <tr key={student.docId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px', fontWeight: 'bold' }}>{student.name}</td>
                <td style={{ padding: '16px', fontFamily: 'monospace' }}>{student.id}</td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button onClick={() => handleDeleteStudent(student.docId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '5px' }}>🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMasterView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
      {/* Create New Exam Card */}
      <div className="animate-fade-in" style={{ backgroundColor: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h3 style={{ marginBottom: '20px', color: 'var(--text-main)', textAlign: 'center' }}>Create New Exam</h3>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>Exams are now created by selecting questions from the Question Bank.</p>
        <button className="btn-primary" onClick={() => setActiveTab('QUESTION_BANK')} style={{ padding: '12px 24px' }}>
          Go to Question Bank
        </button>
      </div>

      {/* Existing Exams List */}
      {exams.slice().reverse().map(exam => (
        <div key={exam.id} className="animate-fade-in" style={{ backgroundColor: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setActiveExamId(exam.id)} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>{exam.title}</h3>
            <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: exam.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : exam.status === 'ENDED' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: exam.status === 'ACTIVE' ? 'var(--success)' : exam.status === 'ENDED' ? 'var(--text-muted)' : 'var(--danger)' }}>
              {exam.status}
            </span>
          </div>
          
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px' }}>Current Exam PIN:</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '6px', color: exam.status === 'ENDED' ? 'var(--text-muted)' : 'var(--primary)', fontFamily: 'monospace', textDecoration: exam.status === 'ENDED' ? 'line-through' : 'none' }}>
              {exam.status === 'ENDED' ? '------' : getExamPin(exam.id)}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>Created: {new Date(exam.createdAt).toLocaleDateString()}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', width: '100%' }}>
            <button className="btn-outline" style={{ flex: 1, padding: '10px' }} onClick={(e) => { e.stopPropagation(); setActiveExamId(exam.id); }}>
              Manage ➔
            </button>
            <button className="btn-outline" style={{ padding: '10px', color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }} title="Delete Exam">
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetailView = () => {
    const exam = exams.find(e => e.id === activeExamId);
    if (!exam) {
      setActiveExamId(null);
      return null;
    }

    const examResults = studentResults.filter(r => r.examId === exam.id);
    const sortedResults = [...examResults].sort((a, b) => b.totalScore - a.totalScore);

    const getAnalyticsData = (results) => {
      if (results.length === 0) return null;
      
      const totalScores = results.map(r => r.totalScore);
      const avgScore = (totalScores.reduce((a, b) => a + b, 0) / results.length).toFixed(1);
      const highest = Math.max(...totalScores);
      const lowest = Math.min(...totalScores);

      const ranges = {'0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0};
      results.forEach(r => {
        const p = (r.totalScore / r.maxScore) * 100;
        if (p <= 20) ranges['0-20%']++;
        else if (p <= 40) ranges['21-40%']++;
        else if (p <= 60) ranges['41-60%']++;
        else if (p <= 80) ranges['61-80%']++;
        else ranges['81-100%']++;
      });
      const distData = Object.keys(ranges).map(k => ({ name: k, count: ranges[k] }));

      let subAverages = [];
      if (results[0].subjectScores) {
        const subjects = Object.keys(results[0].subjectScores);
        subjects.forEach(sub => {
          const sum = results.reduce((a, r) => a + (r.subjectScores[sub] || 0), 0);
          subAverages.push({ name: sub, score: +(sum / results.length).toFixed(1) });
        });
      }

      return { avgScore, highest, lowest, distData, subAverages };
    };

    const analytics = getAnalyticsData(examResults);
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        <button onClick={() => setActiveExamId(null)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem', padding: '0' }} onMouseOver={(e) => e.target.style.color = 'var(--text-main)'} onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}>
          ⬅️ Back to All Exams
        </button>

        {/* Top Widgets for this Exam */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* PIN Widget */}
          <div style={{ backgroundColor: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
             <h2 style={{ color: 'var(--text-main)', marginBottom: '5px', fontSize: '1.5rem' }}>{exam.title}</h2>
             <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
               {exam.status === 'ENDED' ? 'Exam Ended' : 'Current Active PIN'}
             </p>
             <div style={{ fontSize: '3.5rem', fontWeight: 'bold', letterSpacing: '8px', color: exam.status === 'ENDED' ? 'var(--text-muted)' : 'var(--primary)', backgroundColor: exam.status === 'ENDED' ? 'rgba(0,0,0,0.02)' : 'rgba(37, 99, 235, 0.05)', padding: '15px', borderRadius: '12px', marginBottom: '20px', fontFamily: 'monospace', border: exam.status === 'ENDED' ? '1px dashed var(--border-color)' : '1px dashed rgba(37, 99, 235, 0.2)' }}>
               {exam.status === 'ENDED' ? '------' : getExamPin(exam.id)}
             </div>
             
             {exam.status !== 'ENDED' && (
               <>
                 <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                   <span>Time until expiration</span>
                   <span style={{ fontWeight: 'bold', color: secondsLeft <= 10 ? 'var(--danger)' : 'var(--text-main)' }}>{secondsLeft}s</span>
                 </div>
                 <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                   <div style={{ height: '100%', width: `${(secondsLeft / 60) * 100}%`, backgroundColor: secondsLeft <= 10 ? 'var(--danger)' : 'var(--success)', transition: 'width 1s linear, background-color 0.3s' }}></div>
                 </div>
               </>
             )}
          </div>

          {/* Exam Control Widget */}
          <div style={{ backgroundColor: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Exam Status</p>
              <div style={{ padding: '15px 30px', borderRadius: '50px', backgroundColor: exam.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : exam.status === 'ENDED' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: exam.status === 'ACTIVE' ? 'var(--success)' : exam.status === 'ENDED' ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '30px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                {exam.status === 'ACTIVE' && <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', boxShadow: '0 0 10px var(--success)' }}></span>}
                {exam.status}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => toggleExamStatus(exam.id)} 
                style={{ padding: '16px 40px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', backgroundColor: exam.status === 'ACTIVE' ? 'var(--danger)' : 'var(--success)', color: 'white', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {exam.status === 'ACTIVE' ? '🛑 End Exam' : '▶️ Start Exam'}
              </button>
              <button 
                onClick={() => handleDeleteExam(exam.id)}
                className="btn-outline" 
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '16px 20px', display: 'flex', alignItems: 'center' }}
                title="Delete Exam"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        {analytics && (
          <div style={{ backgroundColor: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ color: 'var(--text-main)', margin: 0, marginBottom: '20px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📈</span> Analytics & Insights
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              <div style={{ padding: '20px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Average Score</p>
                <p style={{ margin: '10px 0 0', fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{analytics.avgScore}</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Highest Score</p>
                <p style={{ margin: '10px 0 0', fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{analytics.highest}</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Lowest Score</p>
                <p style={{ margin: '10px 0 0', fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{analytics.lowest}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
              <div style={{ flex: '1 1 400px', height: '300px' }}>
                <h4 style={{ textAlign: 'center', color: 'var(--text-main)', marginBottom: '15px' }}>Score Distribution</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.distData}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                    <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {analytics.subAverages.length > 0 && (
                <div style={{ flex: '1 1 300px', height: '300px' }}>
                  <h4 style={{ textAlign: 'center', color: 'var(--text-main)', marginBottom: '15px' }}>Average by Subject</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.subAverages} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="score">
                        {analytics.subAverages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {analytics.subAverages.map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></span>
                        {entry.name}: {entry.score}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Monitoring Section */}
        {exam.status === 'ACTIVE' && (
          <div style={{ backgroundColor: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🔴</span> Live Monitoring
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', animation: 'pulse 2s infinite' }}></span>
                {liveFeeds.length} Active Feeds
              </div>
            </div>
            
            {liveFeeds.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <p>No students are currently active in this exam.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {liveFeeds.map(feed => (
                  <WebRTCPlayer key={feed.id} feed={feed} />
                ))}
              </div>
            )}
            <style>{`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {/* Leaderboard Section */}
        <div style={{ backgroundColor: 'var(--panel-bg)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🏆</span> {exam.title} - Leaderboard
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {sortedResults.length > 0 && (
                <button 
                  onClick={() => downloadLeaderboardCSV(sortedResults, exam.title)} 
                  style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }} 
                  onMouseOver={(e) => e.target.style.opacity = '0.9'} 
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  📥 Download CSV
                </button>
              )}
              <button onClick={() => clearResultsForExam(exam.id)} style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--danger)'; e.target.style.color = 'white'; }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--danger)'; }}>
                Reset Results
              </button>
            </div>
          </div>
          
          {sortedResults.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '2px dashed var(--border-color)' }}>
              <span style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</span>
              <p style={{ fontSize: '1.1rem' }}>No submissions yet for this exam.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
                    <th style={{ padding: '16px', width: '80px', textAlign: 'center' }}>Rank</th>
                    <th style={{ padding: '16px' }}>Student Name</th>
                    <th style={{ padding: '16px' }}>Student ID</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>Total Score</th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: 'var(--panel-bg)' }}>
                  {sortedResults.map((result, index) => (
                    <tr key={result.studentId} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: index === 0 ? 'rgba(251, 191, 36, 0.05)' : 'transparent', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = index === 0 ? 'rgba(251, 191, 36, 0.05)' : 'transparent'}>
                      <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'var(--text-muted)' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-main)', fontSize: '1.1rem' }}>{result.studentName}</td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{result.studentId}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>
                        {result.totalScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {result.maxScore}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuestionBankView = () => {
    const filteredQuestions = questionBank.filter(q => {
      if (!questionSearch) return true;
      const search = questionSearch.toLowerCase();
      const qNumStr = q.questionNumber?.toString() || '';
      return qNumStr.includes(search) || q.text.toLowerCase().includes(search) || q.subject?.toLowerCase().includes(search);
    });

    const groupedQuestions = {};
    filteredQuestions.forEach(q => {
      const subj = q.subject || 'General';
      if (!groupedQuestions[subj]) groupedQuestions[subj] = [];
      groupedQuestions[subj].push(q);
    });

    // Sort questions within each subject by question number
    Object.keys(groupedQuestions).forEach(subj => {
      groupedQuestions[subj].sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
    });

    const subjectOrder = ['Maths', 'Mathematics', 'Physics', 'Chemistry'];
    const sortedSubjects = Object.keys(groupedQuestions).sort((a, b) => {
      const idxA = subjectOrder.indexOf(a);
      const idxB = subjectOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      {editingQuestion && (
        <QuestionEditor 
          question={editingQuestion} 
          onSave={handleSaveQuestion} 
          onCancel={() => setEditingQuestion(null)} 
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📚</span> Question Bank
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <input type="checkbox" id="selectAll" 
                checked={selectedQuestions.length === questionBank.length && questionBank.length > 0}
                onChange={(e) => {
                  if (e.target.checked) setSelectedQuestions(questionBank.map(q => q.docId));
                  else setSelectedQuestions([]);
                }}
              />
              <label htmlFor="selectAll" style={{ marginLeft: '8px', fontWeight: 'bold' }}>Select All ({questionBank.length})</label>
            </div>
            {questionBank.length > 0 && (
              <button 
                onClick={handleDeleteAllQuestions} 
                style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s', marginLeft: '10px' }}
                onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--danger)'; e.target.style.color = 'white'; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--danger)'; }}
              >
                🗑️ Delete All Questions
              </button>
            )}
            <button 
              className="btn-primary" 
              onClick={handleAddBlankQuestion}
              style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '0.9rem' }}
            >
              + Create Blank Question
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Search by question number (e.g. 15), text, or subject..." 
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredQuestions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {questionBank.length === 0 ? 'No questions in bank. Upload a PDF to extract questions.' : 'No matching questions found.'}
              </div>
            ) : (
              sortedSubjects.map(subject => (
                <div key={subject}>
                  <h3 style={{ margin: '0 0 15px 0', paddingBottom: '8px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)' }}>{subject}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {groupedQuestions[subject].map(q => (
                      <div key={q.docId} style={{ display: 'flex', gap: '15px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: selectedQuestions.includes(q.docId) ? 'rgba(37, 99, 235, 0.05)' : 'transparent' }}>
                        <input type="checkbox" 
                          checked={selectedQuestions.includes(q.docId)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedQuestions([...selectedQuestions, q.docId]);
                            else setSelectedQuestions(selectedQuestions.filter(id => id !== q.docId));
                          }}
                          style={{ marginTop: '5px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                              {q.subject}
                            </span>
                            <div>
                              <button onClick={() => setEditingQuestion(q)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', marginRight: '10px' }}>✏️ Edit</button>
                              <button onClick={() => handleDeleteQuestion(q.docId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>🗑️</button>
                            </div>
                          </div>
                          <p style={{ margin: '10px 0', fontWeight: '500' }}>
                            {q.questionNumber && <span style={{color: 'var(--text-muted)', marginRight: '8px'}}>Q{q.questionNumber}.</span>}
                            {q.text}
                            {q.hasImageOrDiagram && !q.questionImageUrl && <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 'bold' }}>[⚠️ Requires Image Upload]</span>}
                          </p>
                          {q.questionImageUrl && (
                            <div style={{ marginBottom: '10px' }}>
                              <img src={q.questionImageUrl} alt="Question" style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {q.options.map((opt, i) => (
                              <div key={i} style={{ color: q.correctAnswer === i ? 'var(--success)' : 'inherit', fontWeight: q.correctAnswer === i ? 'bold' : 'normal', display: 'flex', flexDirection: 'column' }}>
                                <span>{String.fromCharCode(65 + i)}) {opt}</span>
                                {q.optionImageUrls?.[i] && (
                                  <img src={q.optionImageUrls[i]} alt={`Option ${i}`} style={{ maxHeight: '60px', maxWidth: '100%', borderRadius: '4px', marginTop: '4px', alignSelf: 'flex-start' }} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upload PDF Card */}
          <div style={{ backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 15px' }}>Upload PDF</h3>
            <label htmlFor="pdf-upload" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', border: '2px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', backgroundColor: 'rgba(37, 99, 235, 0.02)', color: 'var(--primary)', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.02)'}>
              <span style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📄</span>
              {uploadStatus.loading ? 'Processing...' : 'Upload PDF'}
            </label>
            <input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadStatus.loading} />
            {uploadStatus.message && (
              <div style={{ marginTop: '15px', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: uploadStatus.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: uploadStatus.type === 'error' ? 'var(--danger)' : 'var(--success)', textAlign: 'center' }}>
                {uploadStatus.message}
              </div>
            )}
          </div>

          {/* Create Exam Card */}
          <div style={{ backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 15px' }}>Create Exam</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
              Selected Questions: <strong>{selectedQuestions.length}</strong>
            </p>
            <input 
              type="text" 
              placeholder="Exam Title (e.g. Midterms)" 
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '15px', outline: 'none' }}
            />
            <button className="btn-success" onClick={handleCreateExamFromSelected} style={{ width: '100%', padding: '12px' }} disabled={selectedQuestions.length === 0}>
              Create Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 15px rgba(0,0,0,0.1)', zIndex: 20 }}>
        <div style={{ padding: '30px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 10px rgba(37,99,235,0.3)' }}>
            👨‍💻
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>Admin Portal</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Control Center</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => { setActiveTab('DASHBOARD'); setActiveExamId(null); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
              borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'DASHBOARD' && !activeExamId ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
              color: activeTab === 'DASHBOARD' && !activeExamId ? 'white' : '#94a3b8',
              fontWeight: activeTab === 'DASHBOARD' && !activeExamId ? 'bold' : 'normal',
              textAlign: 'left', fontSize: '1rem', transition: 'all 0.2s',
              borderLeft: activeTab === 'DASHBOARD' && !activeExamId ? '3px solid var(--primary)' : '3px solid transparent'
            }}
            onMouseOver={(e) => { if (activeTab !== 'DASHBOARD' || activeExamId) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; } }}
            onMouseOut={(e) => { if (activeTab !== 'DASHBOARD' || activeExamId) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
          >
            <span style={{ fontSize: '1.2rem' }}>📊</span> Dashboard
          </button>

          <button 
            onClick={() => { setActiveTab('STUDENTS'); setActiveExamId(null); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
              borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'STUDENTS' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
              color: activeTab === 'STUDENTS' ? 'white' : '#94a3b8',
              fontWeight: activeTab === 'STUDENTS' ? 'bold' : 'normal',
              textAlign: 'left', fontSize: '1rem', transition: 'all 0.2s',
              borderLeft: activeTab === 'STUDENTS' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
            onMouseOver={(e) => { if (activeTab !== 'STUDENTS') { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; } }}
            onMouseOut={(e) => { if (activeTab !== 'STUDENTS') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
          >
            <span style={{ fontSize: '1.2rem' }}>👥</span> Students
          </button>
          
          <button 
            onClick={() => { setActiveTab('QUESTION_BANK'); setActiveExamId(null); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
              borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'QUESTION_BANK' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
              color: activeTab === 'QUESTION_BANK' ? 'white' : '#94a3b8',
              fontWeight: activeTab === 'QUESTION_BANK' ? 'bold' : 'normal',
              textAlign: 'left', fontSize: '1rem', transition: 'all 0.2s',
              borderLeft: activeTab === 'QUESTION_BANK' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
            onMouseOver={(e) => { if (activeTab !== 'QUESTION_BANK') { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; } }}
            onMouseOut={(e) => { if (activeTab !== 'QUESTION_BANK') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
          >
            <span style={{ fontSize: '1.2rem' }}>📚</span> Question Bank
          </button>

          {activeExamId && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
              borderRadius: '8px', border: 'none',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'left', fontSize: '1rem',
              borderLeft: '3px solid var(--primary)',
              marginLeft: '20px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>📝</span> Exam Detail
            </div>
          )}
        </nav>

        <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => { onBackToLogin(); window.location.reload(); }} 
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px', 
              padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', 
              backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', 
              cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.color = '#ef4444'; }}
          >
            <span style={{ fontSize: '1.2rem' }}>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar for main content */}
        <header style={{ padding: '20px 40px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: 'bold' }}>
            {activeTab === 'STUDENTS' ? 'Student Management' : activeTab === 'QUESTION_BANK' ? 'Question Bank' : activeExamId ? 'Exam Management' : 'Dashboard Overview'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              A
            </div>
            <span style={{ fontWeight: '600', color: '#475569' }}>Administrator</span>
          </div>
        </header>

        <div style={{ padding: '40px', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {activeTab === 'STUDENTS' ? renderStudentsView() : activeTab === 'QUESTION_BANK' ? renderQuestionBankView() : activeExamId ? renderDetailView() : renderMasterView()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
