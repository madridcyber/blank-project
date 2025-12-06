import React, { useEffect, useState } from 'react';
import { useConfiguredApi } from '../api/client';
import { useAuth } from '../state/AuthContext';

type ExamSummary = {
  id: string;
  title: string;
  description?: string;
  state: string;
  startTime: string;
};

export const ExamsPage: React.FC = () => {
  const api = useConfiguredApi();
  const { role } = useAuth();

  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);

  const [title, setTitle] = useState('Sample exam');
  const [question, setQuestion] = useState('What is microservices architecture?');
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [submitExamId, setSubmitExamId] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadExams = async () => {
      setExamsError(null);
      try {
        const res = await api.get<ExamSummary[]>('/exam/exams');
        if (!cancelled) {
          setExams(res.data);
        }
      } catch (_err: any) {
        if (!cancelled) {
          setExamsError('Failed to load exams');
        }
      } finally {
        if (!cancelled) {
          setLoadingExams(false);
        }
      }
    };
    loadExams();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await api.post('/exam/exams', {
        title,
        description: 'Demo exam',
        startTime: new Date().toISOString(),
        questions: [{ text: question }]
      });
      setCreatedExamId(res.data.id);
      setStatus('Exam created. You can now start it.');
    } catch (err: any) {
      setStatus(err.response?.data?.message ?? 'Failed to create exam');
    }
  };

  const handleStartExam = async () => {
    if (!createdExamId) {
      setStatus('Create an exam first');
      return;
    }
    setStatus(null);
    try {
      const res = await api.post(`/exam/exams/${createdExamId}/start`);
      setStatus(`Exam started. State: ${res.data.state}`);
    } catch (err: any) {
      setStatus(err.response?.data?.message ?? 'Failed to start exam');
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!submitExamId) {
      setStatus('Provide an exam ID to submit.');
      return;
    }
    try {
      const payload = {
        answers: {
          q1: studentAnswer
        }
      };
      await api.post(`/exam/exams/${submitExamId}/submit`, payload);
      setStatus('Submission sent successfully.');
      setStudentAnswer('');
    } catch (err: any) {
      setStatus(err.response?.data?.message ?? 'Failed to submit answers');
    }
  };

  const isTeacherOrAdmin = role === 'TEACHER' || role === 'ADMIN';

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Exam orchestration</div>
          <div className="card-subtitle">Create, start, and submit exams</div>
        </div>
        <div className="chip">State + Circuit Breaker demo</div>
      </div>

      <div className="card-subtitle" style={{ marginBottom: '0.4rem', marginTop: '0.5rem' }}>
        Existing exams for this tenant
      </div>
      {loadingExams && <div className="card-subtitle">Loading exams…</div>}
      {!loadingExams && examsError && (
        <div className="card-subtitle text-danger">{examsError}</div>
      )}
      {!loadingExams && !examsError && exams.length === 0 && (
        <div className="card-subtitle">No exams yet. Teachers can create one below.</div>
      )}
      {!loadingExams && !examsError && exams.length > 0 && (
        <ul
          className="card-subtitle"
          style={{ paddingLeft: '1.2rem', marginBottom: '0.8rem' }}
        >
          {exams.map((e) => (
            <li key={e.id}>
              <code>{e.id}</code> – {e.title} ({e.state})
            </li>
          ))}
        </ul>
      )}

      {isTeacherOrAdmin && (
        <>
          <form onSubmit={handleCreateExam}>
            <div className="form-field">
              <label className="form-label">Exam title</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-field">
              <label className="form-label">Question</label>
              <input className="form-input" value={question} onChange={(e) => setQuestion(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary">
                Create exam
              </button>
              <button type="button" className="btn-ghost" onClick={handleStartExam}>
                Start exam
              </button>
            </div>
          </form>
          {createdExamId && (
            <div className="card-subtitle" style={{ marginTop: '0.7rem' }}>
              Exam ID: <code>{createdExamId}</code>
            </div>
          )}
        </>
      )}

      {!isTeacherOrAdmin && (
        <form onSubmit={handleStudentSubmit} style={{ marginTop: '0.8rem' }}>
          <div className="form-field">
            <label className="form-label">Exam ID</label>
            <input
              className="form-input"
              value={submitExamId}
              onChange={(e) => setSubmitExamId(e.target.value)}
              placeholder="Paste the exam ID shared by your teacher"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Your answer</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', borderRadius: '14px' }}
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Submit answers
          </button>
        </form>
      )}

      {status && (
        <div className="card-subtitle" style={{ marginTop: '0.7rem' }}>
          {status}
        </div>
      )}
    </section>
  );
};