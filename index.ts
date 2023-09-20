import { parser } from "./json.grammar";
import { NodeProp } from "@lezer/common";
import json5 from "json5";

export function parse(
  input: string,
  reviver: (this: any, key: string, value: any) => any,
  { dialect = "json", tabWidth = 4 } = {}
) {
  // Let these parsers throw any errors about invalid input
  let data =
    dialect === "JSON5"
      ? json5.parse(input, reviver)
      : JSON.parse(input, reviver);

  let tree = parser
    .configure({
      strict: true,
      dialect: dialect === "JSON5" ? "json5" : "json",
    })
    .parse(input);

  let pointers = new Map();
  let currentPath: Array<number | string> = [""];

  tree.iterate({
    enter(node) {
      // if (type.isError) {
      // 	let fromPos = posToLineColumn(input, from, tabWidth);
      // 	let error = new SyntaxError(
      // 		`Failed to parse (${fromPos.line}:${fromPos.column})`
      // 	);
      // 	error.lineNumber = fromPos.line;
      // 	error.columnNumber = fromPos.column;
      // 	throw error;
      // }

      let group = node.type.prop(NodeProp.group);
      if (group?.includes("Value")) {
        mapMerge(pointers, toJsonPointer(currentPath), {
          value: posToLineColumn(input, node.from, tabWidth),
          valueEnd: posToLineColumn(input, node.to, tabWidth),
        });
      }

      if (node.name === "PropertyName") {
        let name = input.slice(node.from, node.to);
        let quoted = name[0] === `'` || name[0] == `"`;
        currentPath.push(quoted ? name.slice(1, -1) : name);
        mapMerge(pointers, toJsonPointer(currentPath), {
          key: posToLineColumn(input, node.from, tabWidth),
          keyEnd: posToLineColumn(input, node.to, tabWidth),
        });
      } else if (node.name === "Array") {
        currentPath.push(0);
      }
    },
    leave(node) {
      if (node.name === "Property" || node.name === "Array") {
        currentPath.pop();
      } else if (node.name === "ArrayValue") {
        // @ts-ignore
        currentPath[currentPath.length - 1]++;
      }
    },
  });

  return {
    data,
    pointers: Object.fromEntries(pointers),
  };
}

function mapMerge<K, V>(map: Map<K, V>, key: K, data: V) {
  let value = map.get(key);
  value = { ...value, ...data };
  map.set(key, value);
}

function posToLineColumn(input: string, pos: number, tabWidth: number) {
  let line = countNewLines(input, pos);
  let lineStart = input.lastIndexOf("\n", pos - 1) + 1;
  let column = countColumn(input, lineStart, pos, tabWidth);

  return {
    line,
    column,
    pos,
  };
}

function countNewLines(str: string, end: number) {
  let count = 0;
  for (let i = 0; i < end; i++) {
    if (str[i] === "\n") {
      count++;
    }
  }
  return count;
}

function countColumn(
  str: string,
  start: number,
  end: number,
  tabWidth: number
) {
  let count = 0;
  for (let i = start; i < end; i++) {
    count += str[i] === "\t" ? tabWidth : 1;
  }
  return count;
}

const ESCAPE_REGEX = /[~/]/g;

function toJsonPointer(path: Array<string | number>) {
  let str = "";
  for (let e of path) {
    if (typeof e === "string") {
      str += e.replace(ESCAPE_REGEX, (v) => (v === "~" ? "~0" : "~1")) + "/";
    } else {
      str += String(e) + "/";
    }
  }
  return str.slice(0, -1);
}
