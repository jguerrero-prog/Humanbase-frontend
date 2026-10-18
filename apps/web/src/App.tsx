import './App.css';
import { ApiStatus } from './ApiStatus';

export function App() {
  return (
    <main className="app">
      <h1>HumanBase</h1>
      <p>The redesigned front end is being built. This page checks that it can reach the HumanBase API.</p>
      <ApiStatus />
    </main>
  );
}
