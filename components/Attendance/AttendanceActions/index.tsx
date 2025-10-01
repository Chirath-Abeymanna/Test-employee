import React from "react";
import { Button } from "@/components/ui/button"; // shadcn-ui button
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // shadcn-ui card
import { formatSriLankaTime } from "@/utils/timezone";

type Status = "idle" | "signedIn" | "signedOut";
type Location = "WFH" | "WFO" | "";

interface AttendanceActionsProps {
  status: Status;
  loading: boolean;
  showLocationChoice: boolean;
  signOutTime: Date | null;
  hours: number;
  onSignInClick: () => void;
  onSignIn: (location: Location) => void;
  onSignOut: () => void;
}

const AttendanceActions: React.FC<AttendanceActionsProps> = ({
  status,
  loading,
  showLocationChoice,
  signOutTime,
  hours,
  onSignInClick,
  onSignIn,
  onSignOut,
}) => {
  const formatTime = (date: Date) => {
    return formatSriLankaTime(date);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <h3 className="text-lg font-semibold text-blue-900">
          Attendance Actions
        </h3>
      </CardHeader>
      <CardContent>
        {status === "idle" && (
          <div className="space-y-4">
            <Button
              className="w-full py-5 bg-blue-600 hover:bg-blue-700"
              variant="default"
              disabled={loading}
              onClick={onSignInClick}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            {showLocationChoice && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
                <p className="sm:col-span-2 text-center text-sm font-medium text-blue-700 mb-2">
                  Choose your work location for today:
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={loading}
                  onClick={() => onSignIn("WFH")}
                >
                  Work From Home
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={loading}
                  onClick={() => onSignIn("WFO")}
                >
                  Work From Office
                </Button>
              </div>
            )}
          </div>
        )}

        {status === "signedIn" && (
          <Button
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            variant="default"
            disabled={loading}
            onClick={onSignOut}
          >
            {loading ? "Signing Out..." : "Sign Out"}
          </Button>
        )}

        {status === "signedOut" && (
          <div className="text-center p-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              Day Complete!
            </h4>
            <p className="text-blue-700">
              Signed out at {signOutTime && formatTime(signOutTime)}
            </p>
            <p className="text-sm text-blue-500">
              Total hours worked: <span className="font-semibold">{hours}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceActions;
