import "server-only";
import { Resend } from "resend";
import { BRAND, EMAIL_FROM, ADMIN_EMAIL, SITE_URL, formatUsd, DEPOSIT_USD } from "./config";
import { shareText, shareUrl } from "./share";
import type { Standing } from "./position";

interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs to the console. */
export async function sendEmail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(
      `\n[email:console] To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`,
    );
    return;
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: mail.replyTo,
    });
    if (error) console.error("[email] resend error", error);
  } catch (err) {
    console.error("[email] failed", err);
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f2ec;font-family:Georgia,serif;color:#14202b">
<div style="max-width:560px;margin:0 auto;background:#fffdf8;padding:32px;border:1px solid #e3ddd1">
<p style="margin:0 0 24px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#7a6f5f">${esc(BRAND)}</p>
<h1 style="font-size:24px;font-weight:normal;margin:0 0 16px">${esc(title)}</h1>
${bodyHtml}
<p style="margin-top:32px;font-size:12px;color:#7a6f5f">The vessel is under development. Deposits are fully refundable at any time, including automatically if we do not launch.</p>
</div></body></html>`;
}

function shareBlock(tier: "waitlist" | "reserved", link: string) {
  const text = shareText(tier, link);
  const channels: Array<["sms" | "whatsapp" | "x" | "linkedin" | "email", string]> = [
    ["sms", "Message"],
    ["whatsapp", "WhatsApp"],
    ["x", "X"],
    ["linkedin", "LinkedIn"],
    ["email", "Email"],
  ];
  const html = channels
    .map(
      ([c, label]) =>
        `<a href="${esc(shareUrl(c, text, link))}" style="display:inline-block;margin:0 8px 8px 0;padding:8px 14px;border:1px solid #14202b;color:#14202b;text-decoration:none;font-size:14px">${label}</a>`,
    )
    .join("");
  const textLines = channels.map(([c, label]) => `${label}: ${shareUrl(c, text, link)}`).join("\n");
  return { html, text: textLines };
}

function linkRow(label: string, url: string) {
  return `<p style="margin:12px 0"><span style="color:#7a6f5f">${esc(label)}</span><br><a href="${esc(url)}" style="color:#14202b">${esc(url)}</a></p>`;
}

export interface MemberEmailContext {
  email: string;
  firstName: string | null;
  referralCode: string;
  token: string;
  standing: Standing | null;
}

function statusUrl(token: string) {
  return `${SITE_URL}/status/${token}`;
}
function refUrl(code: string) {
  return `${SITE_URL}/r/${code}`;
}
function positionLine(s: Standing | null) {
  return s ? `You are #${s.position.toLocaleString()} of ${s.total.toLocaleString()}.` : "";
}

export async function sendReservationConfirmed(ctx: MemberEmailContext, partySize: number) {
  const link = refUrl(ctx.referralCode);
  const share = shareBlock("reserved", link);
  const name = ctx.firstName ? `${ctx.firstName}, your` : "Your";
  const title = `${name} reservation is confirmed`;
  const text = [
    `${title}.`,
    ``,
    `Deposit: ${formatUsd(DEPOSIT_USD)}, fully refundable at any time before launch. Party size: ${partySize}.`,
    positionLine(ctx.standing),
    ``,
    `Your referral link: ${link}`,
    `Each person who joins through it moves you up the list and unlocks rewards.`,
    ``,
    share.text,
    ``,
    `Your status page: ${statusUrl(ctx.token)}`,
  ].join("\n");
  const html = layout(
    title,
    `<p>Deposit: <strong>${formatUsd(DEPOSIT_USD)}</strong>, fully refundable at any time before launch. Party size: ${partySize}.</p>
<p>${esc(positionLine(ctx.standing))}</p>
${linkRow("Your referral link", link)}
<p>Each person who joins through it moves you up the list and unlocks rewards.</p>
<p>${share.html}</p>
${linkRow("Your status page", statusUrl(ctx.token))}`,
  );
  await sendEmail({ to: ctx.email, subject: `${BRAND}: reservation confirmed`, text, html });
}

export async function sendWaitlistConfirmed(ctx: MemberEmailContext) {
  const link = refUrl(ctx.referralCode);
  const share = shareBlock("waitlist", link);
  const title = "You are on the list";
  const text = [
    `${title}. ${positionLine(ctx.standing)}`,
    ``,
    `Your referral link: ${link}`,
    `Each person who joins through it moves you up five places. A deposit holder always ranks above the free list.`,
    ``,
    share.text,
    ``,
    `Your status page: ${statusUrl(ctx.token)}`,
  ].join("\n");
  const html = layout(
    title,
    `<p>${esc(positionLine(ctx.standing))}</p>
${linkRow("Your referral link", link)}
<p>Each person who joins through it moves you up five places. A deposit holder always ranks above the free list.</p>
<p>${share.html}</p>
${linkRow("Your status page", statusUrl(ctx.token))}`,
  );
  await sendEmail({ to: ctx.email, subject: `${BRAND}: you are on the list`, text, html });
}

export async function sendNudge(ctx: MemberEmailContext, referredAhead: number, tier: "waitlist" | "reserved") {
  const link = refUrl(ctx.referralCode);
  const share = shareBlock(tier, link);
  const pos = ctx.standing?.position.toLocaleString() ?? "";
  const title = pos ? `You are #${pos}` : "Your place on the list";
  const aheadLine =
    referredAhead > 0
      ? `${referredAhead.toLocaleString()} ${referredAhead === 1 ? "person" : "people"} ahead of you moved up through referrals.`
      : "Nobody ahead of you has used a referral yet. One share would move you past them.";
  const text = [
    `${title}. ${aheadLine}`,
    ``,
    `Your referral link: ${link}`,
    ``,
    share.text,
    ``,
    `Your status page: ${statusUrl(ctx.token)}`,
  ].join("\n");
  const html = layout(
    title,
    `<p>${esc(aheadLine)}</p>
${linkRow("Your referral link", link)}
<p>${share.html}</p>
${linkRow("Your status page", statusUrl(ctx.token))}`,
  );
  await sendEmail({ to: ctx.email, subject: `${BRAND}: ${title}`, text, html });
}

export async function sendRefundRequest(member: { email: string; first_name: string | null; id: string }, reservationId: string | null) {
  if (!ADMIN_EMAIL) {
    console.log(`[email:console] Refund requested by ${member.email} (member ${member.id}, reservation ${reservationId ?? "none"})`);
    return;
  }
  const text = `Refund requested.\n\nMember: ${member.first_name ?? ""} <${member.email}>\nMember id: ${member.id}\nReservation id: ${reservationId ?? "none"}\n\nRefund the charge in the Stripe dashboard; the charge.refunded webhook updates the record.`;
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `${BRAND}: refund request from ${member.email}`,
    text,
    html: layout("Refund requested", `<pre style="white-space:pre-wrap">${esc(text)}</pre>`),
    replyTo: member.email,
  });
}
