import Link from "next/link";
import { useEffect, useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import StaffDashboard from "./components/StaffDashboard";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Нэвтэрсэн хэрэглэгч
  if (user) {
    // Багш / Ажилтан dashboard
    if (user.role === "teacher" || user.role === "staff") {
      return <StaffDashboard user={user} onLogout={handleLogout} />;
    }

    // Админ dashboard
    if (user.role === "admin") {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
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
        <nav className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-indigo-600">MNUAC</h1>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                {roleLabels[user.role] || user.role}
              </span>
              <span className="font-medium text-gray-700 text-sm">
                {user.name || user.phone}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 transition"
              >
                Гарах
              </button>
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
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                  👤
                </div>
                <h3 className="font-semibold text-gray-800">Миний мэдээлэл</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  Нэр:{" "}
                  <span className="text-gray-800 font-medium">
                    {user.name || "—"}
                  </span>
                </p>
                <p>
                  Утас:{" "}
                  <span className="text-gray-800 font-medium">
                    {user.phone}
                  </span>
                </p>
                <p>
                  Эрх:{" "}
                  <span className="text-gray-800 font-medium">
                    {roleLabels[user.role] || user.role}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                  📅
                </div>
                <h3 className="font-semibold text-gray-800">
                  Хичээлийн хуваарь
                </h3>
              </div>
              <p className="text-sm text-gray-400">Удахгүй нэмэгдэнэ...</p>
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

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">
                🔔
              </div>
              <h3 className="font-semibold text-gray-800">Мэдэгдэл</h3>
            </div>
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm">Шинэ мэдэгдэл байхгүй</p>
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
