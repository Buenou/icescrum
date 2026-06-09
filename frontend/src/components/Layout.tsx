import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload } from "lucide-react";

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-brand font-semibold text-lg hover:opacity-80">
          <LayoutDashboard size={20} />
          IceScrum Dashboard
        </Link>
        <div className="flex-1" />
        <Link
          to="/upload"
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
            pathname === "/upload"
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <Upload size={14} />
          Importer
        </Link>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}