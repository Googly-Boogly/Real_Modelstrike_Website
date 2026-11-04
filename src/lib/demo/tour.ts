// Guided Demo: the steps and their navigation, independent of the UI.

export type TourTarget = "inbox" | "process" | "record" | "approval" | "roi" | "cta";
export type TourStep = { target: TourTarget; title: string; body: string };

export const tourSteps: TourStep[] = [
  { target: "inbox", title: "Incoming customer request", body: "Businesses receive customer inquiries throughout the day. Employees often spend time manually reading, organizing, and responding to each request." },
  { target: "process", title: "AI processing", body: "ModelStrike extracts important information and organizes the request automatically. Click Process With AI to try it." },
  { target: "record", title: "Customer record", body: "Customer information becomes structured business data, reducing repetitive manual entry." },
  { target: "approval", title: "Human approval", body: "Employees remain in control of customer communications. Nothing is sent without a person's approval." },
  { target: "roi", title: "Business value", body: "Explore how automating repetitive tasks could affect your business." },
  { target: "cta", title: "Consultation", body: "ModelStrike can help build an automation workflow tailored to your business." },
];

export type TourState = { active: boolean; index: number };
export type TourAction = { type: "start" } | { type: "next" } | { type: "prev" } | { type: "exit" } | { type: "restart" };

export const tourIdle: TourState = { active: false, index: 0 };

export function tourReducer(state: TourState, action: TourAction): TourState {
  const last = tourSteps.length - 1;
  switch (action.type) {
    case "start":
    case "restart":
      return { active: true, index: 0 };
    case "next":
      if (!state.active) return state;
      return state.index >= last ? tourIdle : { active: true, index: state.index + 1 };
    case "prev":
      return state.active ? { active: true, index: Math.max(0, state.index - 1) } : state;
    case "exit":
      return tourIdle;
  }
}
