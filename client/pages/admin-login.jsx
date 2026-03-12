import Link from "next/link";
import { useState } from "react";
import http from "../api/http";

export default function AdminLoginPage() {
  // Steps: 1=email+password, 2=totp-setup (QR), 3=totp-verify
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [totpSecret, setTotpSecret] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Email + Password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const res = await http.post("/api/admin/auth/login", {
        email,
        password,
      });

      if (res.data.requireTotp) {
        setAdminId(res.data.adminId);
        setStep(3);
        setMessage("");
      } else if (res.data.requireTotpSetup) {
        setAdminId(res.data.adminId);
        const setupRes = await http.post("/api/admin/auth/setup-totp", {
          adminId: res.data.adminId,
        });
        setQrCode(setupRes.data.qrCode);
        setTotpSecret(setupRes.data.secret);
        setStep(2);
        setMessage("");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Enable TOTP after scanning QR
  const handleEnableTotp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const res = await http.post("/api/admin/auth/enable-totp", {
        adminId,
        totpCode,
      });

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.admin));

      setMessage("TOTP амжилттай идэвхжлээ!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "TOTP баталгаажуулахад алдаа",
      );
      setTotpCode("");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify TOTP code
  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const res = await http.post("/api/admin/auth/verify-totp", {
        adminId,
        totpCode,
      });

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.admin));

      setMessage("Амжилттай нэвтэрлээ!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || "TOTP код буруу");
      setTotpCode("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Админ нэвтрэх</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 && "Имэйл + нууц үг"}
            {step === 2 && "TOTP тохиргоо — Authenticator апп"}
            {step === 3 && "Authenticator код оруулах"}
          </p>
        </div>

        {/* Step 1: Email + Password */}
        {step === 1 && (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1.5 text-sm font-medium">
                Имэйл
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mnuac.edu.mn"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                autoComplete="email"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-1.5 text-sm font-medium">
                Нууц үг
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
            >
              {isLoading ? "Шалгаж байна..." : "Нэвтрэх"}
            </button>
          </form>
        )}

        {/* Step 2: TOTP Setup (QR Code) */}
        {step === 2 && (
          <form onSubmit={handleEnableTotp}>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm font-medium mb-1">
                ⚠️ Анхны тохиргоо
              </p>
              <p className="text-yellow-700 text-xs">
                Google Authenticator эсвэл Microsoft Authenticator апп-аар доорх
                QR кодыг уншуулна уу.
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center mb-4">
                <img
                  src={qrCode}
                  alt="TOTP QR Code"
                  className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                />
              </div>
            )}

            {totpSecret && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">
                  Гараар оруулах код (QR уншигдахгүй бол):
                </p>
                <p className="text-sm font-mono text-gray-800 break-all select-all">
                  {totpSecret}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 mb-1.5 text-sm font-medium">
                Authenticator код (6 орон)
              </label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-2xl tracking-[0.3em] font-mono"
                required
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || totpCode.length < 6}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
            >
              {isLoading ? "Баталгаажуулж байна..." : "TOTP идэвхжүүлэх"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setTotpCode("");
                setQrCode(null);
                setTotpSecret(null);
                setMessage("");
              }}
              className="w-full mt-2 text-gray-500 text-sm hover:text-gray-700"
            >
              ← Буцах
            </button>
          </form>
        )}

        {/* Step 3: TOTP Verify */}
        {step === 3 && (
          <form onSubmit={handleVerifyTotp}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                📱 Authenticator апп дахь 6 оронтой кодыг оруулна уу
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1.5 text-sm font-medium">
                Authenticator код
              </label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-2xl tracking-[0.3em] font-mono"
                required
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || totpCode.length < 6}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
            >
              {isLoading ? "Шалгаж байна..." : "Нэвтрэх"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setTotpCode("");
                setMessage("");
              }}
              className="w-full mt-2 text-gray-500 text-sm hover:text-gray-700"
            >
              ← Имэйл / нууц үг руу буцах
            </button>
          </form>
        )}

        {message && (
          <p
            className={`mt-4 text-sm text-center ${
              message.includes("амжилттай") ||
              message.includes("Амжилттай") ||
              message.includes("идэвхж")
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 pt-4 border-t text-center text-sm text-gray-400">
          <Link href="/login" className="text-blue-500 hover:underline">
            Оюутан
          </Link>
          <span className="mx-2">|</span>
          <Link href="/staff-login" className="text-purple-500 hover:underline">
            Багш / Ажилтан
          </Link>
        </div>
      </div>
    </div>
  );
}
