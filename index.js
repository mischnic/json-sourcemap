import { parser } from "./json.grammar";
import { NodeProp } from "@lezer/common";
import json5 from "json5";

export function parse(input, reviver, { useJSON5 = false, tabWidth = 4 } = {}) {
	let data = useJSON5
		? json5.parse(input, reviver)
		: JSON.parse(input, reviver);

	let tree = parser
		.configure({
			strict: true,
			dialect: useJSON5 ? "json5" : "json",
		})
		.parse(input);
	let tab = " ".repeat(tabWidth);

	let pointers = {};
	let currentPath = [""];

	tree.iterate({
		enter(type, from, to, get) {
			let group = type.prop(NodeProp.group);
			if (group?.includes("Value")) {
				mapMerge(pointers, toJsonPointer(currentPath), {
					value: posToLineColumn(input, from, tab),
					valueEnd: posToLineColumn(input, to, tab),
				});
			}

			if (type.name === "PropertyName") {
				let nameNode = get();
				let name = input.slice(nameNode.from, nameNode.to);
				let quoted = name[0] === `'` || name[0] == `"`;
				currentPath.push(quoted ? name.slice(1, -1) : name);
				mapMerge(pointers, toJsonPointer(currentPath), {
					key: posToLineColumn(input, from, tab),
					keyEnd: posToLineColumn(input, to, tab),
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

function posToLineColumn(input, pos, tab) {
	let before = input.slice(0, pos);
	let line = before.match(/\n/g)?.length ?? 0;
	let lineStart = before.lastIndexOf("\n") + 1;
	let thisLine = input.slice(lineStart, pos);
	let column = thisLine.replace(/\t/g, tab).length;

	return {
		line,
		column,
		pos,
	};
}

function toJsonPointer(path) {
	return path
		.map((e) =>
			String(e).replace(/[~/]/g, (v) => (v === "~" ? "~0" : "~1"))
		)
		.join("/");
}
