import { useEffect, useRef, useState } from "react";

interface MoleculeViewerProps {
  smiles: string;
  width?: number;
  height?: number;
}

export function MoleculeViewer({ smiles, width = 190, height = 190 }: MoleculeViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const svg = svgRef.current;

      if (!svg) {
        return;
      }

      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      if (!smiles || smiles.trim() === "") {
        setRenderError(null);
        return;
      }

      try {
        const SD = await import("smiles-drawer");
        if (cancelled) return;

        // Get the SmiDrawer class from the default export
        const SmilesDrawerNS = SD.default || SD;
        const SmiDrawer = SmilesDrawerNS.SmiDrawer;

        if (!SmiDrawer) {
          console.warn("SmiDrawer not found in smiles-drawer module");
          setRenderError("Renderer unavailable");
          return;
        }

        const drawer = new SmiDrawer({
          width,
          height,
          bondThickness: 1.2,
          bondLength: 14,
          shortBondLength: 0.6,
          bondSpacing: 0.18 * 14,
          atomVisualization: "default",
          terminalCarbons: false,
          explicitHydrogens: false,
          overlapSensitivity: 0.42,
          compactDrawing: true,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 10,
          padding: 6,
          themes: {
            light: {
              C: "#334155",
              O: "#dc2626",
              N: "#2563eb",
              F: "#16a34a",
              S: "#ca8a04",
              Cl: "#16a34a",
              P: "#ea580c",
              Br: "#9333ea",
              I: "#7c3aed",
              H: "#94a3b8",
              BACKGROUND: "#f8fafc",
            },
          },
        });

        setRenderError(null);
        drawer.draw(
          smiles.trim(),
          svg,
          "light",
          () => {
            if (!cancelled) {
              setRenderError(null);
            }
          },
          (err: unknown) => {
            if (cancelled) {
              return;
            }

            while (svg.firstChild) {
              svg.removeChild(svg.firstChild);
            }

            console.warn("SMILES draw error:", err);
            setRenderError("Unable to render 2D structure");
          }
        );
      } catch (e) {
        console.warn("SmilesDrawer error:", e);
        if (!cancelled) {
          setRenderError("Unable to render 2D structure");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [smiles, width, height]);

  if (!smiles || smiles.trim() === "") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 bg-[#f8fafc] rounded-lg"
        style={{ width, height }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.93 4.93 2.83 2.83" />
          <path d="m16.24 16.24 2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="m4.93 19.07 2.83-2.83" />
          <path d="m16.24 7.76 2.83-2.83" />
        </svg>
        <span className="text-[10px] text-[#94a3b8] text-center px-4 leading-relaxed">
          Enter SMILES to display<br />2D structure
        </span>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg bg-[#f8fafc]" style={{ width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full rounded-lg"
        aria-label="2D structure depiction"
      />
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[10px] leading-relaxed text-[#94a3b8]">
          {renderError}
        </div>
      )}
    </div>
  );
}
