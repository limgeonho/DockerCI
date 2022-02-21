const express = require("express");

const PORT = 8080;

// APP
const app = express();
app.get("/", (req, res) => {
  res.send("Hello World");
});

// APP 실행방법(8080 == PORT으로 접속하면됨)
app.listen(PORT);
