import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    {/* pt-14 (mobile) / pt-16 (desktop) — altura do navbar responsivo */}
    <main className="flex-1 pt-14 sm:pt-16">{children}</main>
    <Footer />
  </div>
);

export default Layout;
