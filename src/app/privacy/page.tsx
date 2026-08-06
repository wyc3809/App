"use client";

export default function PrivacyPage() {
  return (
    <div className="space-y-4 pb-4 animate-fade-up">
      <header>
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--fg-subtle)" }}
        >
          Legal
        </p>
        <h1 className="mt-1 font-display text-3xl">Privacy</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          WorthBook is built to keep your wealth data on your device.
        </p>
      </header>

      <section
        className="card-surface space-y-3 p-4 text-sm leading-relaxed"
        style={{ color: "var(--fg-muted)" }}
      >
        <h2 className="font-display text-lg" style={{ color: "var(--fg)" }}>
          What we store
        </h2>
        <p>
          Accounts, balances, value history, ledger entries, currency rates, and
          settings are saved only on this device (browser storage or the iOS /
          Android app sandbox). An optional IndexedDB mirror helps recover if
          browser storage is cleared. Nothing is uploaded to a WorthBook server.
        </p>
        <h2 className="font-display text-lg" style={{ color: "var(--fg)" }}>
          What we don&apos;t collect
        </h2>
        <p>
          No account sign-in, no analytics SDK, no ad tracking, and no cloud sync
          in this version. Export / share of JSON or CSV files stays under your
          control via the system share sheet or a local download.
        </p>
        <h2 className="font-display text-lg" style={{ color: "var(--fg)" }}>
          Biometrics
        </h2>
        <p>
          Face ID / Touch ID (when enabled in Settings) is processed by the
          operating system on your device. WorthBook never receives your
          biometric data — only a yes/no unlock result from the OS.
        </p>
        <h2 className="font-display text-lg" style={{ color: "var(--fg)" }}>
          Your controls
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Privacy mode masks amounts on screen.</li>
          <li>Export JSON creates a local backup you can save or share.</li>
          <li>Reset all data permanently clears local portfolio data.</li>
          <li>
            Uninstalling the app or clearing site data in the browser also
            removes everything — export a backup first.
          </li>
        </ul>
        <h2 className="font-display text-lg" style={{ color: "var(--fg)" }}>
          Contact
        </h2>
        <p>
          Support:{" "}
          <a
            className="font-medium"
            style={{ color: "var(--accent)" }}
            href="mailto:support@worthbook.app"
          >
            support@worthbook.app
          </a>
          . Replace this address before App Store submission if you use a
          different inbox.
        </p>
        <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
          Last updated: 6 Aug 2026 · WorthBook v1.2
        </p>
      </section>
    </div>
  );
}
