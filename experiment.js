const { parse } = require(".");
const { parse: parse2 } = require("json-source-map");

let input = `[${'{"a": true, "b": 123123, "c": "xyz"}\n,'
	.repeat(100)
	.slice(0, -1)}]`;
// let input = '{\t\v\f \u00A0\uFEFF\n\r\u2028\u2029\u2003}';
// let input = '{\\u0061:1}';
// let input = String.raw`{
//   // comments
//   unquoted: 'and you can quote me on that',
//   singleQuotes: 'I can use "double quotes" here',
//   lineBreaks: "Look, Mom! \
// No \\n's!",
//   hexadecimal: 0xdecaf,
//   leadingDecimalPoint: .8675309, andTrailing: 8675309.,
//   positiveSign: +1,
//   trailingComma: 'in objects', andIn: ['arrays',],
//   "backwardsCompatible": "with JSON",
// withFractionPart: 123.456,
// onlyFractionPart: .456,
// withExponent: 123e-456,
// positiveInfinity: Infinity,
// negativeInfinity: -Infinity,
// notANumber: NaN,
// positiveSign: +1,
// }`;

/*console.log*/ parse(input, null, { useJSON5: true }).pointers;
// console.log(parse2(input).pointers);
