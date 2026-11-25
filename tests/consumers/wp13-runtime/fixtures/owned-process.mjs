// Explicit adversarial process only. No producer/archive/application authority.
if (process.env.WP13_FINAL !== "1") throw Error("FINAL-only adversary");
if (process.argv[2] === "exit") process.exitCode = 7;
else if (process.argv[2] === "port") {
  const { createServer } = await import("node:net");
  const server = createServer();
  server.listen({ host: "127.0.0.1", port: 6575, exclusive: true }, () =>
    process.stdout.write("OWNED_ADVERSARY_READY\n"),
  );
  process.once("SIGTERM", () => server.close());
} else if (process.argv[2] === "wait") {
  const timer = setInterval(() => {}, 1000);
  process.once("SIGTERM", () => clearInterval(timer));
} else throw Error("Unknown adversarial mode");
