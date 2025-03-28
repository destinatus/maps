import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the map container', () => {
  render(<App />);
  const mapElement = screen.getByTestId('map-container') || screen.getByClassName('map-container');
  expect(mapElement).toBeInTheDocument();
});

test('renders the search form', () => {
  render(<App />);
  const searchButton = screen.getByText('Search');
  expect(searchButton).toBeInTheDocument();
});

test('renders the notifications component', () => {
  render(<App />);
  const notificationsButton = screen.getByRole('button', { name: /notifications/i });
  expect(notificationsButton).toBeInTheDocument();
});
