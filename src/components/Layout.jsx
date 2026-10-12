import { Outlet } from "react-router";

import Navbar from "./Navbar.jsx";
import Notify from "./Notify.jsx";
import Footer from "./Footer.jsx";
import WhatsAppButton from "./WhatsAppButton.jsx";
import { isOpen } from "../lib/business.js";

// The frame every page sits in. Each page only has to worry about its own
// content; the menu, sign-up band and footer come from here.
export default function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      {/* The opening list stops making sense once the doors are open */}
      {!isOpen() && <Notify />}
      <Footer />
      <WhatsAppButton />
    </>
  );
}
