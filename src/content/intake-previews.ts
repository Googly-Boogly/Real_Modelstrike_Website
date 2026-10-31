// Precomputed results for the unmodified sample messages. Shown only under the
// "Example Preview — Not Live AI Processing" label, and classified by the same
// rules as live results. Loaded on demand so it stays out of the main bundle.

import type { Draft, Extraction } from "@/lib/intake/schema";

export const previews: Record<string, { extraction: Extraction; draft: Draft }> = {
  hvac: {
    extraction: {
      is_customer_inquiry: true,
      request_type: "repair",
      summary: "Sarah Johnson's air conditioner stopped cooling yesterday. She is in Minneapolis and asked whether someone could look at it tomorrow afternoon.",
      signals: ["service_outage", "stated_deadline"],
      fields: {
        customer_name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: null,
        service_requested: "Air Conditioning Repair",
        problem: "Air conditioner stopped cooling",
        location: "Minneapolis",
        preferred_time: "tomorrow afternoon",
      },
    },
    draft: {
      source: "template",
      subject: "Regarding your air conditioning request",
      body: "Hi Sarah,\n\nThank you for contacting us about your air conditioning system. I'm sorry to hear it's not cooling properly.\n\nOur team can review your request and contact you to discuss available appointment times, including your request for tomorrow afternoon.\n\nCould you confirm the best phone number to reach you?\n\nBest regards,\nCustomer Service Team",
    },
  },
  accounting: {
    extraction: {
      is_customer_inquiry: true,
      request_type: "new_client",
      summary: "A small-business owner with eight employees is looking for an accounting firm for bookkeeping and quarterly tax preparation. They use QuickBooks.",
      signals: [],
      fields: {
        customer_name: null,
        email: null,
        phone: null,
        services_requested: "Bookkeeping, quarterly tax preparation",
        company_size: "eight employees",
        existing_software: "QuickBooks",
        customer_needs: "Ongoing bookkeeping and quarterly tax preparation for a small business",
      },
    },
    draft: {
      source: "template",
      subject: "Your bookkeeping and tax preparation inquiry",
      body: "Hello,\n\nThank you for reaching out about bookkeeping and quarterly tax preparation for your business. Our team will review your request and follow up to talk through how we might help.\n\nSo we can prepare, could you share your name, the best phone number or email address to reach you, and your business's legal structure?\n\nBest regards,\nCustomer Service Team",
    },
  },
  property: {
    extraction: {
      is_customer_inquiry: true,
      request_type: "maintenance",
      summary: "A tenant at 245 Oak Street, unit 3 reports that the kitchen sink has been leaking since yesterday, with water collecting under the cabinet.",
      signals: ["active_damage"],
      fields: {
        customer_name: null,
        email: null,
        phone: null,
        property_address: "245 Oak Street",
        unit: "unit 3",
        maintenance_problem: "Kitchen sink leaking",
        relevant_details: "Leaking since yesterday; water collecting under the cabinet",
      },
    },
    draft: {
      source: "template",
      subject: "Your maintenance request for unit 3",
      body: "Hello,\n\nThank you for letting us know about the leak under your kitchen sink at 245 Oak Street, unit 3. Our team will review your request and follow up about next steps.\n\nCould you share your name, the best phone number or email address to reach you, and whether maintenance may enter the unit if you are not home?\n\nBest regards,\nCustomer Service Team",
    },
  },
};
