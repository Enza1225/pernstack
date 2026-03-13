import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import http from "../api/http";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await http.get("/api/profile/me");
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
    } catch {
      // no profile yet
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Ачааллаж байна...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">MNUAC</h1>
          <a href="/" className="text-sm text-indigo-600 hover:underline">
            Нүүр хуудас
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          {profile ? (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">✅</div>
                <h2 className="text-2xl font-bold text-green-700">
                  Хувийн мэдээлэл
                </h2>
                <p className="text-gray-500 mt-1">
                  ДАН системээс автоматаар татагдсан мэдээлэл
                </p>
                <a
                  href="/programs"
                  className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Хөтөлбөр сонгох
                </a>
              </div>

              <div className="border-t pt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Регистрийн дугаар</span>
                  <span className="font-medium">{profile.registerNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Овог</span>
                  <span className="font-medium">{profile.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Нэр</span>
                  <span className="font-medium">{profile.firstName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Төрсөн огноо</span>
                  <span className="font-medium">
                    {new Date(profile.birthDate).toLocaleDateString("mn-MN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Хүйс</span>
                  <span className="font-medium">
                    {profile.gender === "male" ? "Эрэгтэй" : "Эмэгтэй"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Аймаг / Хот</span>
                  <span className="font-medium">{profile.province}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Сум / Дүүрэг</span>
                  <span className="font-medium">{profile.district}</span>
                </div>
                {profile.examId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ЭЕШ дугаар</span>
                    <span className="font-medium">{profile.examId}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📋</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Профайл олдсонгүй
              </h2>
              <p className="text-gray-500 mb-4">
                ДАН системээр нэвтэрснээр таны мэдээлэл автоматаар бүртгэгдэнэ.
              </p>
              <a
                href="/login"
                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                ДАН-аар нэвтрэх
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
