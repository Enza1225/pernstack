import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import http from "../api/http";

const PROVINCES = [
  "Улаанбаатар",
  "Архангай",
  "Баян-Өлгий",
  "Баянхонгор",
  "Булган",
  "Говь-Алтай",
  "Говьсүмбэр",
  "Дархан-Уул",
  "Дорноговь",
  "Дорнод",
  "Дундговь",
  "Завхан",
  "Орхон",
  "Өвөрхангай",
  "Өмнөговь",
  "Сүхбаатар",
  "Сэлэнгэ",
  "Төв",
  "Увс",
  "Ховд",
  "Хөвсгөл",
  "Хэнтий",
];

const CYRILLIC_LETTERS = [
  "А",
  "Б",
  "В",
  "Г",
  "Д",
  "Е",
  "Ё",
  "Ж",
  "З",
  "И",
  "Й",
  "К",
  "Л",
  "М",
  "Н",
  "О",
  "Ө",
  "П",
  "Р",
  "С",
  "Т",
  "У",
  "Ү",
  "Ф",
  "Х",
  "Ц",
  "Ч",
  "Ш",
  "Щ",
  "Ъ",
  "Ь",
  "Э",
  "Ю",
  "Я",
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastNameWarn, setLastNameWarn] = useState("");
  const [firstNameWarn, setFirstNameWarn] = useState("");

  const [form, setForm] = useState({
    regLetter1: "",
    regLetter2: "",
    regDigits: "",
    lastName: "",
    firstName: "",
    birthDate: "",
    gender: "",
    province: "",
    district: "",
    examId: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile(token);
  }, []);

  const fetchProfile = async (token) => {
    try {
      const res = await http.get("/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.profile) {
        setProfile(res.data.profile);
        setHasProfile(true);
      }
    } catch {
      // no profile yet
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (!form.regLetter1 || !form.regLetter2 || form.regDigits.length !== 8) {
      setMessage("Регистрийн дугаарыг бүрэн бөглөнө үү");
      setSaving(false);
      return;
    }

    const cyrillicOnly = /^[А-Яа-яӨөҮүЁё\s-]+$/;
    if (!form.lastName.trim() || !cyrillicOnly.test(form.lastName)) {
      setMessage("Овог зөвхөн монгол кирилл үсгээр бичигдсэн байх ёстой");
      setSaving(false);
      return;
    }
    if (!form.firstName.trim() || !cyrillicOnly.test(form.firstName)) {
      setMessage("Нэр зөвхөн монгол кирилл үсгээр бичигдсэн байх ёстой");
      setSaving(false);
      return;
    }
    if (
      !form.birthDate ||
      !form.gender ||
      !form.province ||
      !form.district.trim()
    ) {
      setMessage("Бүх шаардлагатай талбарыг бөглөнө үү");
      setSaving(false);
      return;
    }

    const registerNumber = form.regLetter1 + form.regLetter2 + form.regDigits;

    try {
      const token = localStorage.getItem("token");
      const res = await http.post(
        "/api/profile",
        {
          registerNumber,
          lastName: form.lastName,
          firstName: form.firstName,
          birthDate: form.birthDate,
          gender: form.gender,
          province: form.province,
          district: form.district,
          examId: form.examId,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProfile(res.data.profile);
      setHasProfile(true);
      setMessage("Мэдээлэл амжилттай илгээгдлээ!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Ачааллаж байна...</p>
      </div>
    );
  }

  // Profile already submitted
  if (hasProfile && profile) {
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
            <div className="text-center mb-6">
              {profile.isVerified ? (
                <>
                  <div className="text-5xl mb-3">✅</div>
                  <h2 className="text-2xl font-bold text-green-700">
                    Баталгаажсан
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Таны мэдээлэл баталгаажсан. Хөтөлбөр сонгох боломжтой.
                  </p>
                  <a
                    href="/programs"
                    className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Хөтөлбөр сонгох
                  </a>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">⏳</div>
                  <h2 className="text-2xl font-bold text-yellow-600">
                    Хүлээгдэж байна
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Таны мэдээлэл шалгагдаж байна. Баталгаажсны дараа хөтөлбөр
                    сонгох боломжтой болно.
                  </p>
                </>
              )}
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
          </div>
        </main>
      </div>
    );
  }

  // Profile form
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
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">📋</div>
            <h2 className="text-2xl font-bold text-gray-800">
              Хувийн мэдээлэл
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Элсэлтийн бүртгэлийн мэдээллээ бөглөнө үү
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Регистрийн дугаар */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Регистрийн дугаар *
              </label>
              <div className="flex gap-2">
                <select
                  name="regLetter1"
                  value={form.regLetter1}
                  onChange={handleChange}
                  className="w-20 px-2 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-medium"
                  required
                >
                  <option value="">-</option>
                  {CYRILLIC_LETTERS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <select
                  name="regLetter2"
                  value={form.regLetter2}
                  onChange={handleChange}
                  className="w-20 px-2 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-medium"
                  required
                >
                  <option value="">-</option>
                  {CYRILLIC_LETTERS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="regDigits"
                  value={form.regDigits}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setForm((f) => ({ ...f, regDigits: val }));
                  }}
                  placeholder="00000000"
                  maxLength={8}
                  className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Жишээ: АБ12345678</p>
            </div>

            {/* Овог, Нэр */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Овог *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = raw.replace(/[^А-Яа-яӨөҮүЁё\s-]/g, "");
                    if (raw !== val) {
                      setLastNameWarn(
                        "Зөвхөн монгол кирилл үсэг, зай, зураас (-) бичих боломжтой",
                      );
                    } else {
                      setLastNameWarn("");
                    }
                    setForm((f) => ({ ...f, lastName: val }));
                  }}
                  placeholder="Овог"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    lastNameWarn
                      ? "border-red-400 focus:ring-red-400"
                      : "focus:ring-indigo-500"
                  }`}
                  required
                />
                {lastNameWarn && (
                  <p className="text-xs text-red-500 mt-1">{lastNameWarn}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Нэр *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = raw.replace(/[^А-Яа-яӨөҮүЁё\s-]/g, "");
                    if (raw !== val) {
                      setFirstNameWarn(
                        "Зөвхөн монгол кирилл үсэг, зай, зураас (-) бичих боломжтой",
                      );
                    } else {
                      setFirstNameWarn("");
                    }
                    setForm((f) => ({ ...f, firstName: val }));
                  }}
                  placeholder="Нэр"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    firstNameWarn
                      ? "border-red-400 focus:ring-red-400"
                      : "focus:ring-indigo-500"
                  }`}
                  required
                />
                {firstNameWarn && (
                  <p className="text-xs text-red-500 mt-1">{firstNameWarn}</p>
                )}
              </div>
            </div>

            {/* Төрсөн огноо, Хүйс */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Төрсөн огноо *
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Хүйс *
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Сонгох</option>
                  <option value="male">Эрэгтэй</option>
                  <option value="female">Эмэгтэй</option>
                </select>
              </div>
            </div>

            {/* Аймаг, Сум */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Аймаг / Хот *
                </label>
                <select
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Сонгох</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сум / Дүүрэг *
                </label>
                <input
                  type="text"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="Сум / Дүүрэг"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* ЭЕШ дугаар */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ЭЕШ дугаар
                <span className="text-gray-400 font-normal ml-1">
                  (12 ангийн төгсөгч бол)
                </span>
              </label>
              <input
                type="text"
                name="examId"
                value={form.examId}
                onChange={handleChange}
                placeholder="Элсэлтийн ерөнхий шалгалтын дугаар"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium text-lg"
            >
              {saving ? "Илгээж байна..." : "Илгээх"}
            </button>
          </form>

          {message && (
            <p
              className={`mt-4 text-sm text-center ${
                message.includes("амжилттай") || message.includes("Амжилттай")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
