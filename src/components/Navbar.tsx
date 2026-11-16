import { getAllGuides, getAllNews } from "@/lib/content";
import { NavbarClient } from "./NavbarClient";

export function Navbar() {
  const guides = getAllGuides();
  const news = getAllNews();
  return <NavbarClient guides={guides} news={news} />;
}
