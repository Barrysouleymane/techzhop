import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // Clear the form
    setEmail("");
    setPassword("");

    alert("Login successful!");

    // Redirect to the Account page
    navigate("/account");
  }

  return (
    <div className="min-h-screen bg-black text-white">

      <nav className="flex justify-between items-center px-10 py-6 border-b border-gray-800">

        <Link to="/" className="text-4xl font-bold text-cyan-400">
          TECHZHOP
        </Link>

        <div className="space-x-6">
          <Link to="/">Home</Link>
          <Link to="/register">Register</Link>
        </div>

      </nav>

      <div className="flex items-center justify-center px-5 py-20">

        <form
          onSubmit={handleLogin}
          className="bg-gray-900 p-10 rounded-2xl w-full max-w-md"
        >

          <h1 className="text-4xl text-cyan-400 font-bold mb-8 text-center">
            Login
          </h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 mb-5 rounded-xl bg-gray-800 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 mb-6 rounded-xl bg-gray-800 text-white outline-none"
          />

          <button className="bg-cyan-500 hover:bg-cyan-600 w-full py-4 rounded-xl font-bold text-lg">
            Login
          </button>

          <p className="text-center text-gray-400 mt-6">
            Don’t have an account?

            <Link
              to="/register"
              className="text-cyan-400 ml-2"
            >
              Register
            </Link>
          </p>

        </form>

      </div>

    </div>
  );
}