import React, { useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { mockData } from '../mockData';

const AuthPortal = ({ onStudentLogin, onAdminLogin }) => {
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' or 'ADMIN'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'STUDENT') {
      try {
        const cleanUsername = username.trim().toUpperCase();
        const cleanPassword = password.trim();

        const q = query(
          collection(db, 'students'), 
          where('id', '==', cleanUsername), 
          where('password', '==', cleanPassword)
        );
        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          const fallbackStudent = mockData.students.find(
            s => s.id.trim().toUpperCase() === cleanUsername && s.password === cleanPassword
          );
          if (fallbackStudent) {
            await addDoc(collection(db, 'students'), {
              id: fallbackStudent.id.trim().toUpperCase(),
              name: fallbackStudent.name,
              password: fallbackStudent.password
            });
            const qRetry = query(
              collection(db, 'students'),
              where('id', '==', cleanUsername),
              where('password', '==', cleanPassword)
            );
            querySnapshot = await getDocs(qRetry);
          }
        }
        
        if (!querySnapshot.empty) {
          const studentDoc = querySnapshot.docs[0];
          const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
          
          // Save token to database to invalidate any other sessions
          await updateDoc(doc(db, 'students', studentDoc.id), { sessionToken });
          // Save token locally
          localStorage.setItem('examSessionToken', sessionToken);
          
          onStudentLogin({ id: studentDoc.data().id, name: studentDoc.data().name, docId: studentDoc.id, sessionToken, ...studentDoc.data() });
        } else {
          setError('Invalid Student ID or Password.');
        }
      } catch (err) {
        console.error("Student login error:", err);
        setError('Failed to connect to the server.');
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, username, password);
        onAdminLogin();
      } catch (err) {
        console.error("Admin login error:", err);
        setError('Invalid Admin Email or Password.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="animate-fade-in" style={{ backgroundColor: 'var(--panel-bg)', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ marginBottom: '10px', color: 'var(--primary)', textAlign: 'center' }}>Exam Portal</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '30px' }}>Authentication Required</p>
        
        {/* Role Tabs */}
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
          <button 
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: 'none', 
              border: 'none', 
              borderBottom: role === 'STUDENT' ? '2px solid var(--primary)' : '2px solid transparent',
              color: role === 'STUDENT' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: role === 'STUDENT' ? 'bold' : 'normal',
              marginBottom: '-2px'
            }}
            onClick={() => { setRole('STUDENT'); setError(''); setUsername(''); setPassword(''); }}
          >
            Student Login
          </button>
          <button 
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: 'none', 
              border: 'none', 
              borderBottom: role === 'ADMIN' ? '2px solid var(--primary)' : '2px solid transparent',
              color: role === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: role === 'ADMIN' ? 'bold' : 'normal',
              marginBottom: '-2px'
            }}
            onClick={() => { setRole('ADMIN'); setError(''); setUsername(''); setPassword(''); }}
          >
            Admin Login
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              {role === 'STUDENT' ? 'Student ID' : 'Username'}
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role === 'STUDENT' ? "e.g. N24H01A0317" : "admin"}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '1.1rem', marginTop: '10px' }}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPortal;
