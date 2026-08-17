import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-6 shadow-lg shadow-blue-500/20">
        E
      </div>

      <p className="text-sm font-mono text-blue-600 dark:text-blue-400 mb-2">
        Error 404 &middot; NOT_FOUND
      </p>
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
        This page could not be found
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-md mb-8 text-pretty">
        {
          "The escrow, milestone, or page you're looking for may have been moved, deleted, or never existed. Double-check the URL for typos."
        }
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </Link>
        <a
          href="https://vercel.com/docs/errors/not_found"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Troubleshooting guide
        </a>
      </div>

      <div className="mt-10 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 max-w-md w-full text-left">
        <p className="text-xs font-mono text-zinc-500 mb-2">
          Common causes of a 404
        </p>
        <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc list-inside">
          <li>The URL contains a typo or an outdated path.</li>
          <li>The resource was moved or removed.</li>
          <li>You followed a stale link or bookmark.</li>
        </ul>
      </div>
    </div>
  );
}
