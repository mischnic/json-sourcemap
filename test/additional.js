"use strict";

const jsonMap = require("../");
const assert = require("assert");
const jsonPointer = require("json-pointer");

describe("parse", function () {
  it("escapes json pointer", function () {
    let json = `{"~": true,"/": false}`;
    let parsed = jsonMap.parse(json);
    assert.deepStrictEqual(parsed.pointers, {
      "": {
        value: { column: 0, line: 0, pos: 0 },
        valueEnd: { column: 22, line: 0, pos: 22 },
      },
      "/~0": {
        key: { column: 1, line: 0, pos: 1 },
        keyEnd: { column: 4, line: 0, pos: 4 },
        value: { column: 6, line: 0, pos: 6 },
        valueEnd: { column: 10, line: 0, pos: 10 },
      },
      "/~1": {
        key: { column: 11, line: 0, pos: 11 },
        keyEnd: { column: 14, line: 0, pos: 14 },
        value: { column: 16, line: 0, pos: 16 },
        valueEnd: { column: 21, line: 0, pos: 21 },
      },
    });
  });

  it("works with different line endings: nl", function () {
    let json = `{\n}`;
    let parsed = jsonMap.parse(json);
    assert.deepStrictEqual(parsed.pointers, {
      "": {
        value: { line: 0, column: 0, pos: 0 },
        valueEnd: { line: 1, column: 1, pos: 3 },
      },
    });
  });
  it("works with different line endings: cr nl", function () {
    let json = `{\r\n}`;
    let parsed = jsonMap.parse(json);
    assert.deepStrictEqual(parsed.pointers, {
      "": {
        value: { line: 0, column: 0, pos: 0 },
        valueEnd: { line: 1, column: 1, pos: 4 },
      },
    });
  });
});
