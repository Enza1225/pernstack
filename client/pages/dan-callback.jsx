import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import http from "../api/http";

export default function DanCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("ДАН системээс мэдээлэл авч байна...");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const { code, state, error: authError } = router.query;

    if (authError) {
      setError(true);
      setMessage("ДАН системээр нэвтрэхээс татгалзсан");
      return;
    }

    if (!code || !state) {
      setError(true);
      setMessage("Буруу хандалт");
      return;
    }

    const savedState = localStorage.getItem("danState");
    if (state !== savedState) {
      setError(true);
      setMessage("Аюулгүй байдлын шалгалт амжилтгүй. Дахин оролдоно уу.");
      return;
    }

    localStorage.removeItem("danState");

    handleCallback(code, state);
  }, [router.isReady, router.query]);

  const handleCallback = async (code, state) => {
    try {
      const res = await http.post("/api/auth/dan/callback", { code, state });

      const { user, isNew } = res.data;
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

      setMessage(
        isNew
          ? "ДАН системээр амжилттай бүртгэгдлээ! Шилжиж байна..."
          : "ДАН системээр амжилттай нэвтэрлээ! Шилжиж байна...",
      );
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      setError(true);
      setMessage(
        err.response?.data?.message || "ДАН системээр нэвтрэхэд алдаа гарлаа",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        {!error && (
          <div className="mb-4">
            <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <p className={`text-lg ${error ? "text-red-600" : "text-gray-700"}`}>
          {message}
        </p>

        {error && (
          <div className="mt-6 space-y-3">
            <a
              href="/login"
              className="block w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Нэвтрэх хуудас руу буцах
            </a>
            <a
              href="/register"
              className="block w-full py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Бүртгүүлэх
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
