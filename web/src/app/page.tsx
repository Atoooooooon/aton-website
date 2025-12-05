const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

const stack = [
  "Next.js 14",
  "TypeScript",
  "Tailwind CSS",
  "Go (Gin)",
  "PostgreSQL",
  "Redis",
  "Docker",
];

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
      <main className="w-full max-w-4xl space-y-10 rounded-2xl border border-white/10 bg-black/50 p-10 shadow-2xl">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300">atonWeb</p>
          <h1 className="text-4xl font-semibold leading-tight">
            Full-stack playground ready for Docker, Next.js, Go, Postgres & Redis.
          </h1>
          <p className="text-lg text-zinc-300">
            API base URL: <span className="font-mono text-amber-200">{apiBase}</span>
          </p>
        </header>

        <section>
          <h2 className="text-sm font-semibold tracking-wide text-zinc-400">Project stack</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {stack.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-400">Next steps</h2>
          <ol className="list-decimal space-y-2 pl-5 text-zinc-200">
            <li>Start the stack with <span className="font-mono text-amber-200">docker compose up --build</span>.</li>
            <li>Implement API routes inside <span className="font-mono text-amber-200">/api/internal/handlers</span>.</li>
            <li>Consume them from server components or React hooks.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
