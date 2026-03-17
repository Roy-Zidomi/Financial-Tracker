export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface-panel w-full max-w-md rounded-2xl p-6">
        {children}
      </div>
    </main>
  );
}
