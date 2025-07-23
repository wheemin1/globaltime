import { AlertCircle } from "lucide-react";

interface BugReportProps {
  position?: "top" | "bottom";
}

export function BugReport({ position = "bottom" }: BugReportProps) {
  const positionClass = position === "top" 
    ? "top-0 mt-2" 
    : "bottom-0 mb-2";

  return (
    <div className={`fixed ${positionClass} right-0 mr-2 z-50`}>
      <a
        href="mailto:jowheemin@gmail.com?subject=TimeSync Bug Report"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-md transition-colors"
      >
        <AlertCircle className="w-4 h-4" />
        <span>Report Bug</span>
      </a>
    </div>
  );
}
