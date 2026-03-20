import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import { getCurrentUser, type AuthUser } from "./services/auth.service";

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 selection:text-blue-100 flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Navbar user={user} onAuthSuccess={refreshUser} />

      <main className="flex-grow flex flex-col">
        <Hero />
      </main>

      <Footer />
    </div>
  );
};

export default App;
