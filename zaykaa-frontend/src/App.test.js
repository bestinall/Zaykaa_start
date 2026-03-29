import { render, screen } from '@testing-library/react';
import App from './App';

test('renders zaykaa login experience', () => {
  render(<App />);
  expect(screen.getByText(/sign in to continue your zaykaa journey/i)).toBeInTheDocument();
});
