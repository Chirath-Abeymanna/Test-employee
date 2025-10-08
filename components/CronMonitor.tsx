"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CronResult {
  success: boolean;
  message: string;
  results?: {
    processedCompanies: number;
    autoSignedOutEmployees: number;
    errors: string[];
    timestamp: string;
  };
  error?: string;
}

export default function CronMonitor() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CronResult | null>(null);

  const testCronJob = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testMode: true }),
      });

      const result = await response.json();
      setLastResult(result);
    } catch (error) {
      setLastResult({
        success: false,
        message: "Failed to test cron job",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Cron Job Monitor
          </h2>
          <p className="text-gray-600">
            Test and monitor the auto sign-out cron job functionality
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={testCronJob}
            disabled={isLoading}
            className="px-6 py-2"
          >
            {isLoading ? "Testing..." : "Test Cron Job"}
          </Button>
        </div>

        {lastResult && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg ${
                lastResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    lastResult.success ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span
                  className={`font-semibold ${
                    lastResult.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {lastResult.success ? "Success" : "Failed"}
                </span>
              </div>
              <p
                className={`mt-1 ${
                  lastResult.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {lastResult.message}
              </p>
              {lastResult.error && (
                <p className="mt-2 text-sm text-red-600 font-mono">
                  Error: {lastResult.error}
                </p>
              )}
            </div>

            {lastResult.results && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-800">
                    {lastResult.results.processedCompanies}
                  </div>
                  <div className="text-blue-600 text-sm">
                    Companies Processed
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-800">
                    {lastResult.results.autoSignedOutEmployees}
                  </div>
                  <div className="text-green-600 text-sm">
                    Employees Auto Signed-Out
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border ${
                    lastResult.results.errors.length > 0
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      lastResult.results.errors.length > 0
                        ? "text-red-800"
                        : "text-gray-800"
                    }`}
                  >
                    {lastResult.results.errors.length}
                  </div>
                  <div
                    className={`text-sm ${
                      lastResult.results.errors.length > 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    Errors
                  </div>
                </div>
              </div>
            )}

            {lastResult.results?.errors &&
              lastResult.results.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
                  <ul className="space-y-1">
                    {lastResult.results.errors.map((error, index) => (
                      <li
                        key={index}
                        className="text-sm text-red-700 font-mono"
                      >
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {lastResult.results?.timestamp && (
              <div className="text-center text-sm text-gray-500">
                Last executed: {formatTimestamp(lastResult.results.timestamp)}
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-500 space-y-2">
          <p>
            <strong>Note:</strong> This is a test interface for development. In
            production, the cron job will be automatically triggered by
            cron-job.org.
          </p>
          <p>
            <strong>Setup:</strong> See CRON_SETUP.md for detailed setup
            instructions.
          </p>
        </div>
      </div>
    </Card>
  );
}
