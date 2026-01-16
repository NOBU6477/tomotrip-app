// 事前要望（PreRequest）API のひな形
// 今日は「置く」だけ。動かすのは次のステップ。

import express from "express";

const router = express.Router();

// テスト用：APIが生きているか確認
router.get("/pre-requests/test", (req, res) => {
  res.json({
    success: true,
    message: "preRequestAPI は動いています",
  });
});

export default router;
