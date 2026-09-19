const buckets = new Map();

export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
};

export const rateLimit = ({ windowMs = 60_000, max = 60, keyPrefix = "global" } = {}) => (
  req,
  res,
  next
) => {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded || req.ip || req.socket?.remoteAddress || "unknown");
  const ip = rawIp.split(",")[0].trim();
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  bucket.count += 1;
  if (bucket.count > max) {
    return res.status(429).json({ message: "Too many requests. Please try again shortly." });
  }

  next();
};

export const notFound = (req, res) => {
  res.status(404).json({ message: "Not found" });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;

  if (process.env.NODE_ENV !== "production") {
    console.error("REQUEST_ERROR", {
      method: req.method,
      path: req.originalUrl,
      status,
      message: err.message
    });
  }

  res.status(status).json({
    message: status >= 500 ? "Something went wrong" : err.message || "Request failed"
  });
};
