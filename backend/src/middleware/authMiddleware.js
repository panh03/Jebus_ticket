const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    console.warn("Auth failed: No token provided");
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "supersecretkey", (err, decoded) => {
    if (err) {
      console.warn("Auth failed: Invalid token", err.message);
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

const isOperator = (req, res, next) => {
  if (req.user && req.user.role === "operator") {
    next();
  } else {
    console.warn(`Access denied for user ${req.user?.email}: Role is ${req.user?.role}`);
    res.status(403).json({ message: "Access denied: Operator role required" });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || "supersecretkey", (err, decoded) => {
    if (!err) {
      req.user = decoded;
    }
    next();
  });
};

module.exports = { authMiddleware, isOperator, optionalAuth };
