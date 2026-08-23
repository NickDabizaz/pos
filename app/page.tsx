import { redirect } from "next/navigation";

import { requirePerusahaanAktif } from "@/lib/server/auth/guard";

export default async function Home() {
  await requirePerusahaanAktif();

  redirect("/pos");
}
