import { Outlet } from "react-router-dom";
import Header from "@/components/Header";

export default function AppLayout() {
  return (
    <>
      <Header />
      <div className="min-h-screen w-full">
        <main className="pt-36">
          <Outlet />
        </main>
      </div>
    </>
  );
}
