/**
 * Send a notification to Slack via Webhook URL.
 * If no Slack URL is configured in environment, it logs the message in a mock format to console.
 */
export async function sendSlackAlert(
  title: string,
  details: string,
  color: "success" | "warning" | "danger" | "info" = "info"
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  // Map levels to color hex codes
  const colors = {
    success: "#22c55e", // green
    warning: "#eab308", // amber
    danger: "#ef4444",  // red
    info: "#3b82f6",    // blue
  };

  const emoji = {
    success: "✅",
    warning: "⚠️",
    danger: "🚨",
    info: "ℹ️",
  };

  const payload = {
    attachments: [
      {
        color: colors[color],
        pretext: `${emoji[color]} *AssetFlow ERP Alert*`,
        title: title,
        text: details,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Slack webhook response error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to post message to Slack webhook:", error);
    }
  } else {
    // Print styled console representation of the alert in local development log
    console.log(
      `\n========================================` +
      `\n📢 MOCK SLACK NOTIFICATION` +
      `\n========================================` +
      `\nTitle:   ${title}` +
      `\nLevel:   ${color.toUpperCase()} ${emoji[color]}` +
      `\nDetails: ${details}` +
      `\n========================================\n`
    );
  }
}
