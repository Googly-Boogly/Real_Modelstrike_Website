// Copy for the private customer onboarding questionnaire (/onboarding).

export const ONBOARDING_CONTACT_EMAIL = "alex@modelstrike.ai";

export const onboardingCopy = {
  meta: { title: "Customer Onboarding", description: "Complete your ModelStrike onboarding questionnaire." },
  welcome: {
    eyebrow: "Customer onboarding",
    title: "Welcome to ModelStrike!",
    intro: "We're excited to get started on your automation project.",
    body: [
      "Before development begins, we'd like to learn more about your business, your current workflow, and what you'd like to automate.",
      "This questionnaire will help us prepare for your project kickoff meeting.",
    ],
    time: "Approximately 5–10 minutes",
    start: "Start Questionnaire",
    use: "Your information will be used to plan and deliver your ModelStrike automation project.",
    caution: "Please do not enter passwords, API keys, payment information, or sensitive customer records.",
  },
  steps: [
    { short: "Your Business", title: "Tell Us About Your Business", description: "Help us understand your company and who we'll be working with." },
    { short: "Current Workflow", title: "How Does Your Business Work Today?", description: "We'd like to understand the process you're currently using and the challenges you'd like to solve." },
    { short: "Automation", title: "Let's Design Your Automation", description: "Tell us which systems you use and what you want the automation to accomplish." },
    { short: "Goals", title: "Almost Finished!", description: "Let's confirm your project goals and make sure we understand what success looks like." },
  ],
  review: {
    title: "Review Your Answers",
    description: "Check everything below before you submit. You can edit any section.",
    submit: "Submit Onboarding Questionnaire",
  },
  success: {
    title: "Your Onboarding Questionnaire Is Complete!",
    body: [
      "Thank you for completing your ModelStrike onboarding questionnaire.",
      "We've received your responses and will review them as we prepare for your project kickoff.",
    ],
    already: "This questionnaire has already been submitted, so there's nothing more to do here.",
    next: [
      "Our team reviews your questionnaire.",
      "We confirm the project requirements.",
      "We contact you to coordinate your kickoff meeting.",
      "We begin development once the necessary information and access are in place.",
    ],
    button: "Return to ModelStrike",
  },
  invalidLink: "This onboarding link is no longer valid. Please contact ModelStrike to request a new invitation.",
} as const;
