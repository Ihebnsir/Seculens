import { useState } from 'react';
import './App.css';
import ScanForm from './components/ScanForm';
import ResultsPanel from './components/ResultsPanel';
import { mockScan } from './data/mockScan';

function App() {
  // On garde l'URL saisie dans un state pour pouvoir la lire et la modifier.
  const [targetUrl, setTargetUrl] = useState('');

  // On garde le message d'erreur séparé pour afficher un message rouge si l'URL est invalide.
  const [error, setError] = useState('');

  // On garde le résultat de scan simulé. Au départ, aucune analyse n'a encore été lancée.
  const [scanResult, setScanResult] = useState(null);

  // Cette fonction simule un clic sur le bouton "Start Scan" sans appel réseau réel.
  const handleStartScan = () => {
    const cleanedUrl = targetUrl.trim();

    if (!cleanedUrl) {
      setError('Please enter a URL before starting the scan.');
      setScanResult(null);
      return;
    }

    if (!/^https?:\/\//i.test(cleanedUrl)) {
      setError('The URL must start with http:// or https://');
      setScanResult(null);
      return;
    }

    setError('');
    setScanResult({
      ...mockScan,
      target: cleanedUrl,
      scannedAt: new Date().toISOString()
    });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>SecuLens</h1>
        <p>Web Security Assessment Platform</p>
      </header>

      <main className="app-main">
        <ScanForm
          targetUrl={targetUrl}
          onUrlChange={setTargetUrl}
          onSubmit={handleStartScan}
          error={error}
        />

        <ResultsPanel scan={scanResult} />
      </main>
    </div>
  );
}

export default App;
