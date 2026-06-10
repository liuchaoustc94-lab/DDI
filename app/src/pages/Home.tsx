import {
  Activity,
  ArrowRight,
  Beaker,
  ChevronRight,
  FlaskConical,
  ShieldCheck,
  TableProperties,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();
  const assessmentEntryPath = "/login?redirect=%2Fassessment";

  return (
    <main className="h-full overflow-auto bg-[#dfe7f2] text-[#0f172a]">
      <div className="relative isolate min-h-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.16),_transparent_28%),linear-gradient(180deg,_#eef4fb_0%,_#dfe7f2_100%)]" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#60a5fa]/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#22c55e]/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-[1360px] flex-col px-6 py-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#0f172a] shadow-lg shadow-[#2563eb]/20">
                <FlaskConical className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[#64748b]">Platform</div>
                <div className="text-lg font-semibold tracking-tight">DDI Risk Assessment</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
              <div className="rounded-[1.2rem] border border-white/75 bg-white/82 px-4 py-3 shadow-sm backdrop-blur">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">
                  云顶新耀
                </div>
                <img
                  src="/everest-medicines-logo-ch.png"
                  alt="云顶新耀 Everest Medicines"
                  className="h-10 w-auto object-contain sm:h-11"
                />
              </div>
              <div className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e] shadow-sm backdrop-blur">
                Ready
              </div>
            </div>
          </header>

          <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-[680px]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Evidence-based DDI workflow
              </div>

              <h1 className="max-w-[11ch] text-5xl font-semibold leading-[0.96] tracking-[-0.05em] text-[#0f172a] sm:text-6xl">
                Launch the DDI assessment workspace.
              </h1>
              <p className="mt-6 max-w-[60ch] text-base leading-7 text-[#475569]">
                Start from a dedicated homepage. When a user clicks the platform entry, the system performs
                user verification first, and then opens the full DDI Risk Assessment environment after login.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => navigate(assessmentEntryPath)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#0f172a]/20 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#1e293b]"
                >
                  Verify And Enter Platform
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-[#334155] shadow-sm backdrop-blur">
                  <Activity className="h-4 w-4 text-[#2563eb]" />
                  User verification is required before platform access.
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Beaker,
                    title: "Structured inputs",
                    text: "Capture formula, SMILES, dosing route, PK fields, and reversible/TDI/induction parameters.",
                  },
                  {
                    icon: Activity,
                    title: "Calculation layer",
                    text: "Review intermediate concentrations, net-effect factors, and route-aware DDI computations.",
                  },
                  {
                    icon: TableProperties,
                    title: "Decision outputs",
                    text: "Generate CYP and transporter assessment tables with formula visibility and threshold logic.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <article
                    key={title}
                    className="rounded-3xl border border-white/70 bg-white/78 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e0ecff] text-[#2563eb]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{text}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 bottom-4 top-10 rounded-[2.5rem] bg-[#93c5fd]/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="rounded-[1.6rem] bg-[#0f172a] p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#93c5fd]">Workspace</div>
                      <div className="mt-2 text-2xl font-semibold tracking-tight">DDI Risk Assessment</div>
                    </div>
                    <div className="rounded-full bg-[#1e3a5f] px-3 py-1 text-xs font-semibold text-[#bfdbfe]">
                      Protected
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Substance Input", value: "Formula, SMILES, PK profile" },
                      { label: "System Parameters", value: "Qh, Qent, kdeg and fm terms" },
                      { label: "Intermediate Values", value: "Ih, Igut, Ient and ABC factors" },
                      { label: "Final Reports", value: "CYP and transporter risk outputs" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">
                          {item.label}
                        </div>
                        <div className="mt-2 text-sm text-[#e2e8f0]">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.5rem] border border-[#dbeafe] bg-[#f8fbff] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[#0f172a]">Assessment Flow</div>
                      <div className="rounded-full bg-[#dbeafe] px-2.5 py-1 text-[11px] font-semibold text-[#2563eb]">
                        Guarded
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        "Open homepage",
                        "Request platform access",
                        "Verify user identity",
                        "Enter assessment workspace",
                      ].map((step, idx) => (
                        <div key={step} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] text-xs font-semibold text-white">
                            {idx + 1}
                          </div>
                          <div className="text-sm text-[#334155]">{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(assessmentEntryPath)}
                    className="group flex flex-col justify-between rounded-[1.5rem] border border-[#cbd5e1] bg-[#ecfdf5] p-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[#0f766e]">
                        User Verification
                      </div>
                      <div className="mt-3 text-2xl font-semibold tracking-tight text-[#0f172a]">
                        Validate user before entering the platform
                      </div>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0f766e]">
                      Continue
                      <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
