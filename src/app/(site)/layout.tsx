import { connection } from "next/server";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { WhatsappFab } from "@/components/site/whatsapp-fab";
import { getSettings } from "@/lib/data";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  await connection();
  const settings = await getSettings();
  return (
    <>
      <SiteHeader name={settings.name} logoUrl={settings.logoUrl} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
      <WhatsappFab phone={settings.whatsapp} />
    </>
  );
}
