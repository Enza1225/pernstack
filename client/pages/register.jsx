import { useState } from "react";
import http from "../api/http";

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: form, 2: verify code
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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
      setMessage("Verification code sent to your phone");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      // Verify code first
      await http.post("/api/auth/verify-code", { phone: fullPhone, code });

      // Then register
      await http.post("/api/auth/register", {
        phone: fullPhone,
        password,
        name,
      });

      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      await http.post("/api/auth/send-code", { phone: fullPhone });
      setMessage("New code sent!");
      setCode("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {step === 1 ? (
        <form
          onSubmit={handleSendCode}
          className="bg-white p-8 rounded shadow-md w-full max-w-md"
        >
          <h1 className="text-2xl font-bold mb-6">Register</h1>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 rounded-l text-gray-600">
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
                className="w-full px-4 py-2 border rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || phone.length < 8}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Sending code..." : "Send Verification Code"}
          </button>

          {message && (
            <p className="mt-4 text-center text-red-600">{message}</p>
          )}

          <p className="text-center mt-4 text-gray-600">
            Already have account?{" "}
            <a href="/login" className="text-blue-500 hover:underline">
              Login here
            </a>
          </p>
        </form>
      ) : (
        <form
          onSubmit={handleVerifyAndRegister}
          className="bg-white p-8 rounded shadow-md w-full max-w-md"
        >
          <h1 className="text-2xl font-bold mb-2">Verify Phone</h1>
          <p className="text-gray-600 mb-6">
            {fullPhone} дугаар руу 6 оронтой код илгээсэн
          </p>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify & Register"}
          </button>

          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setCode("");
                setMessage("");
              }}
              className="text-gray-500 hover:underline"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="text-blue-500 hover:underline disabled:opacity-50"
            >
              Resend Code
            </button>
          </div>

          {message && (
            <p
              className={`mt-4 text-center ${message.includes("successful") || message.includes("sent") ? "text-green-600" : "text-red-600"}`}
            >
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
