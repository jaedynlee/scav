"use client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-100 to-rose-100 px-1 py-6">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        {children}
      </main>
    </div>
  );
}
