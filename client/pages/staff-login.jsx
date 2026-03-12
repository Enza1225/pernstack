import Link from "next/link";
import { useState } from "react";
import http from "../api/http";

export default function StaffLoginPage() {
  const [step, setStep] = useState(1); // 1: phone, 2: code
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fullPhone = phone.startsWith("+976") ? phone : `+976${phone}`;

  const handleSendCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      await http.post("/api/auth/send-code", { phone: fullPhone });
      setStep(2);
      setMessage("Баталгаажуулах код илгээгдлээ");
    } catch (error) {
      setMessage(error.response?.data?.message || "Код илгээхэд алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const response = await http.post("/api/auth/login-with-code", {
        phone: fullPhone,
        code,
        roles: ["teacher", "staff"],
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

  const handleResend = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      await http.post("/api/auth/send-code", { phone: fullPhone });
      setMessage("Шинэ код илгээгдлээ!");
      setCode("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Код илгээхэд алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📚</div>
          <h1 className="text-2xl font-bold text-purple-700">Багш / Ажилтан</h1>
          <p className="text-gray-500 text-sm mt-1">Утасны дугаараар нэвтрэх</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm font-medium">
                Утасны дугаар
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-lg text-gray-500 text-sm">
                  +976
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  className="w-full px-4 py-3 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || phone.length < 8}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium"
            >
              {isLoading ? "Илгээж байна..." : "Код авах"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <p className="text-sm text-gray-500 mb-4 text-center">
              <span className="font-medium text-gray-700">{fullPhone}</span> руу
              код илгээгдлээ
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm font-medium">
                Баталгаажуулах код
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="6 оронтой код"
                maxLength={6}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg tracking-widest"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium mb-3"
            >
              {isLoading ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCode("");
                  setMessage("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Дугаар солих
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-purple-600 hover:text-purple-800"
              >
                Дахин илгээх
              </button>
            </div>
          </form>
        )}

        {message && (
          <p
            className={`mt-4 text-sm text-center ${
              message.includes("алдаа") || message.includes("denied")
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 pt-4 border-t text-center text-sm text-gray-400">
          <Link href="/login" className="text-purple-600 hover:underline">
            Оюутан нэвтрэх
          </Link>
          <span className="mx-2">|</span>
          <Link href="/admin-login" className="text-gray-500 hover:underline">
            Админ
          </Link>
        </div>
      </div>
    </div>
  );
}
