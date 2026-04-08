const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET || "supersecretkey", (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    req.user = decoded;
    next();
  });
};

const isOperator = (req, res, next) => {
  if (req.user && req.user.role === "operator") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Operator role required" });
  }
};

module.exports = { authMiddleware, isOperator };
