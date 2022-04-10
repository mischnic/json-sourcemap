import { parser } from "./json.grammar";
import { NodeProp } from "@lezer/common";
import json5 from "json5";

export function parse(input, reviver, { dialect = "json", tabWidth = 4 } = {}) {
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
	let currentPath = [""];

	tree.iterate({
		enter(type, from, to, get) {
			// if (type.isError) {
			// 	let fromPos = posToLineColumn(input, from, tabWidth);
			// 	let error = new SyntaxError(
			// 		`Failed to parse (${fromPos.line}:${fromPos.column})`
			// 	);
			// 	error.lineNumber = fromPos.line;
			// 	error.columnNumber = fromPos.column;
			// 	throw error;
			// }

			let group = type.prop(NodeProp.group);
			if (group?.includes("Value")) {
				mapMerge(pointers, toJsonPointer(currentPath), {
					value: posToLineColumn(input, from, tabWidth),
					valueEnd: posToLineColumn(input, to, tabWidth),
				});
			}

			if (type.name === "PropertyName") {
				let nameNode = get();
				let name = input.slice(nameNode.from, nameNode.to);
				let quoted = name[0] === `'` || name[0] == `"`;
				currentPath.push(quoted ? name.slice(1, -1) : name);
				mapMerge(pointers, toJsonPointer(currentPath), {
					key: posToLineColumn(input, from, tabWidth),
					keyEnd: posToLineColumn(input, to, tabWidth),
				});
			} else if (type.name === "Array") {
				currentPath.push(0);
			}
		},
		leave(type, from, to, get) {
			if (type.name === "Property" || type.name === "Array") {
				currentPath.pop();
			} else if (type.name === "ArrayValue") {
				currentPath[currentPath.length - 1]++;
			}
		},
	});

	return {
		data,
		pointers: Object.fromEntries(pointers),
	};
}

function mapMerge(map, key, data) {
	let value = map.get(key);
	value = { ...value, ...data };
	map.set(key, value);
}

function posToLineColumn(input, pos, tabWidth) {
	let line = countNewLines(input, pos);
	let lineStart = input.lastIndexOf("\n", pos - 1) + 1;
	let column = countColumn(input, lineStart, pos, tabWidth);

	return {
		line,
		column,
		pos,
	};
}

function countNewLines(str, end) {
	let count = 0;
	for (let i = 0; i < end; i++) {
		if (str[i] === "\n") {
			count++;
		}
	}
	return count;
}

function countColumn(str, start, end, tabWidth) {
	let count = 0;
	for (let i = start; i < end; i++) {
		count += str[i] === "\t" ? tabWidth : 1;
	}
	return count;
}

const ESCAPE_REGEX = /[~/]/g;

function toJsonPointer(path) {
	let str = "";
	for (let e of path) {
		if (typeof e === "string") {
			str +=
				e.replace(ESCAPE_REGEX, (v) => (v === "~" ? "~0" : "~1")) + "/";
		} else {
			str += String(e) + "/";
		}
	}
	return str.slice(0, -1);
}
