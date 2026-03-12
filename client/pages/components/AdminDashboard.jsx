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
  const [activeTab, setActiveTab] = useState("users");

  // Profile verification state
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState("all");
  const [verifyingId, setVerifyingId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // OAuth client state
  const [oauthClients, setOauthClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientSecret, setNewClientSecret] = useState(null);
  const [editingIpsId, setEditingIpsId] = useState(null);
  const [editIpsValue, setEditIpsValue] = useState("");

  // Audit log state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const [auditFilter, setAuditFilter] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchUsers();
    fetchProfiles();
    fetchOAuthClients();
    fetchAuditLogs();
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

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const res = await http.get("/api/profile/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfiles(res.data.profiles || []);
    } catch {
      // ignore
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchOAuthClients = async () => {
    setLoadingClients(true);
    try {
      const res = await http.get("/oauth/clients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOauthClients(res.data.clients || []);
    } catch {
      // ignore
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchAuditLogs = async (page = 0, action = "") => {
    setLoadingLogs(true);
    try {
      const params = { limit: 30, offset: page * 30 };
      if (action) params.action = action;
      const res = await http.get("/api/audit", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.total || 0);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setCreatingClient(true);
    try {
      const res = await http.post(
        "/oauth/clients",
        { name: newClientName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewClientSecret(res.data.client);
      setNewClientName("");
      fetchOAuthClients();
    } catch {
      alert("Клиент үүсгэхэд алдаа гарлаа");
    } finally {
      setCreatingClient(false);
    }
  };

  const handleToggleClient = async (id, isActive) => {
    try {
      await http.patch(
        `/oauth/clients/${id}`,
        { isActive },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setOauthClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive } : c)),
      );
    } catch {
      alert("Алдаа гарлаа");
    }
  };

  const handleDeleteClient = async (id) => {
    if (!confirm("Энэ клиентийг устгах уу?")) return;
    try {
      await http.delete(`/oauth/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOauthClients((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Устгахад алдаа гарлаа");
    }
  };

  const handleSaveIps = async (id) => {
    try {
      const allowedIps = editIpsValue
        .split(",")
        .map((ip) => ip.trim())
        .filter(Boolean);
      await http.put(
        `/oauth/clients/${id}/ips`,
        { allowedIps },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setOauthClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, allowedIps } : c)),
      );
      setEditingIpsId(null);
    } catch {
      alert("IP хадгалахад алдаа гарлаа");
    }
  };

  const handleVerify = async (profileId) => {
    setVerifyingId(profileId);
    try {
      await http.patch(
        `/api/profile/${profileId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, isVerified: true } : p)),
      );
      setSelectedProfile(null);
    } catch {
      alert("Баталгаажуулахад алдаа гарлаа");
    } finally {
      setVerifyingId(null);
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

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition ${
              activeTab === "users"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            👥 Хэрэглэгчид
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              activeTab === "profiles"
                ? "bg-yellow-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            📋 Профайл баталгаажуулалт
            {profiles.filter((p) => !p.isVerified).length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {profiles.filter((p) => !p.isVerified).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("oauth")}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              activeTab === "oauth"
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            🔐 API Клиент (OAuth2)
          </button>
          <button
            onClick={() => {
              setActiveTab("audit");
              fetchAuditLogs(0, auditFilter);
            }}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            📊 Аудит лог
          </button>
        </div>

        {activeTab === "users" && (
          <>
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
                <p className="text-3xl font-bold text-blue-400">
                  {users.length}
                </p>
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
                                  roleColors[u.role] ||
                                  "bg-gray-700 text-gray-300"
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
          </>
        )}

        {activeTab === "profiles" && (
          <>
            {/* Profile stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => setProfileFilter("all")}
                className={`bg-gray-800 rounded-xl border p-5 text-center transition ${
                  profileFilter === "all"
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <p className="text-3xl font-bold text-blue-400">
                  {profiles.length}
                </p>
                <p className="text-gray-400 text-sm mt-1">Нийт өргөдөл</p>
              </button>
              <button
                onClick={() => setProfileFilter("pending")}
                className={`bg-gray-800 rounded-xl border p-5 text-center transition ${
                  profileFilter === "pending"
                    ? "border-yellow-500 ring-1 ring-yellow-500"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <p className="text-3xl font-bold text-yellow-400">
                  {profiles.filter((p) => !p.isVerified).length}
                </p>
                <p className="text-gray-400 text-sm mt-1">Хүлээгдэж буй</p>
              </button>
              <button
                onClick={() => setProfileFilter("verified")}
                className={`bg-gray-800 rounded-xl border p-5 text-center transition ${
                  profileFilter === "verified"
                    ? "border-green-500 ring-1 ring-green-500"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <p className="text-3xl font-bold text-green-400">
                  {profiles.filter((p) => p.isVerified).length}
                </p>
                <p className="text-gray-400 text-sm mt-1">Баталгаажсан</p>
              </button>
            </div>

            {/* Profiles table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                    📋
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Оюутны өргөдлүүд</h3>
                    <p className="text-xs text-gray-500">
                      Профайл мэдээлэл шалгаж баталгаажуулах
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  placeholder="Нэр, РД, утас хайх..."
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full sm:w-64"
                />
              </div>

              {loadingProfiles ? (
                <div className="text-center py-10 text-gray-500">
                  Ачааллаж байна...
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Өргөдөл байхгүй
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="text-left px-5 py-3">Овог Нэр</th>
                        <th className="text-left px-5 py-3">РД</th>
                        <th className="text-left px-5 py-3">Утас</th>
                        <th className="text-left px-5 py-3">Аймаг</th>
                        <th className="text-left px-5 py-3">Огноо</th>
                        <th className="text-left px-5 py-3">Төлөв</th>
                        <th className="text-left px-5 py-3">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles
                        .filter((p) => {
                          if (profileFilter === "pending") return !p.isVerified;
                          if (profileFilter === "verified") return p.isVerified;
                          return true;
                        })
                        .filter((p) => {
                          if (!profileSearch) return true;
                          const q = profileSearch.toLowerCase();
                          return (
                            p.lastName.toLowerCase().includes(q) ||
                            p.firstName.toLowerCase().includes(q) ||
                            p.registerNumber.toLowerCase().includes(q) ||
                            (p.user?.phone || "").includes(q)
                          );
                        })
                        .map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                          >
                            <td className="px-5 py-3">
                              {p.lastName} {p.firstName}
                            </td>
                            <td className="px-5 py-3 text-gray-300 font-mono">
                              {p.registerNumber}
                            </td>
                            <td className="px-5 py-3 text-gray-300">
                              {p.user?.phone || "—"}
                            </td>
                            <td className="px-5 py-3 text-gray-400">
                              {p.province}
                            </td>
                            <td className="px-5 py-3 text-gray-400">
                              {new Date(p.createdAt).toLocaleDateString(
                                "mn-MN",
                              )}
                            </td>
                            <td className="px-5 py-3">
                              {p.isVerified ? (
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-900/50 text-green-400">
                                  Баталгаажсан ✓
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-900/50 text-yellow-400">
                                  Хүлээгдэж буй
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedProfile(p)}
                                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                  Дэлгэрэнгүй
                                </button>
                                {!p.isVerified && (
                                  <button
                                    onClick={() => handleVerify(p.id)}
                                    disabled={verifyingId === p.id}
                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition disabled:opacity-50"
                                  >
                                    {verifyingId === p.id ? "..." : "Батлах"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "oauth" && (
          <>
            {/* New client secret display */}
            {newClientSecret && (
              <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-emerald-400 mb-3">
                  ✅ Шинэ клиент амжилттай үүслээ!
                </h3>
                <p className="text-yellow-400 text-sm mb-4">
                  ⚠️ client_secret зөвхөн нэг удаа харагдана. Хадгалж аваарай!
                </p>
                <div className="space-y-2 bg-gray-900 rounded-lg p-4 font-mono text-sm">
                  <div>
                    <span className="text-gray-400">name: </span>
                    <span className="text-white">{newClientSecret.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">client_id: </span>
                    <span className="text-emerald-400">
                      {newClientSecret.clientId}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">client_secret: </span>
                    <span className="text-yellow-400">
                      {newClientSecret.clientSecret}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setNewClientSecret(null)}
                  className="mt-4 text-sm text-gray-400 hover:text-white transition"
                >
                  Хаах
                </button>
              </div>
            )}

            {/* Create new client */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">
                Шинэ API клиент үүсгэх
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Системийн нэр (жишээ: Mobile App, Partner)"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleCreateClient}
                  disabled={creatingClient || !newClientName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {creatingClient ? "Үүсгэж байна..." : "+ Үүсгэх"}
                </button>
              </div>
            </div>

            {/* How to use */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
              <h3 className="font-semibold text-lg mb-3">📖 Хэрхэн ашиглах</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-2">
                <p className="text-gray-500">// 1. Access token авах</p>
                <p>
                  <span className="text-blue-400">POST</span>{" "}
                  <span className="text-emerald-400">/oauth/token</span>
                </p>
                <p className="text-gray-500">
                  {"{"}client_id, client_secret, grant_type:
                  &quot;client_credentials&quot;{"\}"}
                </p>
                <p className="mt-2 text-gray-500">
                  // 2. API дуудахдаа Header-т:
                </p>
                <p>
                  <span className="text-purple-400">Authorization:</span> Bearer
                  ACCESS_TOKEN
                </p>
              </div>
            </div>

            {/* Clients list */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                    🔐
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">API Клиентүүд</h3>
                    <p className="text-xs text-gray-500">
                      {oauthClients.length} бүртгэлтэй систем
                    </p>
                  </div>
                </div>
              </div>

              {loadingClients ? (
                <div className="text-center py-10 text-gray-500">
                  Ачааллаж байна...
                </div>
              ) : oauthClients.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  API клиент бүртгэгдээгүй байна
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="text-left px-5 py-3">Нэр</th>
                        <th className="text-left px-5 py-3">Client ID</th>
                        <th className="text-left px-5 py-3">IP Whitelist</th>
                        <th className="text-left px-5 py-3">Токен</th>
                        <th className="text-left px-5 py-3">Төлөв</th>
                        <th className="text-left px-5 py-3">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oauthClients.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                        >
                          <td className="px-5 py-3 font-medium">{c.name}</td>
                          <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                            {c.clientId.slice(0, 8)}...
                          </td>
                          <td className="px-5 py-3">
                            {editingIpsId === c.id ? (
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={editIpsValue}
                                  onChange={(e) =>
                                    setEditIpsValue(e.target.value)
                                  }
                                  placeholder="103.1.2.3, 10.0.0.1"
                                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white w-40 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <button
                                  onClick={() => handleSaveIps(c.id)}
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingIpsId(null)}
                                  className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer group"
                                onClick={() => {
                                  setEditingIpsId(c.id);
                                  setEditIpsValue(
                                    (c.allowedIps || []).join(", "),
                                  );
                                }}
                              >
                                {c.allowedIps && c.allowedIps.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {c.allowedIps.map((ip) => (
                                      <span
                                        key={ip}
                                        className="text-xs bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded font-mono"
                                      >
                                        {ip}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500 group-hover:text-gray-300">
                                    Бүх IP (дарж засах)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-400">
                            {c._count?.tokens || 0}
                          </td>
                          <td className="px-5 py-3">
                            {c.isActive ? (
                              <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-900/50 text-green-400">
                                Идэвхтэй
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-900/50 text-red-400">
                                Идэвхгүй
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleToggleClient(c.id, !c.isActive)
                                }
                                className={`text-xs px-3 py-1 rounded transition ${
                                  c.isActive
                                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                              >
                                {c.isActive ? "Зогсоох" : "Идэвхжүүлэх"}
                              </button>
                              <button
                                onClick={() => handleDeleteClient(c.id)}
                                className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                              >
                                Устгах
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "audit" && (
          <>
            {/* Audit filter */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                    📊
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Аудит лог</h3>
                    <p className="text-xs text-gray-500">
                      Нийт {auditTotal} бүртгэл
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-auto">
                  <select
                    value={auditFilter}
                    onChange={(e) => {
                      setAuditFilter(e.target.value);
                      setAuditPage(0);
                      fetchAuditLogs(0, e.target.value);
                    }}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Бүх үйлдэл</option>
                    <option value="profile">Профайл</option>
                    <option value="oauth">OAuth</option>
                    <option value="login">Нэвтрэлт</option>
                  </select>
                  <button
                    onClick={() => fetchAuditLogs(auditPage, auditFilter)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    Шинэчлэх
                  </button>
                </div>
              </div>
            </div>

            {/* Audit table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {loadingLogs ? (
                <div className="text-center py-10 text-gray-500">
                  Ачааллаж байна...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Лог бүртгэл байхгүй
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="text-left px-5 py-3">Огноо</th>
                        <th className="text-left px-5 py-3">Үйлдэл</th>
                        <th className="text-left px-5 py-3">User ID</th>
                        <th className="text-left px-5 py-3">Client ID</th>
                        <th className="text-left px-5 py-3">Зорилт</th>
                        <th className="text-left px-5 py-3">IP хаяг</th>
                        <th className="text-left px-5 py-3">Дэлгэрэнгүй</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                        >
                          <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("mn-MN")}
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-900/50 text-purple-400">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-300">
                            {log.userId || "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                            {log.clientId
                              ? log.clientId.slice(0, 8) + "..."
                              : "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-300 text-xs">
                            {log.targetType
                              ? `${log.targetType} #${log.targetId}`
                              : "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                            {log.ipAddress || "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                            {log.details || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {auditTotal > 30 && (
                <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {auditPage * 30 + 1} -{" "}
                    {Math.min((auditPage + 1) * 30, auditTotal)} / {auditTotal}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const p = Math.max(0, auditPage - 1);
                        setAuditPage(p);
                        fetchAuditLogs(p, auditFilter);
                      }}
                      disabled={auditPage === 0}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded transition disabled:opacity-50"
                    >
                      ← Өмнөх
                    </button>
                    <button
                      onClick={() => {
                        const p = auditPage + 1;
                        setAuditPage(p);
                        fetchAuditLogs(p, auditFilter);
                      }}
                      disabled={(auditPage + 1) * 30 >= auditTotal}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded transition disabled:opacity-50"
                    >
                      Дараах →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Profile detail modal */}
        {selectedProfile && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Профайл дэлгэрэнгүй</h3>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Овог</span>
                  <span className="font-medium">
                    {selectedProfile.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Нэр</span>
                  <span className="font-medium">
                    {selectedProfile.firstName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Регистрийн дугаар</span>
                  <span className="font-medium font-mono">
                    {selectedProfile.registerNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Төрсөн огноо</span>
                  <span className="font-medium">
                    {new Date(selectedProfile.birthDate).toLocaleDateString(
                      "mn-MN",
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Хүйс</span>
                  <span className="font-medium">
                    {selectedProfile.gender === "male" ? "Эрэгтэй" : "Эмэгтэй"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Аймаг / Хот</span>
                  <span className="font-medium">
                    {selectedProfile.province}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Сум / Дүүрэг</span>
                  <span className="font-medium">
                    {selectedProfile.district}
                  </span>
                </div>
                {selectedProfile.examId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">ЭЕШ дугаар</span>
                    <span className="font-medium">
                      {selectedProfile.examId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Утас</span>
                  <span className="font-medium">
                    {selectedProfile.user?.phone || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Төлөв</span>
                  {selectedProfile.isVerified ? (
                    <span className="text-green-400 font-medium">
                      Баталгаажсан ✓
                    </span>
                  ) : (
                    <span className="text-yellow-400 font-medium">
                      Хүлээгдэж буй
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                {!selectedProfile.isVerified && (
                  <button
                    onClick={() => handleVerify(selectedProfile.id)}
                    disabled={verifyingId === selectedProfile.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {verifyingId === selectedProfile.id
                      ? "Баталгаажуулж байна..."
                      : "✓ Баталгаажуулах"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition"
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
