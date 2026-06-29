import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import AuthPortal from './components/AuthPortal';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import PreExam from './components/PreExam';
import ExamNavbar from './components/ExamNavbar';
import QuestionPanel from './components/QuestionPanel';
import GridPanel from './components/GridPanel';
import Result from './components/Result';
import Terminated from './components/Terminated';
import OfflineOverlay from './components/OfflineOverlay';
import LiveWebcam from './components/LiveWebcam';
import { mockData } from './mockData';

function App() {
  const [activeExam, setActiveExam] = useState(null);
  const [examData, setExamData] = useState(mockData);
  const [examState, setExamState] = useState(() => {
    const saved = sessionStorage.getItem('examState');
    if (saved === 'ADMIN_DASHBOARD' || saved === 'STUDENT_DASHBOARD') return saved;
    if (saved && saved !== 'AUTH') {
      const isStudent = sessionStorage.getItem('currentStudent');
      return isStudent ? 'STUDENT_DASHBOARD' : 'AUTH';
    }
    return 'AUTH';
  });
  const [currentStudent, setCurrentStudent] = useState(() => JSON.parse(sessionStorage.getItem('currentStudent')) || null);
  const [activeSubject, setActiveSubject] = useState(mockData.subjects[0]);
  
  const [currentIndices, setCurrentIndices] = useState(() => {
    const indices = {};
    mockData.subjects.forEach(sub => indices[sub] = 0);
    return indices;
  });
  
  const [userResponses, setUserResponses] = useState(() => {
    const initialState = {};
    mockData.subjects.forEach(sub => {
      const numQs = mockData.questions[sub].length;
      initialState[sub] = Array(numQs).fill({ selectedOption: null, status: 'NOT_VISITED' });
    });
    initialState[mockData.subjects[0]][0] = { selectedOption: null, status: 'NOT_ANSWERED' };
    return initialState;
  });

  const [results, setResults] = useState(null);
  const [warningMsg, setWarningMsg] = useState('');
  const mediaStreamsRef = useRef(null);
  const warningsRef = useRef(0);
  const isAlertingRef = useRef(false);
  const [offlineSince, setOfflineSince] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Offline tracking for 3-min grace period
  useEffect(() => {
    const handleOnline = () => setOfflineSince(null);
    const handleOffline = () => setOfflineSince(Date.now());
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (navigator.onLine === false) {
      setOfflineSince(Date.now());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSafeLogout = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    setCurrentStudent(null);
    setExamState('AUTH');
  }, []);

  useEffect(() => {
    sessionStorage.setItem('examState', examState);
  }, [examState]);

  useEffect(() => {
    if (currentStudent) {
      sessionStorage.setItem('currentStudent', JSON.stringify(currentStudent));
    } else {
      sessionStorage.removeItem('currentStudent');
    }
  }, [currentStudent]);

  // Session hijacking listener
  useEffect(() => {
    if (!currentStudent || !currentStudent.docId || examState === 'AUTH') return;

    const localToken = localStorage.getItem('examSessionToken');
    const unsubscribe = onSnapshot(doc(db, 'students', currentStudent.docId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.sessionToken && data.sessionToken !== localToken) {
          isAlertingRef.current = true; // prevent blur violation during alert
          handleSafeLogout();
          setTimeout(() => {
            alert("You have been logged out because your account was accessed from another device.");
            isAlertingRef.current = false;
          }, 100);
        }
      }
    });

    return () => unsubscribe();
  }, [currentStudent, examState, handleSafeLogout]);

  // Auto-save active sessions to Firestore
  useEffect(() => {
    if (examState === 'ACTIVE' && currentStudent && activeExam && userResponses) {
      const saveSession = async () => {
        try {
          const docId = `${currentStudent.id}_${activeExam.id}`;
          await setDoc(doc(db, 'activeSessions', docId), {
            studentId: currentStudent.id,
            examId: activeExam.id,
            userResponses,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Auto-save failed", err);
        }
      };
      saveSession();
    }
  }, [userResponses, examState, currentStudent, activeExam]);

  const terminateExam = useCallback(() => {
    setExamState('TERMINATED');
    setWarningMsg(null);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
  }, []);

  // Security Traps Setup
  useEffect(() => {
    if (examState !== 'ACTIVE') return;

    const handleViolation = (message) => {
      if (isAlertingRef.current) return;

      if (warningsRef.current === 0) {
        warningsRef.current = 1;
        isAlertingRef.current = true;
        setWarningMsg(message);
      } else {
        terminateExam();
      }
    };

    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleViolation("Right-click is disabled during the exam.");
    };

    let blurTimeout;
    const handleBlur = () => {
      blurTimeout = setTimeout(() => {
        handleViolation("You navigated away from the exam window.");
      }, 1500);
    };
    const handleFocus = () => {
      clearTimeout(blurTimeout);
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation("You exited fullscreen mode.");
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "You cannot exit the exam.";
      return e.returnValue;
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(blurTimeout);
    };
  }, [examState, terminateExam]);

  const handleStartExamFlow = async (exam) => {
    setActiveExam(exam);
    const data = exam.questionsData;
    setExamData(data);
    setActiveSubject(data.subjects[0]);
    
    const indices = {};
    data.subjects.forEach(sub => indices[sub] = 0);
    setCurrentIndices(indices);

    let restoredResponses = null;
    if (currentStudent) {
      try {
        const sessionDoc = await getDoc(doc(db, 'activeSessions', `${currentStudent.id}_${exam.id}`));
        if (sessionDoc.exists()) {
          restoredResponses = sessionDoc.data().userResponses;
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      }
    }

    if (restoredResponses) {
      setUserResponses(restoredResponses);
    } else {
      const initialState = {};
      data.subjects.forEach(sub => {
        const numQs = data.questions[sub].length;
        initialState[sub] = Array(numQs).fill({ selectedOption: null, status: 'NOT_VISITED' });
      });
      initialState[data.subjects[0]][0] = { selectedOption: null, status: 'NOT_ANSWERED' };
      setUserResponses(initialState);
    }
    
    setExamState('PRE_EXAM');
  };

  const startExam = async () => {
    try {
      // 1. Request Camera and Screen simultaneously BEFORE entering fullscreen and starting anti-cheat
      const camPromise = navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const screenPromise = navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'monitor' }, audio: false });
      
      const [camStream, screenStream] = await Promise.all([camPromise, screenPromise]);
      mediaStreamsRef.current = { camStream, screenStream };

      // Handle screen share stop (user clicks stop sharing from the system bar)
      screenStream.getVideoTracks()[0].onended = () => {
        if (warningsRef.current === 0) {
          warningsRef.current = 1;
          isAlertingRef.current = true;
          setWarningMsg("Screen sharing was stopped. You cannot continue the exam.");
        } else {
          terminateExam();
        }
      };

      // 2. Start Fullscreen
      await document.documentElement.requestFullscreen();
      
      // 3. Start Exam Anti-Cheat
      setExamState('ACTIVE');
    } catch (err) {
      console.error("Permission or Fullscreen Error:", err);
      alert("You must allow Camera, Screen Share (Entire Screen), and Fullscreen to start the exam.");
    }
  };

  const submitExam = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmitExam = async () => {
    setShowSubmitModal(false);
    await calculateResults();
    setExamState('SUBMITTED');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  const calculateResults = async () => {
    let totalScore = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    const subjectScores = {};

    examData.subjects.forEach(sub => {
      subjectScores[sub] = 0;
      examData.questions[sub].forEach((q, idx) => {
        const response = userResponses[sub][idx];
        const isAttempted = response.status === 'ANSWERED' || response.status === 'ANSWERED_MARKED';
        
        if (isAttempted && response.selectedOption !== null) {
          if (response.selectedOption === q.correctAnswer) {
            subjectScores[sub] += 4;
            totalScore += 4;
            correct++;
          } else {
            subjectScores[sub] -= 1;
            totalScore -= 1;
            incorrect++;
          }
        } else {
          unattempted++;
        }
      });
    });

    // Total possible score: total questions * 4
    let totalQuestions = 0;
    examData.subjects.forEach(sub => totalQuestions += examData.questions[sub].length);

    const finalResults = {
      totalScore,
      maxScore: totalQuestions * 4,
      correct,
      incorrect,
      unattempted,
      subjectScores
    };

    setResults(finalResults);

    if (currentStudent && activeExam) {
      try {
        const q = query(
          collection(db, 'studentResults'), 
          where('studentId', '==', currentStudent.id), 
          where('examId', '==', activeExam.id)
        );
        const querySnapshot = await getDocs(q);
        
        const newResult = {
          examId: activeExam.id,
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          ...finalResults,
          timestamp: new Date().toISOString()
        };

        if (!querySnapshot.empty) {
          const docId = querySnapshot.docs[0].id;
          await updateDoc(doc(db, 'studentResults', docId), newResult);
        } else {
          await addDoc(collection(db, 'studentResults'), newResult);
        }
      } catch (err) {
        console.error("Failed to save result to Firestore:", err);
      }
    }
  };

  const handleAction = (actionType) => {
    const currentIndex = currentIndices[activeSubject];
    const currentResponse = userResponses[activeSubject][currentIndex];
    
    let newStatus = currentResponse.status;

    if (actionType === 'SAVE_NEXT') {
      newStatus = currentResponse.selectedOption !== null ? 'ANSWERED' : 'NOT_ANSWERED';
    } else if (actionType === 'SAVE_MARK') {
      newStatus = currentResponse.selectedOption !== null ? 'ANSWERED_MARKED' : 'MARKED';
    } else if (actionType === 'MARK_NEXT') {
      newStatus = 'MARKED';
    }

    updateResponse(currentIndex, currentResponse.selectedOption, newStatus);
    goNext();
  };

  const updateResponse = (index, selectedOption, status) => {
    setUserResponses(prev => {
      const newResponses = { ...prev };
      newResponses[activeSubject] = [...newResponses[activeSubject]];
      newResponses[activeSubject][index] = { selectedOption, status };
      return newResponses;
    });
  };

  const goNext = () => {
    const currentIndex = currentIndices[activeSubject];
    if (currentIndex < examData.questions[activeSubject].length - 1) {
      changeQuestion(currentIndex + 1);
    }
  };

  const goPrev = () => {
    const currentIndex = currentIndices[activeSubject];
    if (currentIndex > 0) {
      changeQuestion(currentIndex - 1);
    }
  };

  const changeQuestion = (newIndex) => {
    setCurrentIndices(prev => ({ ...prev, [activeSubject]: newIndex }));
    
    // If the new question is NOT_VISITED, change it to NOT_ANSWERED
    if (userResponses[activeSubject][newIndex].status === 'NOT_VISITED') {
      updateResponse(newIndex, userResponses[activeSubject][newIndex].selectedOption, 'NOT_ANSWERED');
    }
  };

  const handleSubjectChange = (sub) => {
    setActiveSubject(sub);
    const firstIndex = currentIndices[sub];
    if (userResponses[sub][firstIndex].status === 'NOT_VISITED') {
      setUserResponses(prev => {
        const newResponses = { ...prev };
        newResponses[sub] = [...newResponses[sub]];
        newResponses[sub][firstIndex] = { ...newResponses[sub][firstIndex], status: 'NOT_ANSWERED' };
        return newResponses;
      });
    }
  };

  if (examState === 'AUTH') {
    return (
      <AuthPortal 
        onStudentLogin={(student) => {
          setCurrentStudent(student);
          setExamState('STUDENT_DASHBOARD');
        }}
        onAdminLogin={() => setExamState('ADMIN_DASHBOARD')}
      />
    );
  }

  if (examState === 'STUDENT_DASHBOARD') {
    return (
      <StudentDashboard 
        student={currentStudent}
        onLogout={() => {
          setCurrentStudent(null);
          setExamState('AUTH');
        }}
        onStartExam={handleStartExamFlow}
      />
    );
  }

  if (examState === 'ADMIN_DASHBOARD') {
    return <AdminDashboard onBackToLogin={() => setExamState('AUTH')} />;
  }

  if (examState === 'PRE_EXAM') {
    return <PreExam startExam={startExam} activeExamId={activeExam?.id} />;
  }

  if (examState === 'TERMINATED') {
    return <Terminated />;
  }

  if (examState === 'SUBMITTED') {
    return <Result results={results} />;
  }

  const handleReturnToExam = () => {
    document.documentElement.requestFullscreen()
      .then(() => {
        setWarningMsg(null);
        setTimeout(() => {
          isAlertingRef.current = false;
        }, 500);
      })
      .catch(() => {
        alert("You must allow fullscreen to continue the exam.");
      });
  };

  const currentQIndex = currentIndices[activeSubject];
  const currentQuestion = examData.questions[activeSubject][currentQIndex];
  const currentResponse = userResponses[activeSubject][currentQIndex];
  const totalSubQuestions = examData.questions[activeSubject].length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {offlineSince && examState === 'ACTIVE' && (
        <OfflineOverlay 
          offlineSince={offlineSince}
          onTerminate={terminateExam}
          onLogout={handleSafeLogout}
        />
      )}
      {warningMsg && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', maxWidth: '500px' }}>
              <h2 style={{ color: 'var(--danger)', marginBottom: '20px', fontSize: '1.8rem', fontWeight: 'bold' }}>⚠️ SECURITY WARNING ⚠️</h2>
              <p style={{ marginBottom: '15px', fontSize: '1.2rem', color: 'var(--text-main)' }}>{warningMsg}</p>
              <p style={{ marginBottom: '25px', fontWeight: 'bold', color: 'var(--danger)' }}>This is your FIRST warning. The next violation will result in immediate termination of the exam.</p>
              <button className="btn-primary" onClick={handleReturnToExam} style={{ fontSize: '1.1rem', padding: '12px 24px' }}>
                I Understand - Return to Exam
              </button>
           </div>
        </div>
      )}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', maxWidth: '400px' }}>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>Submit Exam?</h2>
              <p style={{ marginBottom: '25px', fontSize: '1.1rem', color: 'var(--text-muted)' }}>Are you sure you want to submit your exam? You will not be able to change your answers.</p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button className="btn-outline" onClick={() => setShowSubmitModal(false)} style={{ padding: '10px 20px', flex: 1 }}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={confirmSubmitExam} style={{ padding: '10px 20px', backgroundColor: 'var(--success)', border: 'none', flex: 1 }}>
                  Yes, Submit
                </button>
              </div>
           </div>
        </div>
      )}

      {examState === 'ACTIVE' && activeExam && currentStudent && (
        <LiveWebcam 
          examId={activeExam.id} 
          studentId={currentStudent.id} 
          studentName={currentStudent.name}
          mediaStreamsRef={mediaStreamsRef}
          onViolation={(msg) => {
            if (warningsRef.current === 0) {
              warningsRef.current = 1;
              isAlertingRef.current = true;
              setWarningMsg(msg);
            } else {
              terminateExam();
            }
          }}
        />
      )}

      <ExamNavbar 
        subjects={examData.subjects} 
        activeSubject={activeSubject} 
        setActiveSubject={handleSubjectChange} 
        studentName={currentStudent?.name}
        examTitle={activeExam?.title}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <QuestionPanel 
          question={currentQuestion}
          questionIndex={currentQIndex}
          selectedOption={currentResponse.selectedOption}
          setSelectedOption={(val) => updateResponse(currentQIndex, val, currentResponse.status)}
          handleAction={handleAction}
          totalQuestions={totalSubQuestions}
          goNext={goNext}
          goPrev={goPrev}
          submitExam={submitExam}
        />
        <GridPanel 
          totalQuestions={totalSubQuestions}
          questionStatuses={userResponses[activeSubject].map(r => r.status)}
          currentQuestionIndex={currentQIndex}
          setCurrentQuestionIndex={changeQuestion}
        />
      </div>
    </div>
  );
}

export default App;
