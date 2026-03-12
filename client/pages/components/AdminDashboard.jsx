import { useEffect, useState } from "react";
import http from "../../api/http";

export default function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await http.get("/api/auth/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.users || []);
      } catch {
        // ignore
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const roleLabels = {
    student: "Оюутан",
    teacher: "Багш",
    staff: "Ажилтан",
    admin: "Админ",
  };

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">MNUAC</h1>
            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-medium">
              Админ
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-300 text-sm">
              {user.name || user.phone}
            </span>
            <button
              onClick={onLogout}
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Гарах
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-1">Админ самбар 🛡️</h2>
          <p className="text-gray-400">
            {user.name || user.phone} — Системийн удирдлага
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 text-center">
            <p className="text-3xl font-bold text-blue-400">{users.length}</p>
            <p className="text-gray-400 text-sm mt-1">Нийт хэрэглэгч</p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 text-center">
            <p className="text-3xl font-bold text-green-400">
              {roleCounts.student || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Оюутан</p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 text-center">
            <p className="text-3xl font-bold text-purple-400">
              {(roleCounts.teacher || 0) + (roleCounts.staff || 0)}
            </p>
            <p className="text-gray-400 text-sm mt-1">Багш / Ажилтан</p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 text-center">
            <p className="text-3xl font-bold text-red-400">
              {roleCounts.admin || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Админ</p>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
              👥
            </div>
            <h3 className="font-semibold text-lg">Хэрэглэгчид</h3>
          </div>

          {loadingUsers ? (
            <div className="text-center py-10 text-gray-500">
              Ачааллаж байна...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Хэрэглэгч олдсонгүй
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="text-left px-5 py-3">ID</th>
                    <th className="text-left px-5 py-3">Нэр</th>
                    <th className="text-left px-5 py-3">Утас</th>
                    <th className="text-left px-5 py-3">Эрх</th>
                    <th className="text-left px-5 py-3">Огноо</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                    >
                      <td className="px-5 py-3 text-gray-400">{u.id}</td>
                      <td className="px-5 py-3">{u.name || "—"}</td>
                      <td className="px-5 py-3 text-gray-300">{u.phone}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            u.role === "admin"
                              ? "bg-red-900/50 text-red-400"
                              : u.role === "teacher" || u.role === "staff"
                                ? "bg-purple-900/50 text-purple-400"
                                : "bg-blue-900/50 text-blue-400"
                          }`}
                        >
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString("mn-MN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
