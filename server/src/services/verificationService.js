const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

const client = twilio(accountSid, authToken);

function maskPhone(phone) {
  if (!phone || phone.length < 6) return "***";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

async function sendVerificationCode(phone) {
  if (!phone) {
    throw new Error("Phone number is required");
  }

  try {
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phone, channel: "sms" });

    console.log(`[Twilio] Verification sent to ${maskPhone(phone)}`);
    return { message: "Verification code sent" };
  } catch (error) {
    console.error(
      `[Twilio] Error sending to ${maskPhone(phone)}:`,
      error.message,
    );
    throw new Error("SMS илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
  }
}

async function verifyCode(phone, code) {
  if (!phone || !code) {
    throw new Error("Phone and code are required");
  }

  try {
    const check = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phone, code });

    if (check.status !== "approved") {
      throw new Error("Invalid or expired code");
    }

    return { verified: true };
  } catch (error) {
    if (error.message === "Invalid or expired code") throw error;
    console.error(
      `[Twilio] Verify error for ${maskPhone(phone)}:`,
      error.message,
    );
    throw new Error("Код шалгахад алдаа гарлаа");
  }
}

module.exports = { sendVerificationCode, verifyCode };
