require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/inventory", require("./routes/inventory"));
app.use("/items", require("./routes/items"));
app.use("/restock", require("./routes/restock"));
app.use("/admin", require("./routes/admin"));
app.use("/notifications", require("./routes/notifications"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Clinic API running on port ${PORT}`));
