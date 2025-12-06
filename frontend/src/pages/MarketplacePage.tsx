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
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Product[]>('/market/products')
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [api]);

  const handleQuickCheckout = async (productId: string) => {
    setCheckoutMessage(null);
    setBusyId(productId);
    try {
      const payload = {
        items: [{ productId, quantity: 1 }]
      };
      const res = await api.post('/market/orders/checkout', payload);
      setCheckoutMessage(`Order ${res.data.id} created successfully.`);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 402) {
        setCheckoutMessage('Payment authorization failed. Please try again later.');
      } else if (status === 409) {
        setCheckoutMessage('Insufficient stock for this product.');
      } else {
        setCheckoutMessage(err.response?.data?.message ?? 'Checkout failed.');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Campus marketplace</div>
          <div className="card-subtitle">Digital goods and materials from teachers and admins</div>
        </div>
        <div className="chip">Quick checkout demo</div>
      </div>
      {loading && <div className="card-subtitle">Loading products…</div>}
      {!loading && (
        <>
          <div className="grid-sensors">
            {products.map((p) => (
              <div key={p.id} className="sensor-card">
                <div className="sensor-name">{p.name}</div>
                <div className="sensor-value">{p.price.toFixed(2)} €</div>
                <div className="sensor-meta">
                  {p.description || 'No description'} · stock {p.stock}
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
                    onClick={() => handleQuickCheckout(p.id)}
                    disabled={busyId === p.id}
                  >
                    {busyId === p.id ? 'Processing…' : 'Buy 1'}
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && <div className="card-subtitle">No products available yet.</div>}
          </div>
          {checkoutMessage && (
            <div className="card-subtitle" style={{ marginTop: '0.6rem' }}>
              {checkoutMessage}
            </div>
          )}
        </>
      )}
    </section>
  );
};