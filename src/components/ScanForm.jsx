function ScanForm({ targetUrl, onUrlChange, onSubmit, error, loading }) {
  return (
    <section className="scan-card">
      <label htmlFor="target-url" className="field-label target-label">
        <svg className="target-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3.5 19 6v5.1c0 4.7-2.9 7.8-7 9.4-4.1-1.6-7-4.7-7-9.4V6l7-2.5Z" />
          <path d="m9.2 11.8 1.8 1.8 3.9-4" />
        </svg>
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

      <button type="button" className="scan-button primary-button" onClick={onSubmit} disabled={loading}>
        {loading ? 'Scanning...' : 'Start Scan'}
      </button>

      <p className="warning-text">
        Scan only localhost, lab environments, or targets you are authorized to test.
      </p>
    </section>
  );
}

export default ScanForm;
