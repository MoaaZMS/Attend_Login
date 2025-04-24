import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      {darkMode ? (
        <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
}

function DateTime() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm text-gray-600 dark:text-gray-400">
      <div className="font-medium">
        {date.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
      <div className="text-lg font-semibold">
        {date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-semibold">Attendance Tracker</h2>
          <DateTime />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const { toast } = useToast();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const todayStatus = useQuery(api.attendance.getTodayStatus);
  const stats = useQuery(api.attendance.getStats);
  const allRecords = useQuery(api.attendance.getAllAttendanceRecords);
  
  const checkIn = useMutation(api.attendance.checkIn);
  const checkOut = useMutation(api.attendance.checkOut);
  const resetStats = useMutation(api.attendance.resetSpecificStats);

  const handleCheckIn = async () => {
    try {
      await checkIn();
      toast({
        title: "Checked in successfully",
        description: "Your work day has started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check in",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      toast({
        title: "Checked out successfully",
        description: "Your work day has ended",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check out",
        variant: "destructive",
      });
    }
  };

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Attendance Tracker</h1>
        <Authenticated>
          <p className="text-xl text-gray-600 dark:text-gray-400">Welcome, {loggedInUser?.email ?? "friend"}!</p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-gray-600 dark:text-gray-400">Sign in to track your attendance</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Status</h2>
            {todayStatus ? (
              <div className="space-y-2">
                <p>Checked in at: {new Date(todayStatus.checkIn).toLocaleTimeString()}</p>
                {todayStatus.checkOut && (
                  <>
                    <p>Checked out at: {new Date(todayStatus.checkOut).toLocaleTimeString()}</p>
                    <p>Working hours: {todayStatus.workingHours?.toFixed(2)}</p>
                    {todayStatus.overtime && todayStatus.overtime > 0 && (
                      <p>Overtime hours: {todayStatus.overtime.toFixed(2)}</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p>No check-in recorded for today</p>
            )}
            <div className="mt-4">
              {!todayStatus && (
                <button
                  onClick={handleCheckIn}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Check In
                </button>
              )}
              {todayStatus && !todayStatus.checkOut && (
                <button
                  onClick={handleCheckOut}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  Check Out
                </button>
              )}
            </div>
          </div>

          {stats && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Working Days</p>
                  <p className="text-2xl font-semibold">{stats.totalDays}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Hours/Day</p>
                  <p className="text-2xl font-semibold">{stats.averageHours.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Overtime Hours</p>
                  <p className="text-2xl font-semibold">{stats.totalOvertime.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Compensatory Days</p>
                  <p className="text-2xl font-semibold">{stats.compensatoryDays}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={async () => {
                    try {
                      await resetStats();
                      toast({
                        title: "Reset successful",
                        description: "Compensatory Days and Total Overtime Hours have been reset",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to reset stats",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  Reset Overtime Stats
                </button>
                <button
                  onClick={() => {
                    if (!allRecords) return;

                    const data = [
                      ['Date', 'Check In', 'Check Out', 'Working Hours', 'Overtime'],
                      ...allRecords.map(record => [
                        record.date,
                        new Date(record.checkIn).toLocaleTimeString(),
                        record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-',
                        record.workingHours?.toFixed(2) || '-',
                        record.overtime?.toFixed(2) || '0'
                      ])
                    ];
                    
                    // Create CSV content
                    const csvContent = "data:text/csv;charset=utf-8," + data.map(row => row.join(",")).join("\n");
                    
                    // Create download link
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    toast({
                      title: "Export successful",
                      description: "Your attendance report has been downloaded",
                    });
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  Export to Excel
                </button>
              </div>
            </div>
          )}
        </div>
      </Authenticated>
    </div>
  );
}
