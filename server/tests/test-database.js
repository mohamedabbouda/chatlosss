export function assertTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  const url = new URL(databaseUrl);
  const databaseName = decodeURIComponent(url.pathname.slice(1));

  if (databaseName !== "chatlosss_test") {
    throw new Error(
      `Tests must use chatlosss_test, not ${databaseName}`
    );
  }
}