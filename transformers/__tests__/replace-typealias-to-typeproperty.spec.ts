describe("replace-typealias-to-typeproperty", () => {
  const defineTest = require("jscodeshift/dist/testUtils").defineTest;
  const fixtures = [
    "replace-typealias-to-typeproperty-fixture1",
    "replace-typealias-to-typeproperty-fixture2",
    "replace-typealias-to-typeproperty-fixture3",
  ];

  fixtures.forEach((fixture) => {
    defineTest(
      __dirname,
      "replace-typealias-to-typeproperty", // トランスフォーマーファイルへのパス
      null, // オプション（必要に応じて変更可能）
      fixture,
      { parser: "tsx" }
    );
  });
});
