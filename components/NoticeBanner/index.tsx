import React from "react";

const NoticeBanner: React.FC<{ signedOutTime: Date }> = ({ signedOutTime }) => {
  const formattedTime = signedOutTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-600 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div>
          <h4 className="text-sm font-semibold text-amber-800 mb-1">
            Important Notice
          </h4>
          <p className="text-sm text-amber-700">
            Auto sign-out occurs at {formattedTime} daily. If you don&apos;t
            sign in by {formattedTime}, you&apos;ll be marked absent for the
            day.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoticeBanner;
