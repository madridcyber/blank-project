import React, { useState } from 'react';
import { useConfiguredApi } from '../api/client';

export const ExamsPage: React.FC = () => {
  const api = useConfiguredApi();
  const [title, setTitle] = useState('Sample exam');
  const [question, setQuestion] = useState('What is microservices architecture?');
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Exam orchestration</div>
          <div className="card-subtitle">Create and start a simple exam (teacher flow)</div>
        </div>
        <div className="chip">State + Circuit Breaker demo</div>
      </div>
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
      {status && (
        <div className="card-subtitle" style={{ marginTop: '0.5rem' }}>
          {status}
        </div>
      )}
    </section>
  );
};