import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

function getRedirectTarget(search: string) {
  const redirect = new URLSearchParams(search).get("redirect");
  if (!redirect || !redirect.startsWith("/")) {
    return "/assessment";
  }
  if (redirect.startsWith("//")) {
    return "/assessment";
  }
  return redirect;
}

function VerificationShowcase() {
  const accessRules = [
    "登录前先完成用户身份校验。",
    "验证通过后开放 DDI 工作区。",
    "平台内支持参数录入、结果查看与报告导出。",
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f2d57] p-8 text-white shadow-[0_30px_70px_-40px_rgba(15,23,42,0.65)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(96,165,250,0.18),_transparent_26%),radial-gradient(circle_at_80%_22%,_rgba(34,197,94,0.12),_transparent_20%),linear-gradient(180deg,_rgba(15,23,42,0)_0%,_rgba(15,23,42,0.28)_100%)]" />
      <div className="login-grid-shift absolute inset-0 opacity-[0.16]" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#bfdbfe]">
          <ShieldCheck className="h-4 w-4" />
          User Verification
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1.05fr)_240px] md:items-start">
          <div>
            <h1 className="max-w-[10ch] text-5xl font-semibold leading-[0.96] tracking-[-0.05em]">
              登录验证通过后，进入 DDI 工作区。
            </h1>
            <p className="mt-5 max-w-[34ch] text-[15px] leading-7 text-[#d7e4f8]">
              平台访问入口采用用户验证控制。通过账号校验后，可进入 DDI Risk Assessment
              工作区，继续参数录入、风险评估与报告导出。
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8eb4e6]">
              Access Rules
            </div>
            <div className="mt-4 space-y-3">
              {accessRules.map((rule, index) => (
                <div
                  key={rule}
                  className="flex gap-3 rounded-2xl border border-white/8 bg-[#15345f]/70 px-3 py-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d4f8c] text-[11px] font-semibold text-[#dbeafe]">
                    {index + 1}
                  </div>
                  <div className="text-sm leading-6 text-[#d7e4f8]">{rule}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8eb4e6]">
                Verification Flow
              </div>
              <div className="mt-1 text-sm text-[#c8d7ee]">
                身份校验激活后进入受保护平台内容。
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-[#102848]/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#bfdbfe]">
              Active
            </div>
          </div>

          <div className="relative h-[340px] overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)]">
            <div className="login-orb absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#60a5fa]/30 bg-[radial-gradient(circle,_rgba(96,165,250,0.18)_0%,_rgba(59,130,246,0.08)_48%,_transparent_70%)]" />
            <div
              className="login-orb absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#22c55e]/15"
              style={{ animationDuration: "14s" }}
            />

            <div className="absolute left-[18%] top-[50%] h-px w-[64%] -translate-y-1/2 bg-[linear-gradient(90deg,rgba(96,165,250,0.15),rgba(96,165,250,0.65),rgba(34,197,94,0.22))]" />
            <div className="login-flow-line absolute left-[18%] top-[50%] h-[3px] w-[64%] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,transparent,rgba(191,219,254,0.95),transparent)]" />

            <div className="login-card-float absolute left-[7%] top-[34%] w-[27%] rounded-[1.2rem] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173f73] text-[#bfdbfe]">
                <ArrowRight className="h-4 w-4 rotate-180" />
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8eb4e6]">
                Entry
              </div>
              <div className="mt-2 text-base font-semibold">Platform Request</div>
              <div className="mt-2 text-sm leading-6 text-[#c8d7ee]">
                用户发起进入平台请求。
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#60a5fa]/30 bg-[#123765] shadow-[0_0_0_16px_rgba(59,130,246,0.06)]">
              <div
                className="login-orb absolute inset-[-18px] rounded-full border border-[#93c5fd]/20"
                style={{ animationDuration: "9s" }}
              />
              <ShieldCheck className="h-9 w-9 text-[#dbeafe]" />
            </div>

            <div
              className="login-card-float absolute right-[7%] top-[24%] w-[28%] rounded-[1.2rem] border border-white/12 bg-white/8 p-4 backdrop-blur-sm"
              style={{ animationDelay: "-2.2s" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173f73] text-[#bfdbfe]">
                <LockKeyhole className="h-4 w-4" />
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8eb4e6]">
                Access
              </div>
              <div className="mt-2 text-base font-semibold">Protected Workspace</div>
              <div className="mt-2 text-sm leading-6 text-[#c8d7ee]">
                验证通过后开放工作区内容。
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/12 bg-[#102848]/90 px-5 py-3 text-sm text-[#dbeafe] shadow-lg shadow-[#081326]/30">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
              Verification Signal Active
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, demoCredentials } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const redirectTarget = getRedirectTarget(location.search);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTarget]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const result = login(username, password);
    if (!result.ok) {
      setError(result.message ?? "验证失败。");
      return;
    }

    navigate(redirectTarget, { replace: true });
  }

  return (
    <main className="min-h-full overflow-auto bg-[#dbe6f2] text-[#0f172a]">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.14),_transparent_28%),linear-gradient(180deg,_#f3f7fb_0%,_#dbe6f2_100%)]" />
        <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-[#60a5fa]/20 blur-3xl" />
        <div className="absolute right-12 top-16 h-80 w-80 rounded-full bg-[#22c55e]/10 blur-3xl" />

        <div className="relative mx-auto grid min-h-screen max-w-[1240px] gap-10 px-6 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10">
          <div className="flex flex-col gap-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cbd5e1] bg-white/70 px-4 py-2 text-sm text-[#334155] shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </button>

            <VerificationShowcase />
          </div>

          <section className="flex items-center">
            <div className="w-full rounded-[2rem] border border-white/75 bg-white/86 p-8 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#64748b]">
                    Platform Login
                  </div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-[#0f172a]">
                    DDI Risk Assessment
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-[#dbeafe] bg-[#f8fbff] px-4 py-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">
                    云顶新耀
                  </div>
                  <img
                    src="/everest-medicines-logo-ch.png"
                    alt="云顶新耀 Everest Medicines"
                    className="h-11 w-auto object-contain"
                  />
                </div>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <div className="mb-2 text-sm font-semibold text-[#334155]">账号</div>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-3 shadow-sm focus-within:border-[#2563eb] focus-within:bg-white">
                    <UserRound className="h-4 w-4 text-[#64748b]" />
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="请输入用户名"
                      className="w-full border-0 bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
                      autoComplete="username"
                    />
                  </div>
                </label>

                <label className="block">
                  <div className="mb-2 text-sm font-semibold text-[#334155]">密码</div>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-3 shadow-sm focus-within:border-[#2563eb] focus-within:bg-white">
                    <LockKeyhole className="h-4 w-4 text-[#64748b]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="请输入密码"
                      className="w-full border-0 bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
                      autoComplete="current-password"
                    />
                  </div>
                </label>

                {error && (
                  <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
                    {error}
                  </div>
                )}

                <div className="rounded-[1.4rem] border border-[#dbeafe] bg-[#eff6ff] px-4 py-4 text-sm text-[#1d4ed8]">
                  当前为本地验证模式。登录成功后才可进入平台内页。
                  {demoCredentials && (
                    <div className="mt-2 font-mono text-[13px] text-[#0f172a]">
                      测试账号: {demoCredentials.username} / {demoCredentials.password}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#0f172a]/20 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#1e293b]"
                >
                  验证并登录平台
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
