import React, { useEffect, useState } from 'react';
import { useConfiguredApi } from '../api/client';

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
};

export const MarketplacePage: React.FC = () => {
  const api = useConfiguredApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Product[]>('/market/products')
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Campus marketplace</div>
          <div className="card-subtitle">Digital goods and materials from teachers and admins</div>
        </div>
        <div className="chip">Listing only</div>
      </div>
      {loading && <div className="card-subtitle">Loading products…</div>}
      {!loading && (
        <div className="grid-sensors">
          {products.map((p) => (
            <div key={p.id} className="sensor-card">
              <div className="sensor-name">{p.name}</div>
              <div className="sensor-value">{p.price.toFixed(2)} €</div>
              <div className="sensor-meta">
                {p.description || 'No description'} · stock {p.stock}
              </div>
            </div>
          ))}
          {products.length === 0 && <div className="card-subtitle">No products available yet.</div>}
        </div>
      )}
    </section>
  );
};