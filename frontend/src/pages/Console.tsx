const CASAOS_URL = import.meta.env.VITE_CASAOS_URL ?? "";

export default function Console() {
  if (!CASAOS_URL) {
    return (
      <div className="page">
        <h2>Console</h2>
        <div className="card warn">
          No CasaOS URL configured. Set <code>VITE_CASAOS_URL</code> in your
          frontend environment to embed CasaOS here.
        </div>
      </div>
    );
  }

  return (
    <div className="console-frame" data-testid="console">
      <iframe
        title="CasaOS"
        src={CASAOS_URL}
        allow="fullscreen"
        data-testid="casaos-iframe"
      />
    </div>
  );
}
