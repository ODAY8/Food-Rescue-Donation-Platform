const nodemailer = require("nodemailer");

// Configuration from environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY || (process.env.SMTP_PASS?.startsWith("re_") ? process.env.SMTP_PASS : null);
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || '"Food Rescue" <onboarding@resend.dev>';
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const EMAIL_OVERRIDE_TO = process.env.EMAIL_OVERRIDE_TO || null;

// Create transporter only if non-Resend SMTP credentials are provided
let transporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS && !RESEND_API_KEY) {
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
}

/**
 * Generic email dispatcher supporting Resend API (HTTPS), SMTP (Nodemailer), and Dev Console.
 */
const sendMail = async ({ to, subject, html, text }) => {
    if (!to) return { success: false, reason: "No recipient email provided" };

    const recipient = EMAIL_OVERRIDE_TO || to;
    const emailSubject = EMAIL_OVERRIDE_TO && EMAIL_OVERRIDE_TO !== to
        ? `[For ${to}] ${subject}`
        : subject;

    // 1. Direct Resend API (Fast, HTTPS over port 443, no SMTP port blocking)
    if (RESEND_API_KEY) {
        try {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: EMAIL_FROM,
                    to: recipient,
                    subject: emailSubject,
                    html,
                    text,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                console.error(`[RESEND ERROR] HTTP ${res.status}:`, data?.message || data);
                return { success: false, error: data?.message || "Resend error" };
            }
            console.log(`✉️ [EMAIL SENT VIA RESEND] ID: ${data.id} -> To: ${recipient}`);
            return { success: true, messageId: data.id, provider: "resend" };
        } catch (err) {
            console.error(`[RESEND ERROR] Failed to send to ${to}:`, err.message);
            return { success: false, error: err.message };
        }
    }

    // 2. Standard SMTP (Nodemailer)
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: EMAIL_FROM,
                to,
                subject,
                text,
                html,
            });
            return { success: true, messageId: info.messageId, provider: "smtp" };
        } catch (err) {
            console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message);
            return { success: false, error: err.message };
        }
    }

    // 3. Dev / Test Mode: Log to console so flows succeed without SMTP keys
    console.log(`\n📧 [DEV EMAIL DISPATCHED]`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text: ${text || subject}`);
    console.log(`-----------------------------------------\n`);
    return { success: true, mode: "dev-simulated", to, subject };
};

/**
 * Modern HTML email wrapper matching the platform's green/neutral design system.
 */
const renderEmailTemplate = ({ title, preheader, bodyHtml, ctaText, ctaUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1c1e;">
  <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background-color: #2d6a4f; padding: 24px 32px; text-align: left;">
      <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
        🍲 FoodRescue Platform
      </h1>
      <p style="margin: 4px 0 0 0; color: #d8f3dc; font-size: 13px;">Fight Food Waste & Hunger</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 16px 0; color: #1c1c1e; font-size: 20px; font-weight: 600;">
        ${title}
      </h2>
      ${preheader ? `<p style="margin: 0 0 20px 0; color: #4b5563; font-size: 15px; line-height: 1.5;">${preheader}</p>` : ""}
      
      <div style="margin: 20px 0; font-size: 15px; line-height: 1.6; color: #374151;">
        ${bodyHtml}
      </div>

      ${ctaText && ctaUrl ? `
      <div style="margin: 32px 0 16px 0; text-align: left;">
        <a href="${ctaUrl}" style="display: inline-block; background-color: #2d6a4f; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px;">
          ${ctaText} &rarr;
        </a>
      </div>
      ` : ""}
    </div>

    <!-- Footer -->
    <div style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: left;">
      <p style="margin: 0 0 4px 0;">This is an automated notification from the Food Rescue Donation Platform.</p>
      <p style="margin: 0;">Food safety reminder: Always verify physical packaging and storage temperature during handoff.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * 1. Send upcoming pickup reminder (Scheduled donations).
 */
const sendPickupReminder = async ({
    to,
    name,
    role = "DONOR",
    foodTitle,
    quantity,
    unit,
    pickupLocation,
    pickupWindow,
    scheduledFor,
    hoursLeft = 2,
    code,
}) => {
    const isDonor = role === "DONOR";
    const title = isDonor
        ? `Reminder: Pickup for "${foodTitle}" in ~${hoursLeft} hour(s)`
        : `Reminder: Scheduled collection of "${foodTitle}" in ~${hoursLeft} hour(s)`;

    const preheader = isDonor
        ? `Hi ${name || "there"}, a recipient organization is scheduled to collect your food donation soon.`
        : `Hi ${name || "there"}, your team is scheduled to collect a food donation soon.`;

    const bodyHtml = `
      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div style="margin-bottom: 8px;"><strong>Listing:</strong> ${foodTitle}</div>
        <div style="margin-bottom: 8px;"><strong>Quantity:</strong> ${quantity} ${unit}</div>
        <div style="margin-bottom: 8px;"><strong>Pickup Location:</strong> ${pickupLocation || "Specified on platform"}</div>
        <div style="margin-bottom: 8px;"><strong>Pickup Window:</strong> ${pickupWindow || "Flexible"}</div>
        <div><strong>Scheduled Time:</strong> ${new Date(scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      ${isDonor
        ? `<p style="margin: 12px 0 0 0; color: #4b5563;">Please have the verification QR code ready on your screen or printed for the driver to scan upon collection.</p>`
        : `<p style="margin: 12px 0 0 0; color: #4b5563;">Please remember to scan the donor's QR code on-site using your mobile scanner to confirm handoff.</p>`
      }
    `;

    const ctaText = isDonor ? "View Pickup QR Code" : "Open Mobile Scanner";
    const ctaUrl = isDonor ? `${CLIENT_URL}/donor/qr` : `${CLIENT_URL}/ngo/scan`;

    return sendMail({
        to,
        subject: `⏰ Pickup Reminder: ${foodTitle} (in ${hoursLeft} hrs)`,
        html: renderEmailTemplate({ title, preheader, bodyHtml, ctaText, ctaUrl }),
        text: `${title}\n\nListing: ${foodTitle}\nLocation: ${pickupLocation}\nTime: ${new Date(scheduledFor).toLocaleString()}\nLink: ${ctaUrl}`,
    });
};

/**
 * 2. Send notification when an NGO claims food.
 */
const sendClaimNotification = async ({
    donorEmail,
    donorName,
    foodTitle,
    ngoName,
}) => {
    const title = `New Claim Request for "${foodTitle}"`;
    const preheader = `Hi ${donorName || "there"}, ${ngoName || "An NGO"} has requested to rescue your food listing.`;
    const bodyHtml = `
      <p><strong>${ngoName || "A certified organization"}</strong> has submitted a claim request for <strong>${foodTitle}</strong>.</p>
      <p>Please review and approve the request on your dashboard so pickup details can be coordinated.</p>
    `;
    const ctaText = "Review Claim on Dashboard";
    const ctaUrl = `${CLIENT_URL}/donor`;

    return sendMail({
        to: donorEmail,
        subject: `New Claim Request: ${foodTitle}`,
        html: renderEmailTemplate({ title, preheader, bodyHtml, ctaText, ctaUrl }),
        text: `${title}\n\n${ngoName} requested to rescue "${foodTitle}". Review: ${ctaUrl}`,
    });
};

/**
 * 3. Send notification to NGO when a claim is approved.
 */
const sendApprovalNotification = async ({
    ngoEmail,
    ngoName,
    foodTitle,
    donorName,
    pickupLocation,
    pickupWindow,
}) => {
    const title = `Claim Approved: "${foodTitle}" is ready!`;
    const preheader = `Great news! ${donorName || "The donor"} has approved your food rescue claim.`;
    const bodyHtml = `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div style="margin-bottom: 8px; color: #065f46;"><strong>Status: Ready for Collection</strong></div>
        <div style="margin-bottom: 8px;"><strong>Donor:</strong> ${donorName || "Partner Donor"}</div>
        <div style="margin-bottom: 8px;"><strong>Pickup Location:</strong> ${pickupLocation || "See dashboard"}</div>
        <div><strong>Pickup Window:</strong> ${pickupWindow || "As agreed"}</div>
      </div>
      <p style="margin: 12px 0 0 0; color: #4b5563;">When you arrive for pickup, scan the donor's QR code to confirm delivery and update records.</p>
    `;
    const ctaText = "View Claim Details";
    const ctaUrl = `${CLIENT_URL}/ngo`;

    return sendMail({
        to: ngoEmail,
        subject: `✅ Claim Approved: ${foodTitle} Ready for Pickup`,
        html: renderEmailTemplate({ title, preheader, bodyHtml, ctaText, ctaUrl }),
        text: `${title}\n\nApproved by ${donorName}.\nAddress: ${pickupLocation}\nWindow: ${pickupWindow}\nLink: ${ctaUrl}`,
    });
};

module.exports = {
    sendMail,
    sendPickupReminder,
    sendClaimNotification,
    sendApprovalNotification,
};
