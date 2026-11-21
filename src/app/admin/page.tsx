import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#0d0e12] text-[#f0f0f4] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
}
