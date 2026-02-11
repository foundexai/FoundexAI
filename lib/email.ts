export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const PLUNK_API_KEY = process.env.PLUNK_API_KEY;

  if (!PLUNK_API_KEY) {
    console.warn("PLUNK_API_KEY not found. Logging email content instead.");
    console.log(`To: ${to}\nSubject: ${subject}\nBody: ${body}`);
    return { success: true, mock: true };
  }

  try {
    const response = await fetch("https://api.useplunk.com/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PLUNK_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        body,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error sending email via Plunk:", error);
    return { success: false, error };
  }
}
