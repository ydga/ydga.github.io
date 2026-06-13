import { listPresets } from '@starter-kit/theme-presets';
import './App.css';

function App() {
  const presets = listPresets();

  return (
    <main className="page">
      <h1>Starter Kit</h1>
      <p className="tagline">
        Pick a look, download a themed shadcn repo and matching Figma library in one
        step.
      </p>
      <section className="status">
        <p>
          <strong>P0 scaffold</strong> — monorepo is running. {presets.length} theme
          presets loaded.
        </p>
      </section>
    </main>
  );
}

export default App;
