"use strict";
// from https://github.com/json5/json5/blob/502da86f8e8e2168e301dc5157919935082d0f7b/test/parse.js
// MIT License
// Copyright (c) 2012-2018 Aseem Kishore, and others.

const assert = require('assert')
const jsonMap = require('..')
const JSON5 = {
	parse(v, revivier) {
		return jsonMap.parse(v, revivier, {"dialect": "JSON5"}).data;
	}
}

describe('parse(text)', () => {
    it('objects', () => {
        assert.deepStrictEqual(
            JSON5.parse('{}'),
            {},
            'parses empty objects'
        )

        assert.deepStrictEqual(
            JSON5.parse('{"a":1}'),
            {a: 1},
            'parses double string property names'
        )

        assert.deepStrictEqual(
            JSON5.parse("{'a':1}"),
            {a: 1},
            'parses single string property names'
        )

        assert.deepStrictEqual(
            JSON5.parse('{a:1}'),
            {a: 1},
            'parses unquoted property names'
        )

        assert.deepStrictEqual(
            JSON5.parse('{$_:1,_$:2,a\u200C:3}'),
            {$_: 1, _$: 2, 'a\u200C': 3},
            'parses special character property names'
        )

        assert.deepStrictEqual(
            JSON5.parse('{ùńîċõďë:9}'),
            {'ùńîċõďë': 9},
            'parses unicode property names'
        )

        assert.deepStrictEqual(
            JSON5.parse('{\\u0061\\u0062:1,\\u0024\\u005F:2,\\u005F\\u0024:3}'),
            {ab: 1, $_: 2, _$: 3},
            'parses escaped property names'
        )

        assert.deepStrictEqual(
            JSON5.parse('{abc:1,def:2}'),
            {abc: 1, def: 2},
            'parses multiple properties'
        )

        assert.deepStrictEqual(
            JSON5.parse('{a:{b:2}}'),
            {a: {b: 2}},
            'parses nested objects'
        )
    })

    it('arrays', () => {
        assert.deepStrictEqual(
            JSON5.parse('[]'),
            [],
            'parses empty arrays'
        )

        assert.deepStrictEqual(
            JSON5.parse('[1]'),
            [1],
            'parses array values'
        )

        assert.deepStrictEqual(
            JSON5.parse('[1,2]'),
            [1, 2],
            'parses multiple array values'
        )

        assert.deepStrictEqual(
            JSON5.parse('[1,[2,3]]'),
            [1, [2, 3]],
            'parses nested arrays'
        )
    })

    it('nulls', () => {
        assert.equal(
            JSON5.parse('null'),
            null,
            'parses nulls'
        )
    })

    it('Booleans', () => {
        assert.equal(
            JSON5.parse('true'),
            true,
            'parses true'
        )

        assert.equal(
            JSON5.parse('false'),
            false,
            'parses false'
        )
    })

    it('numbers', () => {
        assert.deepStrictEqual(
            JSON5.parse('[0,0.,0e0]'),
            [0, 0, 0],
            'parses leading zeroes'
        )

        assert.deepStrictEqual(
            JSON5.parse('[1,23,456,7890]'),
            [1, 23, 456, 7890],
            'parses integers'
        )

        assert.deepStrictEqual(
            JSON5.parse('[-1,+2,-.1,-0]'),
            [-1, +2, -0.1, -0],
            'parses signed numbers'
        )

        assert.deepStrictEqual(
            JSON5.parse('[.1,.23]'),
            [0.1, 0.23],
            'parses leading decimal points'
        )

        assert.deepStrictEqual(
            JSON5.parse('[1.0,1.23]'),
            [1, 1.23],
            'parses fractional numbers'
        )

        assert.deepStrictEqual(
            JSON5.parse('[1e0,1e1,1e01,1.e0,1.1e0,1e-1,1e+1]'),
            [1, 10, 10, 1, 1.1, 0.1, 10],
            'parses exponents'
        )

        assert.deepStrictEqual(
            JSON5.parse('[0x1,0x10,0xff,0xFF]'),
            [1, 16, 255, 255],
            'parses hexadecimal numbers'
        )

        assert.deepStrictEqual(
            JSON5.parse('[Infinity,-Infinity]'),
            [Infinity, -Infinity],
            'parses signed and unsigned Infinity'
        )

        assert(
            isNaN(JSON5.parse('NaN')),
            'parses NaN'
        )

        assert(
            isNaN(JSON5.parse('-NaN')),
            'parses signed NaN'
        )

        assert.deepStrictEqual(
            JSON5.parse('1'),
            1,
            'parses 1'
        )

        assert.deepStrictEqual(
            JSON5.parse('+1.23e100'),
            1.23e100,
            'parses +1.23e100'
        )

        assert.deepStrictEqual(
            JSON5.parse('0x1'),
            0x1,
            'parses bare hexadecimal number'
        )

        assert.deepStrictEqual(
            JSON5.parse('-0x0123456789abcdefABCDEF'),
            -0x0123456789abcdefABCDEF,
            'parses bare long hexadecimal number'
        )
    })

    it('strings', () => {
        assert.equal(
            JSON5.parse('"abc"'),
            'abc',
            'parses double quoted strings'
        )

        assert.equal(
            JSON5.parse("'abc'"),
            'abc',
            'parses single quoted strings'
        )

        assert.deepStrictEqual(
            JSON5.parse(`['"',"'"]`),
            ['"', "'"],
            'parses quotes in strings')

        assert.equal(
            JSON5.parse(`'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\\r\\\u2028\\\u2029\\a\\'\\"'`),
            `\b\f\n\r\t\v\0\x0f\u01FF\a'"`, // eslint-disable-line no-useless-escape
            'parses escaped characters'
        )

        it('parses line and paragraph separators with a warning', () => {
            const mock = sinon.mock(console)
            mock
                .expects('warn')
                .twice()
                .calledWithMatch('not valid ECMAScript')

            assert.deepStrictEqual(
                JSON5.parse("'\u2028\u2029'"),
                '\u2028\u2029'
            )

            mock.verify()
            mock.restore()

            t.end()
        })
    })

    it('comments', () => {
        assert.deepStrictEqual(
            JSON5.parse('{//comment\n}'),
            {},
            'parses single-line comments'
        )

        assert.deepStrictEqual(
            JSON5.parse('{}//comment'),
            {},
            'parses single-line comments at end of input'
        )

        assert.deepStrictEqual(
            JSON5.parse('{/*comment\n** */}'),
            {},
            'parses multi-line comments'
        )
    })

    it('whitespace', () => {
        assert.deepStrictEqual(
            JSON5.parse('{\t\v\f \u00A0\uFEFF\n\r\u2028\u2029\u2003}'),
            {},
            'parses whitespace'
        )
    })
})

