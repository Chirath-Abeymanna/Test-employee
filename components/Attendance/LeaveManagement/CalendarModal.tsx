import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface CalendarModalProps {
  open: boolean;
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
  fromDate?: Date;
  disablePastDates?: boolean;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  selectedDate,
  onSelect,
  onClose,
  fromDate,
  disablePastDates,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Select Leave Date
        </h3>
        <DayPicker
          mode="single"
          className="text-gray-900"
          selected={selectedDate ?? undefined}
          onSelect={(date) => date && onSelect(date)}
          fromDate={
            fromDate ?? new Date(new Date().setDate(new Date().getDate() + 1))
          }
          disabled={
            disablePastDates
              ? [
                  {
                    before: new Date(
                      new Date().setDate(new Date().getDate() + 1)
                    ),
                  },
                ]
              : undefined
          }
        />
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
