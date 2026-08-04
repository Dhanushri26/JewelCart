import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  const { user } = useAppContext();

  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">

        <AdminSidebar
          user={user}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
        />

        <main className="flex-1">
          <Outlet
            context={{
              activeNav,
              setActiveNav,
            }}
          />
        </main>

      </div>
    </div>
  );
}