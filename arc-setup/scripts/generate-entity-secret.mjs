import crypto from "crypto";
const entitySecret = crypto.randomBytes(32).toString("hex");
console.log("=== Entity Secret Generated ===");
console.log(entitySecret);
console.log("\n请复制上面的 Entity Secret，去 Circle Developer Console 注册：");
console.log("Console → Developer Settings → Entity Secret → Register");
