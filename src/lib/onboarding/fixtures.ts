// Fictional test data only. Never use real customer information in tests.
import { emptyAnswers, type Answers } from "./schema.ts";

// Fictional test customer only.
export const completeAnswers = (): Answers => ({
  ...emptyAnswers(),
  contactName: "Test Customer",
  jobTitle: "Office Manager",
  contactEmail: "test.customer@example.com",
  industry: "hvac_home_services",
  processToAutomate: "Service requests from our website get re-typed into our CRM.",
  currentProcess: "A dispatcher reads each web form, copies it into the CRM, then emails the customer.",
  challenges: ["manual_data_entry", "slow_response"],
  software: ["gmail", "servicetitan"],
  dataSources: ["customer_emails", "website_forms"],
  dailyVolume: "26_50",
  actions: ["update_customer_record", "draft_email"],
  approverRole: "Office Manager",
  approverEmail: "test.customer@example.com",
  successCriteria: "Cut request processing time in half while keeping records accurate.",
});
