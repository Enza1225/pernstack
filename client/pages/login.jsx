import Link from "next/link";
import { useState } from "react";
import http from "../api/http";

export default function LoginPage() {
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
        role: "student",
      });

      const { user } = response.data;

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
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Оюутан нэвтрэх</h1>

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
              className="w-full px-4 py-2 border rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition"
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

        <p className="text-center mt-4 text-gray-600">
          Бүртгэлгүй юу?{" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Бүртгүүлэх
          </a>
        </p>

        <div className="mt-4 pt-4 border-t text-center text-sm text-gray-400">
          <Link href="/staff-login" className="text-purple-600 hover:underline">
            Багш / Ажилтан нэвтрэх
          </Link>
          <span className="mx-2">|</span>
          <Link href="/admin-login" className="text-gray-500 hover:underline">
            Админ
          </Link>
        </div>
      </form>
    </div>
  );
}
