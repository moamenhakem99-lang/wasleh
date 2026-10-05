import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { currentUser } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return <><Header user={user} /><div id="main-content" tabIndex={-1}>{children}</div><Footer user={user} /></>;
}
