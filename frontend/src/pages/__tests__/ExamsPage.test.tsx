import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../state/AuthContext';
import { ExamsPage } from '../ExamsPage';

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ExamsPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ExamsPage', () => {
  it('renders exam orchestration header', () => {
    renderWithProviders();
    expect(screen.getByText(/Exam orchestration/i)).toBeInTheDocument();
  });
});