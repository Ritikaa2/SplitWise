const USD_TO_INR = Number(process.env.USD_TO_INR || 83);

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function convertToInr(amount, currency) {
  return round2(String(currency).toUpperCase() === "USD" ? Number(amount) * USD_TO_INR : Number(amount));
}

module.exports = { USD_TO_INR, round2, convertToInr };
