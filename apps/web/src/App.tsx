import './App.css';
import { ApiStatus } from './ApiStatus';

export function App() {
  return (
    <main className="app">
      <h1>Humanbase</h1>
      <p>The redesigned front end is being built. This page checks where its data comes from.</p>
      <ApiStatus />
    </main>
  );
}
