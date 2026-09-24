function ScanForm({ targetUrl, onUrlChange, onSubmit, error }) {
  return (
    <section className="scan-card">
      <label htmlFor="target-url" className="field-label">
        Target URL
      </label>

      <input
        id="target-url"
        type="text"
        className="url-input"
        placeholder="http://localhost:3000"
        value={targetUrl}
        onChange={(event) => onUrlChange(event.target.value)}
      />

      {error && <p className="error-message">{error}</p>}

      <button type="button" className="scan-button" onClick={onSubmit}>
        Start Scan
      </button>

      <p className="warning-text">
        Scan only localhost, lab environments, or targets you are authorized to test.
      </p>
    </section>
  );
}

export default ScanForm;
