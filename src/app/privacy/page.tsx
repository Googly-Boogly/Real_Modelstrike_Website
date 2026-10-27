import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeader";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How ModelStrike LLC collects, uses, and protects information submitted through the modelstrike.ai website.",
  path: "/privacy",
});

// Update this date whenever the policy content changes.
const LAST_UPDATED = "October 27, 2026";

const sections: { heading: string; body: ReactNode }[] = [
  {
    heading: "Who we are",
    body: (
      <p>
        This website, {site.url.replace(/^https?:\/\//, "")}, is operated by {site.legalName} (&ldquo;ModelStrike&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). This policy explains what
        information we collect through the website and how we use it.
      </p>
    ),
  },
  {
    heading: "Information you give us",
    body: (
      <>
        <p>When you submit the consultation request form on our contact page, we collect:</p>
        <ul>
          <li>Your full name</li>
          <li>Your business email address</li>
          <li>Your company name</li>
          <li>Your industry (optional)</li>
          <li>Your description of what you&apos;d like to automate, and anything else you choose to include in it</li>
        </ul>
        <p>
          If you book a call on our scheduling calendar, Cal.com collects the details you enter there (such as your name, email address, chosen time, and any notes)
          on our behalf. When you book right after sending the form, your name and email are pre-filled from it.
        </p>
        <p>Please don&apos;t include passwords, payment details, or sensitive personal information about your customers in the form.</p>
      </>
    ),
  },
  {
    heading: "Information collected automatically",
    body: (
      <>
        <p>
          To protect the contact form from spam and abuse, the website temporarily uses your IP address to limit how many requests can be sent in a short period. This
          is held in server memory only and is not stored with your submission.
        </p>
        <p>
          Like most websites, our hosting infrastructure may record standard technical logs (such as IP address, browser type, and pages requested) for security and
          operational purposes.
        </p>
        <p>
          The website does not use advertising cookies, third-party analytics, or tracking pixels. The one exception to &ldquo;everything is served by us&rdquo; is
          the scheduling calendar on the contact page, which is loaded from Cal.com. When it loads, Cal.com receives standard technical information from your browser
          and may use its own cookies to operate the booking widget, under Cal.com&apos;s own privacy policy.
        </p>
      </>
    ),
  },
  {
    heading: "How we use your information",
    body: (
      <ul>
        <li>To respond to your consultation request and communicate with you about it</li>
        <li>To understand your business needs and prepare for a conversation or proposal</li>
        <li>To keep the website secure and prevent abuse</li>
      </ul>
    ),
  },
  {
    heading: "How your information is shared",
    body: (
      <>
        <p>
          We do not sell your personal information or share it for advertising. We use these service providers, which process information on our behalf:
        </p>
        <ul>
          <li>
            <strong className="text-fg">Resend</strong> — email delivery, used to send your form submission to us and a confirmation email to you
          </li>
          <li>
            <strong className="text-fg">Cal.com</strong> — scheduling, used when you book a consultation call
          </li>
          <li>Our website hosting provider, which serves the site and may keep standard technical logs</li>
        </ul>
        <p>
          If we connect the form to a different delivery tool in the future (for example, a CRM), we will update this list. We may also disclose information if
          required by law.
        </p>
      </>
    ),
  },
  {
    heading: "How long we keep it",
    body: (
      <p>
        We keep consultation requests for as long as needed to respond to you and manage any resulting business relationship, and then delete them when they&apos;re no
        longer needed for those purposes or for legal and record-keeping obligations.
      </p>
    ),
  },
  {
    heading: "Security",
    body: (
      <p>
        The website is served over HTTPS, the form is validated on our server, and submissions are never published on the site. No method of transmission or storage is
        completely secure, but we take reasonable measures to protect the information you send us.
      </p>
    ),
  },
  {
    heading: "Your choices",
    body: (
      <p>
        You can ask us to access, correct, or delete the information you submitted by contacting us
        {site.contactEmail ? (
          <>
            {" "}
            at <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
          </>
        ) : (
          <>
            {" "}
            through our <Link href="/contact">contact page</Link>
          </>
        )}
        . Depending on where you live, you may have additional rights under local privacy law.
      </p>
    ),
  },
  {
    heading: "Changes to this policy",
    body: <p>We may update this policy as the website changes. The date at the top shows when it was last revised.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <Container className="py-16 sm:py-24">
      <article className="mx-auto max-w-3xl">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="font-display text-4xl font-extrabold text-fg sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-fg-subtle">Last updated: {LAST_UPDATED}</p>
        <div className="mt-12 space-y-10">
          {sections.map((s) => (
            <section key={s.heading} className="border-t border-line pt-8">
              <h2 className="font-display text-xl font-bold text-fg">{s.heading}</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-fg-muted [&_a]:font-semibold [&_a]:text-accent-400 [&_a:hover]:underline [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </article>
    </Container>
  );
}
