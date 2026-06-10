import { useEffect } from "react";
import { DDIProvider, useDDI } from "@/hooks/useDDIStore";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SubstanceTab } from "@/components/SubstanceTab";
import { SystemTab } from "@/components/SystemTab";
import { IntermediateTab } from "@/components/IntermediateTab";
import { ReportTab } from "@/components/ReportTab";
import { TransporterReportTab } from "@/components/TransporterReportTab";
import { SupportInfoTab } from "@/components/SupportInfoTab";
import {
  Activity,
  ArrowLeftRight,
  Beaker,
  Calculator,
  Dna,
  FileText,
  FlaskConical,
  LogOut,
  Microscope,
  Pill,
} from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import "./App.css";

const icons = [FlaskConical, Pill, Microscope, Beaker, Dna, Calculator, Activity, ArrowLeftRight, FileText];

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
        active
          ? "text-[#0f172a]"
          : "text-[#64748b] hover:text-[#334155]"
      }`}
    >
      {label}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6] rounded-full" />}
    </button>
  );
}

function AssessmentContent() {
  const { state, dispatch } = useDDI();
  const { user } = useAuth();
  const navigate = useNavigate();

  const tabs = [
    { id: "substance", label: "Substance Input" },
    { id: "system", label: "System Parameters" },
    { id: "intermediate", label: "Intermediate Values" },
    { id: "report", label: "CYP DDI Report" },
    { id: "tr_report", label: "Transporter DDI Report" },
    { id: "support", label: "Support Information" },
  ];

  const pageTitle = tabs.find((tab) => tab.id === state.activeTab)?.label || "Substance Input";

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#f1f5f9]">
      <aside className="w-14 min-w-[56px] bg-[#0f172a] flex flex-col items-center pt-4 gap-3 h-screen overflow-hidden shadow-lg z-20">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-md mb-2">
          <FlaskConical className="w-5 h-5 text-white" />
        </div>

        <div className="w-7 h-px bg-[#334155]" />

        {icons.map((Icon, index) => (
          <button
            key={index}
            type="button"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
              index === 0
                ? "bg-[#1e3a5f] text-[#60a5fa]"
                : "text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1e293b]"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
          </button>
        ))}

        <div className="mt-auto mb-4">
          <span className="[writing-mode:vertical-rl] rotate-180 bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-white text-[10px] font-bold px-1.5 py-2 rounded-full shadow-md tracking-wider">
            PRD
          </span>
        </div>
      </aside>

      <div className="flex-1 h-screen flex flex-col overflow-hidden min-w-0">
        <header className="flex-shrink-0 h-14 bg-white border-b border-[#e2e8f0] flex items-center px-6 gap-4 shadow-sm z-10">
          <h1 className="text-sm font-semibold text-[#0f172a] tracking-wide">DDI Risk Assessment</h1>
          <div className="w-px h-5 bg-[#e2e8f0]" />
          <span className="text-xs text-[#64748b] font-medium">{pageTitle}</span>
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                {user.displayName}
              </span>
            )}
            <span className="text-[10px] font-semibold text-[#059669] bg-[#d1fae5] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Ready
            </span>
            <button
              type="button"
              onClick={() => navigate("/logout", { replace: true })}
              className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#475569] transition-colors hover:bg-[#f8fafc]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </header>

        <nav className="flex-shrink-0 bg-white border-b border-[#e2e8f0] px-6 flex gap-1">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={state.activeTab === tab.id}
              onClick={() => dispatch({ type: "SET_TAB", tab: tab.id })}
            />
          ))}
        </nav>

        <main className="flex-1 min-h-0 min-w-0 overflow-hidden bg-[#f1f5f9]">
          {state.activeTab === "substance" && <SubstanceTab />}
          {state.activeTab === "system" && <SystemTab />}
          {state.activeTab === "intermediate" && <IntermediateTab />}
          {state.activeTab === "report" && <ReportTab />}
          {state.activeTab === "tr_report" && <TransporterReportTab />}
          {state.activeTab === "support" && <SupportInfoTab />}
        </main>
      </div>
    </div>
  );
}

function ProtectedAssessment() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return (
    <DDIProvider>
      <AssessmentContent />
    </DDIProvider>
  );
}

function LogoutHandler() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<LogoutHandler />} />
        <Route path="/assessment" element={<ProtectedAssessment />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
