"use server";

import nodemailer from 'nodemailer';

interface EmailSettings {
  notificationEmails: string[];
  notificationsEnabled: boolean;
}

interface PhotoNotificationData {
  contributorName: string | null;
  caption: string | null;
  photoCount: number;
  uploadedAt: string;
}

interface MemoryNotificationData {
  contributorName: string | null;
  message: string;
  submittedAt: string;
}

// Get email settings from environment variables
async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const notificationEmails = process.env.NOTIFICATION_EMAILS?.split(',') || [];
    const notificationsEnabled = process.env.NOTIFICATIONS_ENABLED === 'true';
    
    return {
      notificationEmails: notificationEmails.filter(email => email.trim()),
      notificationsEnabled
    };
  } catch {
    console.log("No email settings found, notifications disabled");
    return {
      notificationEmails: [],
      notificationsEnabled: false
    };
  }
}

// Create Gmail transporter
function createGmailTransporter() {
  const email = process.env.GMAIL_EMAIL;
  const password = process.env.GMAIL_APP_PASSWORD;
  
  if (!email || !password) {
    console.warn("Gmail credentials not configured. Falling back to console logging.");
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password
    }
  });
}

// Send email using Gmail SMTP
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    const transporter = createGmailTransporter();
    
    if (!transporter) {
      // Fallback to console logging if Gmail not configured
      console.log("📧 EMAIL NOTIFICATION (Console Log - Gmail not configured):");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      console.log("---");
      return true;
    }
    
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: to,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${to}:`, result.messageId);
    return true;
    
  } catch (error) {
    console.error("Failed to send email:", error);
    // Fallback to console logging on error
    console.log("📧 EMAIL NOTIFICATION (Console Log - Send failed):");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log("---");
    return false;
  }
}

// Send photo upload notification
export async function sendPhotoUploadNotification(data: PhotoNotificationData): Promise<void> {
  try {
    const settings = await getEmailSettings();
    
    if (!settings.notificationsEnabled || settings.notificationEmails.length === 0) {
      console.log("Email notifications disabled or no emails configured");
      return;
    }

    const subject = `New Photo${data.photoCount > 1 ? 's' : ''} Added to Rudy's Memorial`;
    const contributorText = data.contributorName ? ` by ${data.contributorName}` : ' anonymously';
    const photoText = data.photoCount === 1 ? 'photo' : `${data.photoCount} photos`;
    
    const body = `
A new ${photoText} has been added to Rudy's memorial site${contributorText}.

${data.caption ? `Caption: "${data.caption}"` : ''}

Uploaded: ${new Date(data.uploadedAt).toLocaleString()}

You can view the photos in the gallery at: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:6464'}/gallery

---
This is an automated notification from Rudy's Memorial Site.
    `.trim();

    // Send to all configured email addresses
    const emailPromises = settings.notificationEmails.map(email => 
      sendEmail(email, subject, body)
    );
    
    await Promise.all(emailPromises);
    console.log(`📧 Photo upload notifications sent to ${settings.notificationEmails.length} recipients`);
    
  } catch (error) {
    console.error("Error sending photo upload notification:", error);
  }
}

// Send memory submission notification
export async function sendMemorySubmissionNotification(data: MemoryNotificationData): Promise<void> {
  try {
    const settings = await getEmailSettings();
    
    if (!settings.notificationsEnabled || settings.notificationEmails.length === 0) {
      console.log("Email notifications disabled or no emails configured");
      return;
    }

    const subject = "New Memory Added to Rudy's Memorial";
    const contributorText = data.contributorName ? ` by ${data.contributorName}` : ' anonymously';
    
    const body = `
A new memory has been shared on Rudy's memorial site${contributorText}.

Memory: "${data.message}"

Submitted: ${new Date(data.submittedAt).toLocaleString()}

You can view the memory on the memorial wall at: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:6464'}/memorial-wall

---
This is an automated notification from Rudy's Memorial Site.
    `.trim();

    // Send to all configured email addresses
    const emailPromises = settings.notificationEmails.map(email => 
      sendEmail(email, subject, body)
    );
    
    await Promise.all(emailPromises);
    console.log(`📧 Memory submission notifications sent to ${settings.notificationEmails.length} recipients`);
    
  } catch (error) {
    console.error("Error sending memory submission notification:", error);
  }
}
