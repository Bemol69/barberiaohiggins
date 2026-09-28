import { connection } from "next/server";
import { AdminBar } from "@/components/site/admin-bar";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { WhatsappFab } from "@/components/site/whatsapp-fab";
import { isAdmin } from "@/lib/admin-session";
import { getContent } from "@/lib/content";
import { bookingHref } from "@/lib/format";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const [{ business }, admin] = await Promise.all([getContent(), isAdmin()]);
  return (
    <>
      {admin && (
        <>
          <AdminBar />
          <div className="h-10" aria-hidden />
        </>
      )}
      <SiteHeader name={business.name} logoUrl={business.logoUrl} bookingHref={bookingHref(business)} offsetTop={admin} />
      <main>{children}</main>
      <SiteFooter business={business} />
      <WhatsappFab phone={business.whatsapp} />
    </>
  );
}
