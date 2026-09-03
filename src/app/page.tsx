import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `${BRAND}: a sauna boat on San Francisco Bay`,
  description:
    "A captained, wood-fired sauna boat sailing Richardson Bay from Sausalito, with cold plunges into San Francisco Bay all year. Launching 2027. Reserve with a refundable deposit or join the free waitlist.",
  alternates: { canonical: "/" },
  openGraph: { title: `${BRAND}: a sauna boat on San Francisco Bay`, url: "/", images: ["/api/og"] },
};

export default function HomePage() {
  return <LandingPage />;
}
