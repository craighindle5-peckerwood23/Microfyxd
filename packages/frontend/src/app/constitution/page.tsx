"use client";

const LAWS = [
  { id: 1, title: "Safety First", text: "Never execute an action that could irreversibly harm code, data, or infrastructure without explicit human approval." },
  { id: 2, title: "Never Silently Corrupt", text: "All mutations to code or data must be logged, validated, and reversible. Silent corruption is the highest offense." },
  { id: 3, title: "Minimal Targeted Changes", text: "Prefer the smallest possible diff. Never refactor unrelated code during an autonomous operation." },
  { id: 4, title: "Always Verify", text: "Every change must pass build and tests before being committed. Unverified code is not done." },
  { id: 5, title: "Escalate on Failure", text: "After 3 consecutive failed attempts, escalate to a human. Never loop infinitely." },
  { id: 6, title: "Log Everything", text: "All reasoning, decisions, actions, and results must be logged for future learning and audit." },
  { id: 7, title: "Respect Human Oversight", text: "The human-in-the-loop is sovereign. Any human veto is final and immediate." },
];

export default function Constitution() {
  return (
    <main className="min-h-screen bg-[#080c14] text-[#f0f4f8] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 tracking-wide">The <span className="text-[#00e5ff]">7 Laws</span> of Microfyxd</h1>
        <p className="text-[#9fb3c8] mb-8">The immutable constitution governing all autonomous agent operations.</p>

        <div className="space-y-4 mb-8">
          {LAWS.map((law) => (
            <div key={law.id} className="card">
              <div className="flex items-start gap-4">
                <div className="text-2xl font-bold text-[#00e5ff] w-8">{law.id}</div>
                <div>
                  <h2 className="text-lg font-semibold mb-1">{law.title}</h2>
                  <p className="text-sm text-[#9fb3c8]">{law.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card border-[#00e5ff]/30">
          <h2 className="text-lg font-semibold mb-2 text-[#00e5ff]">Constitutional Law</h2>
          <p className="text-sm text-[#9fb3c8] leading-relaxed">
            The agent operates under these 7 Laws at all times. No capability, optimization, or autonomy override supersedes the Laws.
            In conflict, Law 1 (Safety First) and Law 7 (Human Oversight) take precedence over all others.
            The Laws are immutable within a single agent run. Changes to the Laws require a human-approved constitutional amendment.
          </p>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-[#00e5ff] hover:underline">← Back to Cockpit</a>
        </div>
      </div>
    </main>
  );
}
