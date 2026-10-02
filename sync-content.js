// content.json 편집 후: node sync-content.js
const fs = require("node:fs");
const path = require("node:path");
const model = require("./content-model.js");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "content.json"), "utf8").replace(/^\uFEFF/, ""));
model.validate(data);
fs.writeFileSync(path.join(__dirname, "content-data.js"), "// content.json에서 자동 생성. 직접 편집하지 마세요.\nwindow.APP_CONTENT = " + JSON.stringify(data, null, 2) + ";\n", "utf8");
console.log("content.json 검증 완료 · content-data.js 반영 완료");
