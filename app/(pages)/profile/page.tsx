"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { getEmployeeIdFromToken } from "@/utils/jwt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faSignOutAlt,
  faCalendarDay,
  faUser,
  faDollarSign,
  faCalendarCheck,
  faBuilding,
  faInfoCircle,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface Employee {
  _id: string;
  name: string;
  role: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  image?: string | null;
  company: string;
  email: string;
  sickDaysPerMonth: number;
  salary?: number;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeProfile() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem("employee_token");
        if (!token) {
          router.push("/SignIn");
          return;
        }

        // Get employee ID from token
        const employeeId = getEmployeeIdFromToken(token);
        if (!employeeId) {
          setError("Invalid token");
          localStorage.removeItem("employee_token");
          router.push("/SignIn");
          return;
        }

        // Fetch employee data
        const response = await fetch(`/api/employee`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setEmployee(data.data);
          // Fetch company details using company id
          if (data.data.company) {
            try {
              const companyRes = await fetch(
                `/api/company?id=${data.data.company}`
              );
              const companyData = await companyRes.json();
              if (companyData.success && companyData.data) {
                setCompanyName(companyData.data.company_name);
              }
            } catch (err) {
              console.log("Error fetching company data:", err);
            }
          }
        } else {
          setError(data.message || "Failed to fetch employee data");
          if (response.status === 401 || response.status === 404) {
            localStorage.removeItem("employee_token");
            router.push("/SignIn");
          }
        }
      } catch (err) {
        setError("Failed to load employee data");
        console.error("Error fetching employee data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("employee_token");
    document.cookie =
      "company=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/SignIn");
  };

  function formatDate(date: string | Date) {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  if (loading) {
    return <Loading message="Loading employee profile..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="w-12 h-12 text-red-500 mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No employee data found</p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logout */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32">
                {employee.image && employee.image.trim() !== "" ? (
                  <Image
                    src={employee.image}
                    width={128}
                    height={128}
                    alt="Employee Photo"
                    className="w-full h-full object-cover rounded-full border-4 border-blue-500 shadow-lg"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-4 border-blue-500 shadow-lg flex items-center justify-center">
                    <span className="text-white font-bold text-2xl sm:text-3xl">
                      {employee.name
                        ? employee.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                        : "?"}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
            </div>

            {/* Basic Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {employee.name}
              </h1>
              <p className="text-lg text-blue-600 font-semibold mb-2">
                {employee.role}
              </p>
              <p className="text-gray-600 mb-2">{employee.email}</p>
              {/* <p className="text-gray-500 text-sm">{employee.company}</p> */}
            </div>

            {/* Logout Button */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                Logout
              </button>
              <p className="text-xs text-gray-500 text-center">
                System ID: {employee._id.slice(-6)}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Details Card */}
        <Card className="mb-6">
          <CardHeader className="border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faIdCard}
                className="w-5 h-5 text-slate-600"
              />
              Personal Details
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Date of Birth */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon
                    icon={faCalendarDay}
                    className="w-5 h-5 text-cyan-600"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Date of Birth
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(employee.dob)}
                  </p>
                </div>
              </div>

              {/* Gender */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="w-5 h-5 text-blue-600"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Gender
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {employee.gender}
                  </p>
                </div>
              </div>

              {/* Base Salary */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="w-5 h-5 text-green-600"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Base Salary
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {employee.salary ? formatCurrency(employee.salary) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Leave Balance */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCalendarCheck}
                  className="w-5 h-5 text-green-600"
                />
                Leave Balance
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Annual Leave Days
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    {employee.sickDaysPerMonth} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faBuilding}
                  className="w-10 h-10 text-slate-700"
                />
                Company Info
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Company</span>
                  <span className="text-sm font-medium text-blue-600">
                    {companyName || employee.company}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="text-sm font-medium text-slate-600 break-words">
                    {employee.role}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  className="w-5 h-5 text-blue-600"
                />
                Account Info
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-blue-600">
                    {formatDate(employee.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium text-gray-700">
                    {formatDate(employee.updatedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
