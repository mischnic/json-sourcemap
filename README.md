# json-sourcemap

Generate file positions for values in a JSON file.

Inspired by and mostly API-compatible with https://github.com/epoberezkin/json-source-map.

## Usage

```ts
type Position = { line: number; column: number; pos: number };

export function parse(
	text: string,
	reviver?: function,
	options?: { tabWidth?: number; useJSON5: boolean }
): {
	data: mixed;
	pointers: {
		[string]:
			| { value: Position; valueEnd: Position }
			| {
					value: Position;
					valueEnd: Position;
					key: Position;
					keyEnd: Position;
			  };
	};
};
```

The default `tabWidth` is 4.

The `valueEnd` and `keyEnd` positions are exclusive.
