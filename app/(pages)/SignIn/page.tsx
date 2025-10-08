"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { useLayout } from "@/components/LayoutContext";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setIsNavigating } = useLayout();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/SignIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success && data.token) {
        setIsNavigating(true); // Start navigation state
        localStorage.setItem("employee_token", data.token);
        window.dispatchEvent(new Event("storage"));
        // Fetch employee details to get company id
        try {
          const empRes = await fetch("/api/employee", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
          });
          const empData = await empRes.json();
          if (empData.success && empData.data && empData.data.company) {
            // Fetch company details
            const companyRes = await fetch(
              `/api/company?id=${empData.data.company}`
            );
            const companyData = await companyRes.json();
            if (companyData.success && companyData.data) {
              // Set company cookie using POST
              await fetch("/api/company", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(companyData.data),
              });
            }
          }
        } catch (err) {
          // Ignore company fetch/set error
        }
        // Navigate immediately and reset navigation state quickly
        router.push("/profile");
        // Reset navigation state after a very short delay
        setTimeout(() => {
          setIsNavigating(false);
        }, 50);
      } else {
        setError(data.message || "Sign in failed");
      }
    } catch (err) {
      setLoading(false);
      setIsNavigating(false); // Reset navigation state on error
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen min-w-screen absolute  flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-300 to-cyan-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md border border-gray-100 flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center shadow-lg mb-2">
            <FontAwesomeIcon
              icon={faLock}
              className="text-white text-xl sm:text-2xl"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Team Member Sign In
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm text-center">
            Welcome back! Please sign in to continue.
          </p>
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-semibold text-gray-700">
            Email
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FontAwesomeIcon icon={faEnvelope} />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border text-gray-400 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:text-black focus:ring-blue-400 transition"
              required
              placeholder="your@opticalsapces.com"
              autoComplete="username"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">
            Password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 text-gray-400 rounded-lg focus:outline-none focus:text-black focus:ring-2 focus:ring-blue-400 transition"
              required
              placeholder="Password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-2 text-red-600 text-xs sm:text-sm text-center font-medium bg-red-50 rounded-lg py-2 px-3">
            {error}
          </div>
        )}
        <button
          type="submit"
          className={`w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-lg font-bold text-base sm:text-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
