"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useLayout } from "../LayoutContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faTimes,
  faUser,
  faClipboardList,
  faChartBar,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";

interface Employee {
  name: string;
  email: string;
  profilePhoto?: string;
}

export default function SidePanel({}: { onLogout?: () => void }) {
  // Get employee info from JWT and API
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  React.useEffect(() => {
    const token = localStorage.getItem("employee_token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const email = payload.email;
      // Fetch employee details from API
      fetch(`/api/employee`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("employee_token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setEmployee({
            name: data.data.name,
            email: email || data.data.email,
            profilePhoto: data.data.profilePhoto,
          });
        });
    } catch {
      setEmployee(null);
    }
  }, []);
  const { sidePanelOpen, setSidePanelOpen } = useLayout();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside on mobile
  useEffect(() => {
    if (!sidePanelOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSidePanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sidePanelOpen, setSidePanelOpen]);

  // Prevent body scroll when mobile panel is open
  useEffect(() => {
    if (sidePanelOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidePanelOpen]);

  // Desktop collapse/expand button
  const DesktopToggleButton = () => (
    <button
      className={`hidden lg:flex absolute right-0 top-5  w-10 h-10 bg-white border border-gray-300 rounded-full items-center justify-center shadow-md hover:shadow-lg hover:border-gray-400 transition-all duration-200 z-10 group ${
        sidePanelOpen ? "" : "right-3"
      }`}
      onClick={() => setSidePanelOpen(!sidePanelOpen)}
      aria-label={sidePanelOpen ? "Collapse sidebar" : "Expand sidebar"}
    >
      <FontAwesomeIcon
        icon={faChevronLeft}
        className={`w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-all duration-200 ${
          sidePanelOpen ? "rotate-0" : "rotate-180"
        }`}
      />
    </button>
  );

  // Mobile close button
  const MobileCloseButton = () => (
    <button
      className="sm:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-800 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors z-10"
      onClick={() => setSidePanelOpen(false)}
      aria-label="Close menu"
    >
      <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
    </button>
  );

  // Navigation items
  const navItems = [
    {
      href: "/profile",
      label: "Profile",
      icon: <FontAwesomeIcon icon={faUser} className="w-5 h-5" />,
    },
    {
      href: "/attendance",
      label: "Attendance",
      icon: <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5" />,
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <FontAwesomeIcon icon={faChartBar} className="w-5 h-5" />,
    },
  ];

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("employee_token");
    document.cookie =
      "company=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/SignIn";
  };

  return (
    <>
      {/* Mobile overlay - HIGHER Z-INDEX */}
      {sidePanelOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[50] sm:hidden transition-opacity duration-300"
          onClick={() => setSidePanelOpen(false)}
        />
      )}

      {/* Side Panel - HIGHEST Z-INDEX */}
      <aside
        ref={panelRef}
        className={`
    fixed top-0 left-0 h-screen bg-white shadow-xl z-[55] transition-all duration-300 ease-in-out overflow-hidden
    ${sidePanelOpen ? "w-72 sm:w-64" : "w-0 sm:w-16"}
  `}
        style={{ height: "100dvh" }}
      >
        <div
          className="h-full flex flex-col relative"
          style={{ height: "100dvh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r  flex-shrink-0">
            <div
              className={`transition-all duration-300 ${
                sidePanelOpen ? "opacity-100" : "opacity-0 sm:opacity-0"
              }`}
            >
              <h2 className="text-lg font-semibold text-slate-800">
                Team Member Panel
              </h2>
              <p className="text-blue-100 text-sm"> </p>
            </div>
            <MobileCloseButton />
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 py-6 px-4 overflow-y-auto overflow-x-hidden">
            <div className="space-y-5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-5 text-lg text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group ${
                    !sidePanelOpen ? "hover:bg-white" : " "
                  }`}
                  onClick={() => setSidePanelOpen(false)}
                  title={!sidePanelOpen ? item.label : undefined}
                >
                  <span
                    className={`flex-shrink-0 scale-110 group-hover:scale-130 transition-transform duration-200 ${
                      !sidePanelOpen
                        ? "mx-auto space-y-4 right-2 relative scale-130 hover:scale-150  "
                        : ""
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`font-medium transition-all duration-300 ${
                      sidePanelOpen
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2 sm:opacity-0"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer - Fixed at bottom with safe area padding */}
          <div
            className="border-t border-gray-200 p-4 pb-6 sm:pb-4 flex-shrink-0 bg-white"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {/* User info section */}
            <div
              className={`mb-4 flex items-center gap-3 ${
                !sidePanelOpen ? "justify-center" : ""
              }`}
            >
              {employee && employee.profilePhoto ? (
                <img
                  src={employee.profilePhoto}
                  alt={employee.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {employee && employee.name
                    ? employee.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                    : "?"}
                </div>
              )}
              {sidePanelOpen && employee && (
                <div className="transition-all duration-300 min-w-0 opacity-100 translate-x-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {employee.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {employee.email}
                  </p>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              className={`right-2 relative mb-2 sm:mb-0
    flex items-center gap-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 group
    ${
      sidePanelOpen
        ? "w-full px-4 py-3 justify-center"
        : "w-12 h-12 mx-auto justify-center"
    }
    ${!sidePanelOpen ? "flex-col" : ""}
  `}
              onClick={handleLogout}
              title={!sidePanelOpen ? "Log Out" : undefined}
            >
              <FontAwesomeIcon
                icon={faSignOutAlt}
                className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
              />
              {sidePanelOpen && (
                <span className="transition-all duration-300">Log Out</span>
              )}
            </button>
          </div>

          {/* Desktop Toggle Button */}
          <DesktopToggleButton />
        </div>
      </aside>
    </>
  );
}
