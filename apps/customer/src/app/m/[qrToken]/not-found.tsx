export default function NotFound(): React.ReactElement {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="card max-w-md p-8 text-center">
        <div className="mb-3 text-5xl">🪧</div>
        <h1 className="text-xl font-bold">Masa bulunamadı</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Lütfen masa görevlimize haber verin. <br />
          <span className="text-fg-subtle">Please notify our staff.</span>
        </p>
      </div>
    </main>
  );
}
