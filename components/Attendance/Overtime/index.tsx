import React, { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface OvertimeProps {
  onSubmit: (hours: number) => void;
  loading?: boolean;
  overtimeMessage?: string;
}

const Overtime: React.FC<OvertimeProps> = ({
  onSubmit,
  loading,
  overtimeMessage,
}) => {
  const handleUndo = () => {
    setSuccess(false);
    setShowInput(false);
    setHours(1);
    setError("");
  };
  const [showInput, setShowInput] = useState(false);
  const [hours, setHours] = useState<number>(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleButtonClick = () => {
    setShowInput(true);
    setSuccess(false);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || hours < 1 || hours > 5) {
      setError("Please select a valid number of hours (1-5)");
      setSuccess(false);
      return;
    }
    setError("");
    onSubmit(hours);
    setSuccess(true);
    setShowInput(false);
    setHours(1);
  };

  return (
    <div className="mt-8 mb-10 flex flex-col items-center">
      <div className="w-full max-w-sm bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Overtime Request
        </h3>
        {!showInput && !success && (
          <button
            className="w-full px-4 py-2 bg-blue-600 text-white rounded transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={handleButtonClick}
            disabled={loading}
          >
            Add Overtime
          </button>
        )}
        {showInput && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 animate-fade-in"
          >
            <label
              htmlFor="overtime-hours"
              className="text-sm font-medium text-gray-700"
            >
              How many overtime hours?
            </label>
            <Select
              value={String(hours)}
              onValueChange={(val) => setHours(Number(val))}
              disabled={loading}
            >
              <SelectTrigger id="overtime-hours" className="mb-2">
                <SelectValue placeholder="Select hours" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <span className="text-red-500 text-xs">{error}</span>}
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                disabled={loading}
              >
                Submit
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded transition hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={handleUndo}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {success && (
          <div className="mt-3 text-green-600 text-sm text-center animate-fade-in">
            Overtime submitted successfully!
            <div className="mt-2 text-sm text-blue-700">{overtimeMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overtime;
