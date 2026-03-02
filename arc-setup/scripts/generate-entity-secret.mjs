import crypto from "crypto";
const entitySecret = crypto.randomBytes(32).toString("hex");
console.log("=== Entity Secret Generated ===");
console.log(entitySecret);
console.log("\nCopy the Entity Secret above and register it in Circle Developer Console:");
console.log("Console → Developer Settings → Entity Secret → Register");
