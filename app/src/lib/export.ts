export type CsvValue = string | number | boolean | null | undefined;

export interface CsvSection {
  title?: string;
  rows: CsvValue[][];
}

export type CsvExportResult =
  | {
      status: "saved";
      method: "file-picker";
      fileName: string;
    }
  | {
      status: "download-started";
      method: "anchor";
      fileName: string;
      fallbackFromFilePicker: boolean;
    }
  | {
      status: "cancelled";
      method: "file-picker";
      fileName: string;
    }
  | {
      status: "failed";
      method: "anchor";
      fileName: string;
      error: Error;
      fallbackFromFilePicker: boolean;
    };

export interface CsvExportFeedback {
  tone: "success" | "info" | "error";
  text: string;
}

interface FileSystemWritableFileStreamLike {
  write(data: Blob | string): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemFileHandleLike {
  createWritable(): Promise<FileSystemWritableFileStreamLike>;
}

interface SaveFilePickerOptionsLike {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

type SaveFilePickerLike = (options?: SaveFilePickerOptionsLike) => Promise<FileSystemFileHandleLike>;

function escapeCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  const normalized = text.replace(/\r?\n/g, " ").trim();

  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function buildCsvContent(sections: CsvSection[]): string {
  return sections
    .map((section) => {
      const lines: string[] = [];

      if (section.title) {
        lines.push(escapeCsvCell(section.title));
      }

      for (const row of section.rows) {
        lines.push(row.map((cell) => escapeCsvCell(cell)).join(","));
      }

      return lines.join("\r\n");
    })
    .join("\r\n\r\n");
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatTimestamp(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("") + `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function sanitizeFileNamePart(value: string): string {
  return value
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^A-Za-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "report";
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string" && error.trim()) {
    return new Error(error);
  }

  return new Error("Unable to export CSV report.");
}

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function startAnchorDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 30000);
}

async function saveWithFilePicker(blob: Blob, fileName: string): Promise<CsvExportResult | null> {
  const picker = (window as Window & { showSaveFilePicker?: SaveFilePickerLike }).showSaveFilePicker;

  if (typeof picker !== "function") {
    return null;
  }

  try {
    const handle = await picker({
      suggestedName: fileName,
      types: [
        {
          description: "CSV report",
          accept: {
            "text/csv": [".csv"],
          },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();

    return {
      status: "saved",
      method: "file-picker",
      fileName,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return {
        status: "cancelled",
        method: "file-picker",
        fileName,
      };
    }

    throw toError(error);
  }
}

export function formatCsvExportFeedback(result: CsvExportResult): CsvExportFeedback {
  switch (result.status) {
    case "saved":
      return {
        tone: "success",
        text: `Report saved as ${result.fileName}.`,
      };
    case "download-started":
      return {
        tone: "info",
        text: result.fallbackFromFilePicker
          ? `Save dialog was unavailable. Browser download started for ${result.fileName}.`
          : `Browser download started for ${result.fileName}.`,
      };
    case "cancelled":
      return {
        tone: "info",
        text: "Export cancelled. No file was saved.",
      };
    case "failed":
      return {
        tone: "error",
        text: result.error.message || "Unable to export CSV report.",
      };
  }
}

export async function downloadCsvReport(
  baseName: string,
  sections: CsvSection[],
  generatedAt = new Date(),
): Promise<CsvExportResult> {
  const fileName = `${sanitizeFileNamePart(baseName)}-${formatTimestamp(generatedAt)}.csv`;
  const content = `\uFEFF${buildCsvContent(sections)}`;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  let fallbackFromFilePicker = false;

  try {
    const pickerResult = await saveWithFilePicker(blob, fileName);
    if (pickerResult) {
      return pickerResult;
    }
  } catch (error) {
    fallbackFromFilePicker = true;
    console.warn("CSV export file picker failed, falling back to browser download.", error);
  }

  try {
    startAnchorDownload(blob, fileName);
    return {
      status: "download-started",
      method: "anchor",
      fileName,
      fallbackFromFilePicker,
    };
  } catch (error) {
    return {
      status: "failed",
      method: "anchor",
      fileName,
      error: toError(error),
      fallbackFromFilePicker,
    };
  }
}
