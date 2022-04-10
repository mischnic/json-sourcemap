# json-sourcemap

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
