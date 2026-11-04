// Precomputed extractions for the unmodified sample messages, keyed by sample
// id. Shown only in the clearly labelled "Simulated Example" mode. They pass the
// same grounding checks as live output, are classified by the same rules, and
// get a deterministic template reply (src/lib/intake/templates.ts).
// Loaded on demand so it stays out of the main bundle.

import type { Extraction } from "@/lib/intake/schema";

const inquiry = (request_type: string, summary: string, signals: Extraction["signals"], fields: Record<string, string | null>): Extraction => ({
  is_customer_inquiry: true,
  request_type,
  summary,
  signals,
  fields,
});

export const previews: Record<string, Extraction> = {
  // --- HVAC ----------------------------------------------------------------
  "hvac-ac": inquiry("cooling_repair", "Sarah Johnson's air conditioner stopped working this morning and the house is getting hot. She asked whether someone could come tomorrow.", ["service_outage", "stated_deadline"], {
    customer_name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: null,
    service_requested: "Air Conditioning Repair",
    problem: "Air conditioner stopped working; house getting hot",
    location: null,
    preferred_time: "tomorrow",
  }),
  "hvac-maintenance": inquiry("maintenance", "Michael Smith wants to set up an annual AC tune-up before summer at 1820 Maple Avenue, Edina. Weekday mornings work best.", [], {
    customer_name: "Michael Smith",
    email: "m.smith@example.com",
    phone: "(612) 555-0148",
    service_requested: "Annual AC tune-up",
    problem: "Routine annual maintenance before summer",
    location: "1820 Maple Avenue, Edina",
    preferred_time: "Weekday mornings",
  }),
  "hvac-furnace": inquiry("heating_repair", "Emily Davis's furnace stopped working overnight; the house is at 58 degrees and there is a newborn at home. She asked for a call as soon as possible.", ["service_outage", "vulnerable_people"], {
    customer_name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "651-555-0192",
    service_requested: "Furnace Repair",
    problem: "Furnace stopped working overnight; house at 58 degrees",
    location: "47 Birch Lane, St. Paul",
    preferred_time: "as soon as you can",
  }),
  "hvac-emergency": inquiry("heating_repair", "D. Patel reports a burning smell from the vents whenever the heat turns on and asks whether emergency service is offered.", ["safety_risk"], {
    customer_name: "D. Patel",
    email: "dpatel@example.com",
    phone: null,
    service_requested: "Emergency heating service",
    problem: "Burning smell from vents when heat runs",
    location: "3305 Lake Street, Minneapolis",
    preferred_time: null,
  }),

  // --- Accounting ----------------------------------------------------------
  "acct-missing": inquiry("missing_documents", "Robert Chen hasn't received a 1099-NEC from one of his clients for his 2025 tax return and asks what to do before the April 15 deadline.", ["stated_deadline"], {
    customer_name: "Robert Chen",
    email: "robert.chen@example.com",
    phone: null,
    services_requested: "Tax return preparation",
    documents: "1099-NEC (not yet received)",
    deadline: "April 15",
    company_size: null,
    existing_software: null,
  }),
  "acct-onboarding": inquiry("new_client", "Lisa Moreno owns a bakery with eight employees and is looking for a new firm for bookkeeping and quarterly tax preparation. They use QuickBooks.", [], {
    customer_name: "Lisa Moreno",
    email: "lisa@example.com",
    phone: null,
    services_requested: "Bookkeeping, quarterly tax preparation",
    documents: null,
    deadline: null,
    company_size: "eight employees",
    existing_software: "QuickBooks",
  }),
  "acct-bookkeeping": inquiry("bookkeeping", "A client says their March bank reconciliation in Xero is off from the statement by a few hundred dollars and asks the bookkeeping team to look.", [], {
    customer_name: null,
    email: "jkline@example.com",
    phone: null,
    services_requested: "Bank reconciliation review",
    documents: "March bank statement",
    deadline: null,
    company_size: null,
    existing_software: "Xero",
  }),
  "acct-documents": inquiry("document_submission", "Angela has her W-2 forms, mortgage interest statement and receipts ready and wants a secure way to send them other than email.", [], {
    customer_name: "Angela",
    email: "angela.b@example.com",
    phone: null,
    services_requested: "Secure document submission",
    documents: "W-2 forms, mortgage interest statement, receipts",
    deadline: null,
    company_size: null,
    existing_software: null,
  }),

  // --- Property management ---------------------------------------------------
  "prop-leak": inquiry("plumbing", "Maria Lopez at 245 Oak Street, unit 3 reports the kitchen sink has been leaking since yesterday, with water collecting under the cabinet.", ["active_damage"], {
    customer_name: "Maria Lopez",
    email: "maria.lopez@example.com",
    phone: null,
    property_address: "245 Oak Street",
    unit: "unit 3",
    maintenance_problem: "Kitchen sink leaking",
    entry_permission: null,
    relevant_details: "Leaking since yesterday; water collecting under the cabinet",
  }),
  "prop-heat": inquiry("hvac", "James Wilson in Unit 12B at 900 Pine Court has had no heat since last night; the thermostat is on but no air comes from the vents. His elderly mother lives with him.", ["service_outage", "vulnerable_people"], {
    customer_name: "James Wilson",
    email: "jwilson@example.com",
    phone: "612-555-0134",
    property_address: "900 Pine Court",
    unit: "Unit 12B",
    maintenance_problem: "No heat; nothing coming from vents",
    entry_permission: null,
    relevant_details: "Since last night; thermostat is on; elderly resident in the unit",
  }),
  "prop-routine": inquiry("general_maintenance", "Priya Shah reports the bathroom exhaust fan in unit 7 at 245 Oak Street has become loud. Not urgent, and maintenance may enter if she isn't home.", [], {
    customer_name: "Priya Shah",
    email: "priya.shah@example.com",
    phone: null,
    property_address: "245 Oak Street",
    unit: "unit 7",
    maintenance_problem: "Bathroom exhaust fan is very loud",
    entry_permission: "Yes, maintenance may enter if she isn't home",
    relevant_details: "Tenant says it is not urgent",
  }),
  "prop-incomplete": inquiry("appliance", "A tenant says the dishwasher isn't draining again and asks for someone to look. No name, address or unit was given.", ["service_outage"], {
    customer_name: null,
    email: "tenant4471@example.com",
    phone: null,
    property_address: null,
    unit: null,
    maintenance_problem: "Dishwasher not draining (recurring)",
    entry_permission: null,
    relevant_details: "Problem has happened before",
  }),
};
