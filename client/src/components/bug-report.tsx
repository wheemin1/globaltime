import { AlertCircle } from "lucide-react";

interface BugReportProps {
  position?: "top" | "bottom";
}

export function BugReport({ position = "bottom" }: BugReportProps) {
  const positionClass = position === "top" 
    ? "top-0 mt-4" 
    : "bottom-0 mb-4";

  return (
    <div className={`fixed ${positionClass} right-0 mr-4 z-50`}>
      <a
        href="mailto:jowheemin@gmail.com?subject=TimeSync Bug Report"
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-lg transition-colors"
      >
        <AlertCircle className="w-5 h-5" />
        <span>Report Bug</span>
      </a>
    </div>
  );
}
