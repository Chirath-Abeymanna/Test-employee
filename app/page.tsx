"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const token = localStorage.getItem("employee_token");
    if (token) {
      window.location.replace("/profile");
    } else {
      window.location.replace("/SignIn");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-lg text-gray-500">
      Redirecting...
    </div>
  );
}
