export default function StaffDashboard({ user, onLogout }) {
  const roleLabel = user.role === "teacher" ? "Багш" : "Ажилтан";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-600">MNUAC</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              {roleLabel}
            </span>
            <span className="font-medium text-gray-700 text-sm">
              {user.name || user.phone}
            </span>
            <button
              onClick={onLogout}
              className="text-sm text-red-500 hover:text-red-700 transition"
            >
              Гарах
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-1">
            Сайн байна уу, {user.name || user.phone}! 👋
          </h2>
          <p className="text-purple-100">
            {roleLabel} — MNUAC мэдээллийн систем
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                👤
              </div>
              <h3 className="font-semibold text-gray-800">Миний мэдээлэл</h3>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>{user.name || "—"}</p>
              <p>{user.phone}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                📚
              </div>
              <h3 className="font-semibold text-gray-800">Хичээлүүд</h3>
            </div>
            <p className="text-sm text-gray-400">Удахгүй нэмэгдэнэ...</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                📊
              </div>
              <h3 className="font-semibold text-gray-800">Дүн бүртгэл</h3>
            </div>
            <p className="text-sm text-gray-400">Удахгүй нэмэгдэнэ...</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">
                📅
              </div>
              <h3 className="font-semibold text-gray-800">Хуваарь</h3>
            </div>
            <p className="text-sm text-gray-400">Удахгүй нэмэгдэнэ...</p>
          </div>
        </div>

        {/* Оюутнуудын жагсаалт / Мэдэгдэл */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl">
                🎓
              </div>
              <h3 className="font-semibold text-gray-800">Оюутнууд</h3>
            </div>
            <div className="text-center py-6 text-gray-400">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm">Удахгүй нэмэгдэнэ...</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">
                🔔
              </div>
              <h3 className="font-semibold text-gray-800">Мэдэгдэл</h3>
            </div>
            <div className="text-center py-6 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">Шинэ мэдэгдэл байхгүй</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
