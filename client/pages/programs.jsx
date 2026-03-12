import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const SAMPLE_PROGRAMS = [
  {
    id: 1,
    name: "Компьютерийн ухаан",
    faculty: "Мэдээллийн технологийн сургууль",
    duration: "4 жил",
  },
  {
    id: 2,
    name: "Программ хангамж",
    faculty: "Мэдээллийн технологийн сургууль",
    duration: "4 жил",
  },
  {
    id: 3,
    name: "Бизнесийн удирдлага",
    faculty: "Бизнесийн сургууль",
    duration: "4 жил",
  },
  {
    id: 4,
    name: "Нягтлан бодох бүртгэл",
    faculty: "Бизнесийн сургууль",
    duration: "4 жил",
  },
  {
    id: 5,
    name: "Эрх зүй",
    faculty: "Хууль зүйн сургууль",
    duration: "4 жил",
  },
  {
    id: 6,
    name: "Барилгын инженер",
    faculty: "Инженерийн сургууль",
    duration: "4 жил",
  },
];

export default function ProgramsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">MNUAC</h1>
          <a href="/" className="text-sm text-indigo-600 hover:underline">
            Нүүр хуудас
          </a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Хөтөлбөр сонгох</h2>
          <p className="text-gray-500 mt-2">Элсэх хөтөлбөрөө сонгоно уу</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SAMPLE_PROGRAMS.map((prog) => (
            <div
              key={prog.id}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {prog.name}
              </h3>
              <p className="text-sm text-gray-500 mb-2">{prog.faculty}</p>
              <p className="text-xs text-gray-400 mb-4">
                Хугацаа: {prog.duration}
              </p>
              <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                Сонгох
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
