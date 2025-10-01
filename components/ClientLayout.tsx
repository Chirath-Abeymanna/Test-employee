"use client";
import SidePanel from "./SidePanel";
import { useLayout } from "./LayoutContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignIn, isAuthenticated, isNavigating, setSidePanelOpen } =
    useLayout();
  return (
    <>
      {/* Mobile Title Bar with Hamburger - fixed at top */}
      {!isSignIn && isAuthenticated && !isNavigating && (
        <div className="sm:hidden w-full flex items-center justify-between px-4 py-4 bg-gray-50  text-black shadow-md fixed top-0 left-0 z-50">
          <button
            className="p-2 rounded-lg flex items-center justify-center"
            onClick={() => setSidePanelOpen(true)}
            aria-label="Open navigation menu"
          >
            <FontAwesomeIcon icon={faBars} className="w-6 h-6 text-black" />
          </button>
          <div className="text-lg font-bold">Optical Spaces</div>
        </div>
      )}
      {/* Only show SidePanel if not on SignIn page and not navigating */}
      {!isSignIn && isAuthenticated && !isNavigating && <SidePanel />}
      <div className="flex-1 w-full pt-16 lg:pt-0">{children}</div>
    </>
  );
}
