import { Hero } from "./Hero";
import { Faq, HowItWorks, PricingPreview, ReserveBlock, WhyTheBay } from "./Sections";
import { JsonLd } from "./JsonLd";
import { PageView } from "./PageView";
import { BRAND, DEPOSIT_USD, HOME_PORT, LAUNCH_YEAR, SESSION_PRICE_USD, SITE_URL } from "@/lib/config";
import { FAQ } from "@/lib/content";
import { referralBannerText } from "@/lib/share";

export function landingJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: BRAND,
      url: SITE_URL,
      description: "A captained, wood-fired sauna boat on San Francisco Bay, sailing from Sausalito.",
      areaServed: { "@type": "Place", name: "San Francisco Bay Area" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: `${BRAND} first season`,
      description: `Launch of a captained sauna boat with cold plunges on San Francisco Bay. Vessel under development; date not guaranteed. Deposits are fully refundable.`,
      startDate: LAUNCH_YEAR,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: `${HOME_PORT}, Richardson Bay`,
        address: { "@type": "PostalAddress", addressLocality: HOME_PORT, addressRegion: "CA", addressCountry: "US" },
      },
      organizer: { "@type": "Organization", name: BRAND, url: SITE_URL },
      offers: [
        {
          "@type": "Offer",
          name: "Founding reservation deposit",
          price: DEPOSIT_USD,
          priceCurrency: "USD",
          url: `${SITE_URL}/reserve`,
          availability: "https://schema.org/PreOrder",
        },
        {
          "@type": "Offer",
          name: "Private session, up to six guests",
          price: SESSION_PRICE_USD,
          priceCurrency: "USD",
          availability: "https://schema.org/PreOrder",
        },
      ],
    },
  ];
}

export function LandingPage({ referrerFirstName, refCode }: { referrerFirstName?: string | null; refCode?: string | null }) {
  return (
    <>
      <JsonLd data={landingJsonLd()} />
      <PageView path={refCode ? "/r" : "/"} refCode={refCode} />
      {refCode ? (
        <div role="status" className="bg-cedar text-fog">
          <p className="mx-auto max-w-6xl px-5 py-3 text-sm sm:px-8">{referralBannerText(referrerFirstName ?? null)}</p>
        </div>
      ) : null}
      <Hero />
      <HowItWorks />
      <WhyTheBay />
      <PricingPreview />
      <ReserveBlock />
      <Faq />
    </>
  );
}
