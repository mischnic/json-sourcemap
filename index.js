import { parser } from "./json.grammar";
import { NodeProp } from "@lezer/common";
import json5 from "json5";

export function parse(input, reviver, { useJSON5 = false, tabWidth = 4 } = {}) {
	// Let these parsers throw any errors about invalid input
	let data = useJSON5
		? json5.parse(input, reviver)
		: JSON.parse(input, reviver);

	let tree = parser
		.configure({
			strict: true,
			dialect: useJSON5 ? "json5" : "json",
		})
		.parse(input);

	let pointers = {};
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
		pointers,
	};
}

function mapMerge(map, key, data) {
	let value = map[key];
	value = { ...value, ...data };
	map[key] = value;
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

function toJsonPointer(path) {
	return path
		.map((e) =>
			String(e).replace(/[~/]/g, (v) => (v === "~" ? "~0" : "~1"))
		)
		.join("/");
}
