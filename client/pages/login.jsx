import { useState } from "react";
import http from "../api/http";

const PORTALS = [
  {
    role: "teacher",
    label: "Багш",
    color: "green",
    bg: "bg-green-600",
    hover: "hover:bg-green-700",
    ring: "focus:ring-green-500",
    icon: "📚",
  },
  {
    role: "staff",
    label: "Ажилтан",
    color: "purple",
    bg: "bg-purple-600",
    hover: "hover:bg-purple-700",
    ring: "focus:ring-purple-500",
    icon: "🏢",
  },
  {
    role: "student",
    label: "Оюутан",
    color: "blue",
    bg: "bg-blue-500",
    hover: "hover:bg-blue-600",
    ring: "focus:ring-blue-500",
    icon: "🎓",
  },
];

export default function LoginPage() {
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const fullPhone = phone.startsWith("+976") ? phone : `+976${phone}`;
      const response = await http.post("/api/auth/login", {
        phone: fullPhone,
        password,
        role: selectedPortal.role,
      });

      const { user } = response.data;

      // Store token securely
      localStorage.setItem("token", user.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        }),
      );

      setMessage("Нэвтэрсэн!");

      // Redirect based on role
      const redirectMap = {
        user: "/",
        teacher: "/",
        staff: "/",
        admin: "/",
      };
      setTimeout(() => {
        window.location.href = redirectMap[user.role] || "/";
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  // Portal selection screen
  if (!selectedPortal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
          <h1 className="text-2xl font-bold mb-2 text-center">Нэвтрэх</h1>
          <p className="text-gray-500 text-center mb-6">
            Өөрийн эрхийг сонгоно уу
          </p>
          <div className="grid grid-cols-2 gap-4">
            {PORTALS.map((portal) => (
              <button
                key={portal.role}
                onClick={() => {
                  setSelectedPortal(portal);
                  setMessage("");
                  setPhone("");
                  setPassword("");
                }}
                className={`${portal.bg} ${portal.hover} text-white rounded-lg p-6 text-center transition-transform hover:scale-105`}
              >
                <span className="text-3xl block mb-2">{portal.icon}</span>
                <span className="font-semibold text-lg">{portal.label}</span>
              </button>
            ))}
          </div>

          <p className="text-center mt-6 text-gray-600">
            Бүртгэлгүй юу?{" "}
            <a href="/register" className="text-blue-500 hover:underline">
              Бүртгүүлэх
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Login form for selected role
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => {
              setSelectedPortal(null);
              setMessage("");
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            ← Буцах
          </button>
          <span
            className={`${selectedPortal.bg} text-white text-sm px-3 py-1 rounded-full`}
          >
            {selectedPortal.icon} {selectedPortal.label}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-6">
          {selectedPortal.label} нэвтрэх
        </h1>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Утасны дугаар</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 rounded-l text-gray-600">
              +976
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="XXXXXXXX"
              maxLength={8}
              className={`w-full px-4 py-2 border rounded-r focus:outline-none focus:ring-2 ${selectedPortal.ring}`}
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Нууц үг</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Нууц үг"
            className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 ${selectedPortal.ring}`}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full ${selectedPortal.bg} ${selectedPortal.hover} text-white py-2 rounded disabled:opacity-50`}
        >
          {isLoading ? "Нэвтэрч байна..." : "Нэвтрэх"}
        </button>

        {message && (
          <p
            className={`mt-4 text-center ${message.includes("Нэвтэрсэн") ? "text-green-600" : "text-red-600"}`}
          >
            {message}
          </p>
        )}

        {selectedPortal.role === "student" && (
          <p className="text-center mt-4 text-gray-600">
            Бүртгэлгүй юу?{" "}
            <a href="/register" className="text-blue-500 hover:underline">
              Бүртгүүлэх
            </a>
          </p>
        )}

        {selectedPortal.role === "staff" && (
          <p className="text-center mt-4 text-gray-400 text-sm">
            🔒 Энэ хэсэг зөвхөн эрх бүхий хүмүүст зориулагдсан
          </p>
        )}
      </form>
    </div>
  );
}
