const path = require("path");

function log(message, source = "express") {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  console.log(`${timestamp} [${source}] ${message}`);
}

async function setupVite(app, server) {
  const vite = await (await import("vite")).createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base: "/",
  });
  
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const template = await vite.transformIndexHtml(url, `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Career Portal</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/client/src/main.tsx"></script>
          </body>
        </html>
      `);

      res.status(200).set({ "Content-Type": "text/html" }).send(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  const port = process.env.PORT || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
}

function serveStatic(app) {
  const distPath = path.resolve("dist");
  const publicPath = path.resolve("public");
  
  app.use(require("express").static(publicPath));
  app.use(require("express").static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

module.exports = { log, setupVite, serveStatic };