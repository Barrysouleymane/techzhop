import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    console.log("SIGNUP DATA:", data);
    console.log("SIGNUP ERROR:", error);

    if (error) {
      alert(error.message);
      return;
    }

    if (!data.user) {
      alert("User was not created.");
      return;
    }

    alert("Account created successfully!");

    // Clear the form
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-10 py-6 border-b border-gray-800">

        <Link
          to="/"
          className="text-4xl font-bold text-cyan-400"
        >
          TECHZHOP
        </Link>

        <div className="space-x-6">
          <Link to="/">Home</Link>

          <Link to="/login">
            Login
          </Link>
        </div>

      </nav>

      {/* REGISTER FORM */}

      <div className="flex items-center justify-center px-5 py-20">

        <form
          onSubmit={handleRegister}
          className="bg-gray-900 p-10 rounded-2xl w-full max-w-md"
        >

          <h1 className="text-4xl text-cyan-400 font-bold mb-8 text-center">
            Create Account
          </h1>

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 mb-5 rounded-xl bg-gray-800 text-white outline-none"
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 mb-5 rounded-xl bg-gray-800 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 mb-5 rounded-xl bg-gray-800 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-4 mb-6 rounded-xl bg-gray-800 text-white outline-none"
          />

          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-600 w-full py-4 rounded-xl font-bold text-lg"
          >
            Create Account
          </button>

          <p className="text-center text-gray-400 mt-6">
            Already have an account?

            <Link
              to="/login"
              className="text-cyan-400 ml-2"
            >
              Login
            </Link>

          </p>

        </form>

      </div>

    </div>
  );
}