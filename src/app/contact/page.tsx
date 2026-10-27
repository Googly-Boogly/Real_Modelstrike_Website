import { connection } from "next/server";
import { CalEmbed } from "@/components/contact/CalEmbed";
import { ContactForm } from "@/components/contact/ContactForm";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeader";
import { site } from "@/content/site";
import { resolveDelivery } from "@/lib/contact/delivery";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Contact — Request a Free Consultation",
  description:
    "Tell ModelStrike about the repetitive work slowing down your business. Request a free AI automation consultation for customer intake, workflow automation, or custom AI agents.",
  path: "/contact",
});

const laterSteps = [
  { icon: "search" as const, title: "We talk through your workflow", body: "A no-obligation conversation about where repetitive work piles up." },
  { icon: "file" as const, title: "You get an honest assessment", body: "If automation is a practical fit, we'll outline next steps. If it isn't, we'll say so." },
];

const firstStep = {
  gated: { icon: "calendar" as const, title: "Tell us a little, then pick a time", body: "Send the short form, then book a call on the calendar that appears." },
  open: { icon: "calendar" as const, title: "Pick a time", body: "Choose a slot for a free consultation call. You'll get a calendar invite by email." },
  email: { icon: "mail" as const, title: "We reply by email", body: "We'll respond to the address you provide to arrange a conversation." },
};

export default async function ContactPage() {
  // Render per request so the form's availability reflects runtime configuration.
  await connection();
  const enabled = resolveDelivery() !== null;
  // The calendar unlocks after the form is sent. If the form can't deliver
  // yet, show the calendar up front instead so bookings still work.
  const gatedCalLink = enabled ? site.calLink : "";
  const openCalLink = enabled ? "" : site.calLink;
  const mode = gatedCalLink ? "gated" : openCalLink ? "open" : "email";
  const expectations = [firstStep[mode], ...laterSteps];

  return (
    <section aria-labelledby="page-title" className="relative overflow-hidden">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/3 h-80 w-[40rem] rounded-full bg-accent-600/15 blur-3xl" />
      <Container className="relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
        <div>
          <Eyebrow>Contact</Eyebrow>
          <h1 id="page-title" className="font-display text-4xl font-extrabold text-fg sm:text-5xl lg:leading-[1.05]">
            Let&apos;s find out what your business could automate.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-fg-muted">
            {mode === "open"
              ? "Pick a time for a free consultation call and tell us about the repetitive work slowing down your team. You don't need any technical knowledge to get started."
              : mode === "gated"
                ? "Tell us about the repetitive work slowing down your team, then pick a time for a free consultation call. You don't need any technical knowledge to get started."
                : "Tell us about the repetitive work slowing down your team. The consultation is free, and you don't need any technical knowledge to get started."}
          </p>

          <ol className="mt-10 space-y-6">
            {expectations.map((e, i) => (
              <li key={e.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line-strong bg-ink-800 text-accent-400">
                  <Icon name={e.icon} className="size-5" />
                </span>
                <div>
                  <p className="font-display font-bold text-fg">
                    <span className="mr-2 font-mono text-xs font-medium text-fg-subtle">0{i + 1}</span>
                    {e.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{e.body}</p>
                </div>
              </li>
            ))}
          </ol>

          {site.contactEmail ? (
            <p className="mt-10 text-sm text-fg-muted">
              Prefer email?{" "}
              <a href={`mailto:${site.contactEmail}`} className="font-semibold text-accent-400 hover:text-accent-300">
                {site.contactEmail}
              </a>
            </p>
          ) : null}
        </div>

        {openCalLink ? (
          <div id="schedule" className="ring-gradient rounded-2xl bg-ink-800/90 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <h2 className="font-display text-2xl font-bold text-fg">Book your free consultation</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Choose a time that works for you. You&apos;ll get a calendar invite and confirmation from Cal.com by email.
            </p>
            <div className="mt-6">
              <CalEmbed calLink={openCalLink} />
            </div>
          </div>
        ) : (
          <div id="contact-form" className="ring-gradient rounded-2xl bg-ink-800/90 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <h2 className="font-display text-2xl font-bold text-fg">Request a free consultation</h2>
            <p className="mt-2 text-sm text-fg-muted">
              {gatedCalLink ? "A few details help us prepare — then you'll pick a time for the call." : "A few details help us prepare for the conversation."}
            </p>
            {!enabled ? (
              <div role="status" className="mt-6 flex gap-3 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm leading-relaxed text-fg">
                <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-warn" />
                <p>
                  Online requests are temporarily unavailable while we finish setting up this form.
                  {site.contactEmail ? (
                    <>
                      {" "}
                      Please email us at{" "}
                      <a href={`mailto:${site.contactEmail}`} className="font-semibold text-accent-400 underline-offset-2 hover:underline">
                        {site.contactEmail}
                      </a>{" "}
                      instead.
                    </>
                  ) : (
                    " Please check back soon."
                  )}
                </p>
              </div>
            ) : null}
            <div className="mt-8">
              <ContactForm enabled={enabled} calLink={gatedCalLink || undefined} />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
