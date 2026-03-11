import Link from "next/link";
import { useEffect, useState } from "react";

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
    const roleLabels = {
      student: "Оюутан",
      teacher: "Багш",
      staff: "Ажилтан",
      admin: "Админ",
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">MNUAC</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {roleLabels[user.role] || user.role}
              </span>
              <span className="font-medium text-gray-700">
                {user.name || user.phone}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Гарах
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Сайн байна уу, {user.name || user.phone}!
          </h2>
          <p className="text-gray-500 mb-8">
            Таны эрх: {roleLabels[user.role] || user.role}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-2">📋 Миний мэдээлэл</h3>
              <p className="text-gray-600 text-sm">Утас: {user.phone}</p>
              <p className="text-gray-600 text-sm">Нэр: {user.name || "—"}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-2">🔔 Мэдэгдэл</h3>
              <p className="text-gray-400 text-sm">Шинэ мэдэгдэл байхгүй</p>
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
            className="px-5 py-2 text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition"
          >
            Нэвтрэх
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
