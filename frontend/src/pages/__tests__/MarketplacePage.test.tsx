import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../state/AuthContext';
import { MarketplacePage } from '../MarketplacePage';

const server = setupServer(
  rest.get('http://localhost:8080/market/products', async (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json([
        { id: 'p1', name: 'Notebook', description: 'A5', price: 5.0, stock: 10 },
        { id: 'p2', name: 'Textbook', description: 'Algorithms', price: 50.0, stock: 5 }
      ])
    )
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <MarketplacePage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('MarketplacePage', () => {
  it('renders products fetched from API', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText(/Notebook/i)).toBeInTheDocument();
      expect(screen.getByText(/Textbook/i)).toBeInTheDocument();
    });
  });
});