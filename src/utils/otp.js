import bcrypt from "bcryptjs";

export function generateNumericOTP(length = 6) {
  const min = 10 ** (length - 1);
  const num = Math.floor(min + Math.random() * (9 * min));
  return String(num).slice(0, length);
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

export async function compareOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}

export function maskPhone(phone) {
  return phone.replace(/.(?=.{4})/g, "*");
}
