import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { phaseLabels, type ItemResult, type Phase } from "@/lib/demo/workflow";
import { coreFieldKeys, type FieldDef, type IndustryConfig } from "@/lib/intake/industries";
import { Chip, Panel, PriorityChip } from "./ui";

function Row({ label, children, flag }: { label: string; children: ReactNode; flag?: boolean }) {
  return (
    <div className={`grid grid-cols-[7.5rem_1fr] gap-x-3 px-4 py-2 text-sm ${flag ? "bg-warn/5" : ""}`}>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-fg">{children}</dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-line last:border-b-0">
      <p className="px-4 pb-1 pt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-subtle">{title}</p>
      <dl className="pb-2">{children}</dl>
    </div>
  );
}

export function CustomerRecord({ industry, result, phase, recordNumber }: { industry: IndustryConfig; result: ItemResult | undefined; phase: Phase; recordNumber: string }) {
  const e = result?.extraction;
  const c = result?.classification;
  const ready = Boolean(e && c);
  const missing = new Set(c?.missing ?? []);
  const contactMissing = missing.has("Contact details");

  const value = (f: FieldDef) => {
    if (!ready) return <span className="font-normal text-fg-subtle">—</span>;
    const v = e?.fields[f.key];
    const flagged = missing.has(f.label) || (contactMissing && (f.key === "email" || f.key === "phone"));
    if (!v)
      return (
        <span className="flex flex-wrap items-center gap-2 font-normal italic text-fg-muted">
          Not provided
          {flagged ? <Chip tone="warn">Needs follow-up</Chip> : null}
        </span>
      );
    return (
      <>
        {v}
        {f.key === "preferred_time" ? <span className="ml-1.5 text-xs font-normal text-fg-muted">(requested, not booked)</span> : null}
      </>
    );
  };
  const isFlagged = (f: FieldDef) => ready && !e?.fields[f.key] && (missing.has(f.label) || (contactMissing && (f.key === "email" || f.key === "phone")));

  const contact = industry.fields.filter((f) => coreFieldKeys.has(f.key));
  const request = industry.fields.filter((f) => !coreFieldKeys.has(f.key));

  return (
    <Panel
      id="panel-record"
      title={industry.terms.record}
      icon="database"
      aside={<Chip tone="warn">Demo CRM — Simulated Record</Chip>}
      className="h-full"
      data-tour="record"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line bg-ink-900/40 px-4 py-2 text-xs">
        <span className="font-mono text-fg-muted">{ready ? recordNumber : "No record yet"}</span>
        {ready ? <span className="text-fg-subtle">Fictional data · not saved anywhere</span> : <span className="text-fg-subtle">Fills in after processing</span>}
      </div>

      <div className="flex-1">
        <Group title={industry.terms.customer}>
          {contact.map((f) => (
            <Row key={f.key} label={f.label} flag={isFlagged(f)}>
              {value(f)}
            </Row>
          ))}
        </Group>

        <Group title="Request">
          {request.map((f) => (
            <Row key={f.key} label={f.label} flag={isFlagged(f)}>
              {value(f)}
            </Row>
          ))}
        </Group>

        <Group title="Classification">
          <Row label="Category">{c ? c.category : <span className="font-normal text-fg-subtle">—</span>}</Row>
          <Row label="Route to">{c ? c.department : <span className="font-normal text-fg-subtle">—</span>}</Row>
          <Row label="Priority">
            {c ? (
              <>
                <PriorityChip priority={c.priority} />
                <ul className="mt-1.5 space-y-0.5 text-xs font-normal text-fg-muted">
                  {c.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] font-normal text-fg-subtle">Proposed by business rules for an employee to confirm.</p>
              </>
            ) : (
              <span className="font-normal text-fg-subtle">—</span>
            )}
          </Row>
          <Row label="Missing info" flag={Boolean(c && c.missing.length > 0)}>
            {c ? c.missing.length > 0 ? <span className="text-warn">{c.missing.join(", ")}</span> : "Nothing required is missing" : <span className="font-normal text-fg-subtle">—</span>}
          </Row>
          <Row label="Escalation" flag={c?.escalation.required}>
            {c ? (
              c.escalation.required ? (
                <span className="flex items-start gap-1.5 text-danger">
                  <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
                  {c.escalation.reason}
                </span>
              ) : (
                "Not required"
              )
            ) : (
              <span className="font-normal text-fg-subtle">—</span>
            )}
          </Row>
          <Row label="Next action">{c ? c.next_action : <span className="font-normal text-fg-subtle">—</span>}</Row>
        </Group>

        <Group title="Status">
          <Row label="Workflow">{phaseLabels[phase]}</Row>
          <Row label="CRM record">{ready ? "Draft created (simulated)" : "Not created"}</Row>
        </Group>
      </div>
    </Panel>
  );
}
