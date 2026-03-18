import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="md:flex">
      <Sidebar userName={session.user.name} userEmail={session.user.email} />
      <main className="min-h-screen flex-1 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
