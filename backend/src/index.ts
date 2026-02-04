import http from "http";
import { prisma } from "./db/prisma"; // fixed path

const PORT = Number(process.env.PORT ?? 3000);

const server = http.createServer(async (req, res) => {
  const url = req.url ?? "/";

  if (req.method === "GET" && url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok" }));
  }

  // Run the demo: create one user, read it back, then delete it
  if (req.method === "GET" && url === "/demo-run") {
    try {
      const unique = Date.now().toString();
      const email = `demo-${unique}@example.com`;
      const phone = `+100000${unique.slice(-6)}`;

      // Create (select avoids sending password_hash)
      const created = await prisma.user.create({
        data: {
          full_name: "Demo User",
          email,
          phone_number: phone,
          password_hash: "demo-placeholder",
        },
        select: {
          user_id: true,
          full_name: true,
          email: true,
          phone_number: true,
          role: true,
          is_active: true,
          created_at: true,
        },
      });

      // Read back
      const fetched = await prisma.user.findUnique({
        where: { user_id: created.user_id },
        select: {
          user_id: true,
          full_name: true,
          email: true,
          phone_number: true,
          created_at: true,
        },
      });

      // Delete
      const deleted = await prisma.user.delete({
        where: { user_id: created.user_id },
        select: { user_id: true },
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ created, fetched, deleted }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: String(err) }));
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal} — closing server and disconnecting DB...`);
  server.close(() => void 0);
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));