import { useEffect, useState } from "react";
import http from "../../api/http";

export default function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
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

  const handleRoleChange = async (userId) => {
    setSaving(true);
    try {
      const res = await http.patch(
        `/api/auth/admin/users/${userId}/role`,
        { role: editRole },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? res.data.user : u)),
      );
      setEditingId(null);
    } catch {
      alert("Role өөрчлөхөд алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const roleLabels = {
    student: "Оюутан",
    teacher: "Багш",
    staff: "Ажилтан",
    admin: "Админ",
  };

  const roleColors = {
    admin: "bg-red-900/50 text-red-400",
    teacher: "bg-purple-900/50 text-purple-400",
    staff: "bg-purple-900/50 text-purple-400",
    student: "bg-blue-900/50 text-blue-400",
  };

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // Filter & search
  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (u.name || "").toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      String(u.id).includes(q);
    return matchRole && matchSearch;
  });

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

        {/* Stats - clickable role filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setRoleFilter("all")}
            className={`bg-gray-800 rounded-xl border p-5 text-center transition ${
              roleFilter === "all"
                ? "border-blue-500 ring-1 ring-blue-500"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <p className="text-3xl font-bold text-blue-400">{users.length}</p>
            <p className="text-gray-400 text-sm mt-1">Бүгд</p>
          </button>
          <button
            onClick={() => setRoleFilter("student")}
            className={`bg-gray-800 rounded-xl border p-5 text-center transition ${
              roleFilter === "student"
                ? "border-green-500 ring-1 ring-green-500"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <p className="text-3xl font-bold text-green-400">
              {roleCounts.student || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Оюутан</p>
          </button>
          <button
            onClick={() => setRoleFilter("teacher")}
            className={`bg-gray-800 rounded-xl border p-5 text-center transition ${
              roleFilter === "teacher"
                ? "border-purple-500 ring-1 ring-purple-500"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <p className="text-3xl font-bold text-purple-400">
              {roleCounts.teacher || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Багш</p>
          </button>
          <button
            onClick={() => setRoleFilter("staff")}
            className={`bg-gray-800 rounded-xl border p-5 text-center transition ${
              roleFilter === "staff"
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <p className="text-3xl font-bold text-indigo-400">
              {roleCounts.staff || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Ажилтан</p>
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`bg-gray-800 rounded-xl border p-5 text-center transition ${
              roleFilter === "admin"
                ? "border-red-500 ring-1 ring-red-500"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <p className="text-3xl font-bold text-red-400">
              {roleCounts.admin || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Админ</p>
          </button>
        </div>

        {/* Users table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Header with search */}
          <div className="p-5 border-b border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                👥
              </div>
              <div>
                <h3 className="font-semibold text-lg">Хэрэглэгчид</h3>
                <p className="text-xs text-gray-500">
                  {filtered.length} / {users.length} хэрэглэгч
                </p>
              </div>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Нэр, утас, ID хайх..."
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>

          {loadingUsers ? (
            <div className="text-center py-10 text-gray-500">
              Ачааллаж байна...
            </div>
          ) : filtered.length === 0 ? (
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
                    <th className="text-left px-5 py-3">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                    >
                      <td className="px-5 py-3 text-gray-400">{u.id}</td>
                      <td className="px-5 py-3">{u.name || "—"}</td>
                      <td className="px-5 py-3 text-gray-300">{u.phone}</td>
                      <td className="px-5 py-3">
                        {editingId === u.id ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="student">Оюутан</option>
                            <option value="teacher">Багш</option>
                            <option value="staff">Ажилтан</option>
                            <option value="admin">Админ</option>
                          </select>
                        ) : (
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              roleColors[u.role] || "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {roleLabels[u.role] || u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString("mn-MN")}
                      </td>
                      <td className="px-5 py-3">
                        {editingId === u.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRoleChange(u.id)}
                              disabled={saving}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition disabled:opacity-50"
                            >
                              {saving ? "..." : "Хадгалах"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition"
                            >
                              Болих
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(u.id);
                              setEditRole(u.role);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 transition"
                          >
                            Эрх солих
                          </button>
                        )}
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
