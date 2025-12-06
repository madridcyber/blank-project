import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../state/AuthContext';
import { BookingPage } from '../BookingPage';

const server = setupServer(
  rest.get('http://localhost:8080/booking/resources', async (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json([
        { id: 'r1', name: 'Room 101', type: 'CLASSROOM', capacity: 30 },
        { id: 'r2', name: 'Lab A', type: 'LAB', capacity: 20 }
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
        <BookingPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('BookingPage', () => {
  it('renders resources from API', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText(/Room 101/i)).toBeInTheDocument();
      expect(screen.getByText(/Lab A/i)).toBeInTheDocument();
    });
  });
});