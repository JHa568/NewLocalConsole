import Notice from "../components/ui/Notice";

const CASAOS_URL = import.meta.env.VITE_CASAOS_URL ?? "";

export default function Console() {
  if (!CASAOS_URL) {
    return (
      <div className="p-6">
        <h2>Console</h2>
        <Notice className="mt-4">
          No CasaOS URL configured. Set <code>VITE_CASAOS_URL</code> in your
          frontend environment to embed CasaOS here.
        </Notice>
      </div>
    );
  }

  return (
    <div className="h-full w-full" data-testid="console">
      <iframe
        title="CasaOS"
        src={CASAOS_URL}
        allow="fullscreen"
        data-testid="casaos-iframe"
        className="h-full w-full rounded-2xl border-none"
      />
    </div>
  );
}