it('parse(text, reviver)', () => {
    assert.deepStrictEqual(
        JSON5.parse('{a:1,b:2}', (k, v) => (k === 'a') ? 'revived' : v),
        {a: 'revived', b: 2},
        'modifies property values'
    )

    assert.deepStrictEqual(
        JSON5.parse('{a:{b:2}}', (k, v) => (k === 'b') ? 'revived' : v),
        {a: {b: 'revived'}},
        'modifies nested object property values'
    )

    assert.deepStrictEqual(
        JSON5.parse('{a:1,b:2}', (k, v) => (k === 'a') ? undefined : v),
        {b: 2},
        'deletes property values'
    )

    assert.deepStrictEqual(
        JSON5.parse('[0,1,2]', (k, v) => (k === '1') ? 'revived' : v),
        [0, 'revived', 2],
        'modifies array values'
    )

    assert.deepStrictEqual(
        JSON5.parse('[0,[1,2,3]]', (k, v) => (k === '2') ? 'revived' : v),
        [0, [1, 2, 'revived']],
        'modifies nested array values'
    )

    assert.deepStrictEqual(
        JSON5.parse('[0,1,2]', (k, v) => (k === '1') ? undefined : v),
        [0, , 2], // eslint-disable-line no-sparse-arrays
        'deletes array values'
    )

    assert.equal(
        JSON5.parse('1', (k, v) => (k === '') ? 'revived' : v),
        'revived',
        'modifies the root value'
    )

    assert.deepStrictEqual(
        JSON5.parse('{a:{b:2}}', function (k, v) { return (k === 'b' && this.b) ? 'revived' : v }),
        {a: {b: 'revived'}},
        'sets `this` to the parent value'
    )

})
