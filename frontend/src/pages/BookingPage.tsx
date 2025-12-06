import React, { useEffect, useState } from 'react';
import { useConfiguredApi } from '../api/client';

type Resource = {
  id: string;
  name: string;
  type: string;
  capacity?: number;
};

export const BookingPage: React.FC = () => {
  const api = useConfiguredApi();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Resource[]>('/booking/resources')
      .then((res) => setResources(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Resource booking</div>
          <div className="card-subtitle">Classrooms, labs, and other shared spaces</div>
        </div>
        <div className="chip">Read-only demo</div>
      </div>
      {loading && <div className="card-subtitle">Loading resources…</div>}
      {!loading && (
        <div className="grid-sensors">
          {resources.map((r) => (
            <div key={r.id} className="sensor-card">
              <div className="sensor-name">{r.name}</div>
              <div className="sensor-meta">
                {r.type || 'RESOURCE'}
                {r.capacity ? ` · capacity ${r.capacity}` : ''}
              </div>
            </div>
          ))}
          {resources.length === 0 && <div className="card-subtitle">No resources registered yet.</div>}
        </div>
      )}
    </section>
  );
};