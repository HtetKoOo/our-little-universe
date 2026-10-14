import "server-only";
import { Resend } from "resend";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendPasswordResetEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  if (!emailConfigured()) throw new Error("Email delivery is not configured");

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Reset your Our Little Universe password",
    text: `A password reset was requested for Our Little Universe.\n\nChoose a new password here: ${url}\n\nThis link expires in one hour. If you did not request it, you can safely ignore this email.`,
    html: `<main style="font-family:Arial,sans-serif;color:#4b2c3d;line-height:1.6"><h1 style="font-family:Georgia,serif">Find your way back.</h1><p>A password reset was requested for <strong>Our Little Universe</strong>.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#b33d6c;color:#fff;text-decoration:none;font-weight:700">Choose a new password</a></p><p>This link expires in one hour. If you did not request it, you can safely ignore this email.</p></main>`,
  });

  if (error) throw new Error("Password reset email could not be sent");
}

export async function sendEmailVerification({ to, name, url }: { to: string; name: string; url: string }) {
  if (!emailConfigured()) throw new Error("Email delivery is not configured");
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Confirm your Our Little Universe email",
    text: `Hi ${name},\n\nConfirm this email to open your private Our Little Universe space: ${url}\n\nThis link expires in one hour. If you did not create this account, you can safely ignore this email.`,
    html: `<main style="font-family:Arial,sans-serif;color:#4b2c3d;line-height:1.6"><h1 style="font-family:Georgia,serif">One little confirmation.</h1><p>Hi ${name}, confirm this email to open your private <strong>Our Little Universe</strong> space.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#b33d6c;color:#fff;text-decoration:none;font-weight:700">Confirm my email</a></p><p>This link expires in one hour. If you did not create this account, you can safely ignore this email.</p></main>`,
  });
  if (error) throw new Error("Email verification could not be sent");
}

export async function sendCleanupCode({ to, code }: { to: string; code: string }) {
  if (!emailConfigured()) throw new Error("Email delivery is not configured");
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Your Our Little Universe cleanup code",
    text: `Your confirmation code is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
    html: `<main style="font-family:Arial,sans-serif;color:#4b2c3d;line-height:1.6"><h1 style="font-family:Georgia,serif">One careful step.</h1><p>Your test-data cleanup code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:5px">${code}</p><p>It expires in 10 minutes. Do not share it with anyone.</p></main>`,
  });
  if (error) throw new Error("Cleanup code could not be sent");
}

export async function sendLittleQuestionReminder({ to }: { to: string }) {
  if (!emailConfigured()) throw new Error("Email delivery is not configured");
  const origin = process.env.BETTER_AUTH_URL;
  if (!origin) throw new Error("The app URL is not configured");
  const url = new URL("/space/questions", origin).toString();
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "A little thought is still waiting",
    text: `There is still room for your answer in Our Little Universe.\n\nOpen today’s little question: ${url}\n\nAfter noon, you and your person can choose whether to let this one rest.`,
    html: `<main style="font-family:Arial,sans-serif;color:#4b2c3d;line-height:1.6"><h1 style="font-family:Georgia,serif">A little time remains.</h1><p>There is still room for your answer in <strong>Our Little Universe</strong>.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#b33d6c;color:#fff;text-decoration:none;font-weight:700">Open today’s question</a></p><p>After noon, you and your person can choose whether to let this one rest.</p></main>`,
  });
  if (error) throw new Error("Little question reminder email could not be sent");
}

function appUrl(path = "/space") {
  const origin = process.env.BETTER_AUTH_URL;
  if (!origin) throw new Error("The app URL is not configured");
  return new URL(path, origin).toString();
}

async function sendMomentEmail({ to, subject, heading, body, action }: { to: string; subject: string; heading: string; body: string; action?: string }) {
  if (!emailConfigured()) throw new Error("Email delivery is not configured");
  const url = appUrl();
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!, to, subject,
    text: `${heading}\n\n${body}\n\nOpen Our Little Universe: ${url}`,
    html: `<main style="font-family:Arial,sans-serif;color:#4b2c3d;line-height:1.6"><h1 style="font-family:Georgia,serif">${heading}</h1><p>${body}</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#b33d6c;color:#fff;text-decoration:none;font-weight:700">${action ?? "Open our space"}</a></p></main>`,
  });
  if (error) throw new Error("Moment email could not be sent");
}

export function sendRestRequestEmail({ to }: { to: string }) {
  return sendMomentEmail({ to, subject: "A little pause is waiting for your say", heading: "A little pause is waiting.", body: "Your person asked to let today’s little question rest. Your answer is still private; you can choose together in Our Little Universe.", action: "Respond to the request" });
}

export function sendMonthsaryEmail({ to, coupleName }: { to: string; coupleName: string }) {
  return sendMomentEmail({ to, subject: "One more month of us", heading: "Another little month of us.", body: `Today marks another month of ${coupleName}. Keep a small moment close today.`, action: "Open our space" });
}

export function sendAnniversaryEmail({ to, coupleName, years }: { to: string; coupleName: string; years: number }) {
  return sendMomentEmail({ to, subject: "A year worth keeping close", heading: years === 1 ? "One year of us." : `${years} years of us.`, body: `Today is the anniversary of ${coupleName}. Here’s to every little day that brought you here.`, action: "Celebrate together" });
}

export function sendBirthdayEmail({ to, name, isOwnBirthday }: { to: string; name: string; isOwnBirthday: boolean }) {
  return sendMomentEmail({ to, subject: isOwnBirthday ? "A little birthday wish for you" : `Today is ${name}’s birthday`, heading: isOwnBirthday ? "Today is yours." : "A day to make a little sweeter.", body: isOwnBirthday ? "Happy birthday. May today hold something soft, lovely, and entirely yours." : `It’s ${name}’s birthday today. A small note, a favorite memory, or a little extra care could make the day warmer.`, action: "Open our space" });
}
