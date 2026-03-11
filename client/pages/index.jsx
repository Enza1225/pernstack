import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">PERN Stack Client</h1>
      <p className="mt-2 text-lg mb-8">Phone-based Authentication System</p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
