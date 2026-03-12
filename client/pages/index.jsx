import Link from "next/link";
import { useEffect, useState } from "react";
import http from "../api/http";
import AdminDashboard from "./components/AdminDashboard";
import StaffDashboard from "./components/StaffDashboard";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    // Check admin auth first
    const storedAdmin = localStorage.getItem("adminUser");
    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin));
        return;
      } catch {}
    }

    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        if (parsed.role === "student") {
          fetchProfile();
        }
      } catch {}
    }
  }, []);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await http.get("/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data.profile);
    } catch {
      // no profile
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleAdminLogout = async () => {
    try {
      await http.post("/api/admin/auth/logout");
    } catch {}
    localStorage.removeItem("adminUser");
    setAdminUser(null);
  };

  // Админ dashboard (separate auth)
  if (adminUser) {
    return <AdminDashboard user={adminUser} onLogout={handleAdminLogout} />;
  }

  // Нэвтэрсэн хэрэглэгч
  if (user) {
    // Багш / Ажилтан dashboard
    if (user.role === "teacher" || user.role === "staff") {
      return <StaffDashboard user={user} onLogout={handleLogout} />;
    }

    // Оюутан dashboard (default)
    const roleLabels = {
      student: "Оюутан",
      teacher: "Багш",
      staff: "Ажилтан",
      admin: "Админ",
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white shadow relative z-30">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-indigo-600">MNUAC</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                {roleLabels[user.role] || user.role}
              </span>

              {/* Notification icon */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotif(!showNotif);
                    setShowProfile(false);
                  }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-600"
                >
                  🔔
                </button>
                {showNotif && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800 text-sm">
                      Мэдэгдэл
                    </div>
                    <div className="p-6 text-center text-gray-400">
                      <p className="text-3xl mb-1">📭</p>
                      <p className="text-xs">Шинэ мэдэгдэл байхгүй</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile icon */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfile(!showProfile);
                    setShowNotif(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-100 hover:bg-indigo-200 transition text-indigo-700 font-bold text-sm"
                >
                  {(user.name || user.phone).charAt(0).toUpperCase()}
                </button>
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">
                        {user.name || "—"}
                      </p>
                      <p className="text-xs text-gray-500">{user.phone}</p>
                    </div>
                    {profileLoading ? (
                      <div className="p-4 text-sm text-gray-400">
                        Ачааллаж байна...
                      </div>
                    ) : profile ? (
                      <div className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Овог</span>
                          <span className="text-gray-800 font-medium">
                            {profile.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Нэр</span>
                          <span className="text-gray-800 font-medium">
                            {profile.firstName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">РД</span>
                          <span className="text-gray-800 font-mono text-xs">
                            {profile.registerNumber}
                          </span>
                        </div>
                        <Link
                          href="/profile"
                          className="block text-center text-xs text-indigo-600 hover:underline pt-1"
                        >
                          Дэлгэрэнгүй →
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4">
                        <p className="text-sm text-orange-600 mb-2">
                          Мэдээлэл бөглөөгүй
                        </p>
                        <Link
                          href="/profile"
                          className="text-sm text-indigo-600 hover:underline"
                        >
                          Мэдээлэл бөглөх →
                        </Link>
                      </div>
                    )}
                    <div className="border-t border-gray-100 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        Гарах
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Welcome */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-8 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-1">
              Сайн байна уу, {user.name || user.phone}! 👋
            </h2>
            <p className="text-indigo-100">
              {roleLabels[user.role] || user.role} — MNUAC мэдээллийн систем
            </p>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Profile status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                  📋
                </div>
                <h3 className="font-semibold text-gray-800">Хувийн мэдээлэл</h3>
              </div>
              {profileLoading ? (
                <p className="text-sm text-gray-400">Ачааллаж байна...</p>
              ) : !profile ? (
                <div>
                  <p className="text-sm text-orange-600 mb-3">
                    Бөглөөгүй байна
                  </p>
                  <Link
                    href="/profile"
                    className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Мэдээлэл бөглөх
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {profile.lastName} {profile.firstName}
                  </p>
                  <Link
                    href="/profile"
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Дэлгэрэнгүй →
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                  �
                </div>
                <h3 className="font-semibold text-gray-800">Хөтөлбөр</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Элсэх хөтөлбөрөө сонгоно уу
              </p>
              <Link
                href="/programs"
                className="inline-block bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Хөтөлбөр харах
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">
                  📊
                </div>
                <h3 className="font-semibold text-gray-800">Дүн</h3>
              </div>
              <p className="text-sm text-gray-400">Удахгүй нэмэгдэнэ...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Landing page — нэвтрээгүй хэрэглэгч
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-indigo-700">MNUAC</h1>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-5 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
          >
            Оюутан
          </Link>
          <Link
            href="/staff-login"
            className="px-5 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition"
          >
            Багш / Ажилтан
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Бүртгүүлэх
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <h2 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Монгол Улсын Их Сургуулийн
          <br />
          <span className="text-indigo-600">Мэдээллийн Систем</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          Багш, ажилтан, оюутан нарт зориулсан нэгдсэн платформ. Хичээлийн
          хуваарь, дүн, мэдэгдэл бүгдийг нэг дороос.
        </p>
        <div className="flex gap-4">
          <Link
            href="/register"
            className="px-8 py-3 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 transition shadow-lg"
          >
            Эхлэх
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border-2 border-indigo-300 text-indigo-600 text-lg rounded-lg hover:bg-indigo-50 transition"
          >
            Нэвтрэх
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-semibold mb-2">Оюутан</h3>
            <p className="text-gray-500">
              Хичээлийн бүртгэл, дүн шалгах, цахим материал авах
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Багш</h3>
            <p className="text-gray-500">
              Хичээл удирдах, дүн оруулах, оюутнуудтай холбогдох
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold mb-2">Ажилтан</h3>
            <p className="text-gray-500">
              Сургуулийн үйл ажиллагаа, тайлан хяналт, удирдлага
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        © 2026 MNUAC. Бүх эрх хуулиар хамгаалагдсан.
      </footer>
    </div>
  );
}
