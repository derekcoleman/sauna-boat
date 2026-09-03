import { BRAND, DEPOSIT_USD, HOME_PORT, LAUNCH_YEAR, MAX_GUESTS, SESSION_HOURS, SESSION_PRICE_USD, formatUsd } from "./config";

export const TAGLINE = "A wood-fired sauna that sails San Francisco Bay, with a captain at the helm and a cold plunge over the side.";
export const WHEN_LINE = `Launching ${LAUNCH_YEAR} from ${HOME_PORT}. Up to ${MAX_GUESTS} guests per session.`;

export const STEPS = [
  {
    title: `Board in ${HOME_PORT}`,
    body: "Meet at the dock on Richardson Bay. Towels and water are on board. The stove is already lit.",
  },
  {
    title: "Sauna underway",
    body: "The captain takes the boat out while you sit in the heat. Cedar, a wood stove, and a window on the water.",
  },
  {
    title: "Plunge from the boat",
    body: "Step off the swim platform into the Bay, then climb back into the heat. Repeat as many times as you like.",
  },
] as const;

export const WHY_BAY = [
  {
    title: "Cold water, every month",
    body: "San Francisco Bay stays between roughly 50 and 60 degrees Fahrenheit year round. A plunge in August is as real as one in January.",
  },
  {
    title: "The only sauna on the Bay that sails",
    body: "Docked saunas stay put. This one moves, with a licensed captain, so the view changes and the water is always right there.",
  },
  {
    title: "Contrast, not a gimmick",
    body: "Heat, then cold, then heat. The Bay does the cold part better than any tub can.",
  },
] as const;

export const PRICING = {
  privateLabel: "Private session",
  privatePrice: formatUsd(SESSION_PRICE_USD),
  privateDetail: `${SESSION_HOURS} hours, up to ${MAX_GUESTS} guests, captain included.`,
  communalLabel: "Communal seats",
  communalDetail: "Sold individually, coming after launch.",
  depositLabel: "Founding reservation",
  depositPrice: formatUsd(DEPOSIT_USD),
  depositDetail: "Refundable deposit. Full refund at any time before launch, automatically if we do not launch.",
};

export const FAQ = [
  {
    q: "Is the deposit refundable?",
    a: "Yes, fully, at any time before launch. Email us from your status page and we refund the card you paid with.",
  },
  {
    q: "When exactly does it launch?",
    a: `${LAUNCH_YEAR}. We do not guarantee a date. The vessel is under development. If we do not launch, every deposit is refunded automatically.`,
  },
  {
    q: "Do I need to swim?",
    a: "No. The plunge is optional. You can stay in the sauna, sit on deck, or step onto the swim platform and go in to your knees.",
  },
  {
    q: "Is the sauna wood-fired?",
    a: "Yes. A wood stove, lit before you board.",
  },
  {
    q: "Where do I board?",
    a: `${HOME_PORT}, on Richardson Bay. We will announce the exact marina before launch.`,
  },
  {
    q: "What does a reservation get me?",
    a: `A place in line for the first bookings, priority over the free waitlist, and rewards for each person you refer. The deposit is applied to your first session with ${BRAND}.`,
  },
] as const;

export const SEASON_LABELS: Record<string, string> = {
  winter: `Winter ${LAUNCH_YEAR}`,
  spring: `Spring ${LAUNCH_YEAR}`,
  summer: `Summer ${LAUNCH_YEAR}`,
  fall: `Fall ${LAUNCH_YEAR}`,
};
