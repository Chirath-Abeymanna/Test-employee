// Utility to decode JWT and get employeeId
export function getEmployeeIdFromToken(token: string): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.employeeId;
  } catch {
    return null;
  }
}
