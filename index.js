"use strict"

const { default: ow } = require("ow")

function xor(x, y) {
	return [x[0] ^ y[0], x[1] ^ y[1]]
}

function and(x, y) {
	return [x[0] & y[0], x[1] & y[1]]
}

function shl(x, n) {
	const a = x[0] | 0x0
	const b = x[1] | 0x0

	if (n >= 32) return [(b << (n - 32)), 0x0]

	return [((a << n) | (b >>> (32 - n))), (b << n)]
}

function shr(x, n) {
	const a = x[0] | 0x0
	const b = x[1] | 0x0

	if (n >= 32) return [0x0, (a >>> (n - 32))]

	return [(a >>> n), ((a << (32 - n)) | (b >>> n))]
}

function toWord(input) {
	let i
	const { length } = input
	const output = []

	for (i = 0; i < length; i += 8) {
		output.push([
			((input[i + 0] & 0xFF) << 24) |
            ((input[i + 1] & 0xFF) << 16) |
            ((input[i + 2] & 0xFF) << 8) |
            ((input[i + 3] & 0xFF) << 0),
			((input[i + 4] & 0xFF) << 24) |
            ((input[i + 5] & 0xFF) << 16) |
            ((input[i + 6] & 0xFF) << 8) |
            ((input[i + 7] & 0xFF) << 0),
		])
	}

	return output
}

function fromWord(input) {
	let i
	const { length } = input
	const output = []

	for (i = 0; i < length; i += 1) {
		output.push((input[i][0] >> 24) & 0xFF)
		output.push((input[i][0] >> 16) & 0xFF)
		output.push((input[i][0] >> 8) & 0xFF)
		output.push((input[i][0] >> 0) & 0xFF)
		output.push((input[i][1] >> 24) & 0xFF)
		output.push((input[i][1] >> 16) & 0xFF)
		output.push((input[i][1] >> 8) & 0xFF)
		output.push((input[i][1] >> 0) & 0xFF)
	}

	return output
}

function crop(size, hash, right) {
	const length = Math.floor((size + 7) / 8)
	const remain = size % 8

	if (right) hash = hash.slice(hash.length - length)
	else hash = hash.slice(0, length)

	if (remain > 0) hash[length - 1] &= (0xFF << (8 - remain)) & 0xFF

	return hash
}

function hash(size, data, key, levels) {
	const b = 512
	const c = 128
	const n = 89
	const d = size
	let M = data
	let K = key.slice(0, 64)
	const k = K.length

	while (K.length < 64) K.push(0x00)

	K = toWord(K)

	const r = Math.max((k ? 80 : 0), (40 + (d / 4)))
	const L = levels
	let ell = 0
	const S0 = [0x01234567, 0x89ABCDEF]
	const Sm = [0x7311C281, 0x2425CFA0]
	const Q = [
		[0x7311C281, 0x2425CFA0], [0x64322864, 0x34AAC8E7], [0xB60450E9, 0xEF68B7C1],
		[0xE8FB2390, 0x8D9F06F1], [0xDD2E76CB, 0xA691E5BF], [0x0CD0D63B, 0x2C30BC41],
		[0x1F8CCF68, 0x23058F8A], [0x54E5ED5B, 0x88E3775D], [0x4AD12AAE, 0x0A6D6031],
		[0x3E7F16BB, 0x88222E0D], [0x8AF8671D, 0x3FB50C2C], [0x995AD117, 0x8BD25C31],
		[0xC878C1DD, 0x04C4B633], [0x3B72066C, 0x7A1552AC], [0x0D6F3522, 0x631EFFCB],
	]
	const t = [17, 18, 21, 31, 67, 89]
	const rs = [10, 5, 13, 10, 11, 12, 2, 7, 14, 15, 7, 13, 11, 7, 6, 12]
	const ls = [11, 24, 9, 16, 15, 9, 27, 15, 6, 2, 29, 8, 15, 5, 31, 9]

	function f(N) {
		let i
		let j
		let s
		let x
		let S = [...S0]
		const A = [...N]

		for (j = 0, i = n; j < r; j += 1, i += 16) {
			for (s = 0; s < 16; s += 1) {
				x = [...S]
				x = xor(x, A[i + s - t[5]])
				x = xor(x, A[i + s - t[0]])
				x = xor(x, and(A[i + s - t[1]], A[i + s - t[2]]))
				x = xor(x, and(A[i + s - t[3]], A[i + s - t[4]]))
				x = xor(x, shr(x, rs[s]))
				A[i + s] = xor(x, shl(x, ls[s]))
			}

			S = xor(xor(shl(S, 1), shr(S, (64 - 1))), and(S, Sm))
		}

		return A.slice(A.length - 16)
	}

	function mid(B, C, i, p, z) { // eslint-disable-line max-params
		const U = [
			((ell & 0xFF) << 24) | (((i / 2) ** 32) & 0xFFFFFF),
			i & 0xFFFFFFFF,
		]
		const V = [
			((r & 0xFFF) << 16) | ((L & 0xFF) << 8) | ((z & 0xF) << 4) | ((p & 0xF000) >> 12),
			(((p & 0xFFF) << 20) | ((k & 0xFF) << 12) | ((d & 0xFFF))),
		]

		return f([...Q, ...K, U, V, ...C, ...B])
	}

	function par(M) {
		let i
		let l
		let p
		const z = (M.length > b ? 0 : 1)
		let P = 0
		const B = []
		let C = []

		while ((M.length < 1) || ((M.length % b) > 0)) {
			M.push(0x00)
			P += 8
		}

		M = toWord(M)

		while (M.length > 0) {
			B.push(M.slice(0, (b / 8)))
			M = M.slice(b / 8)
		}

		for (i = 0, p = 0, l = B.length; i < l; i += 1, p = 0) {
			p = (i === (B.length - 1)) ? P : 0
			C = [...C, ...mid(B[i], [], i, p, z)]
		}

		return fromWord(C)
	}

	function seq(M) {
		let i
		let l
		let p
		let z
		let P = 0
		const B = []
		let C = [
			[0x0, 0x0], [0x0, 0x0], [0x0, 0x0], [0x0, 0x0],
			[0x0, 0x0], [0x0, 0x0], [0x0, 0x0], [0x0, 0x0],
			[0x0, 0x0], [0x0, 0x0], [0x0, 0x0], [0x0, 0x0],
			[0x0, 0x0], [0x0, 0x0], [0x0, 0x0], [0x0, 0x0],
		]

		while ((M.length < 1) || ((M.length % (b - c)) > 0)) {
			M.push(0x00)
			P += 8
		}

		M = toWord(M)

		while (M.length > 0) {
			B.push(M.slice(0, ((b - c) / 8)))
			M = M.slice((b - c) / 8)
		}

		for (i = 0, p = 0, l = B.length; i < l; i += 1, p = 0) {
			p = (i === (B.length - 1)) ? P : 0
			z = (i === (B.length - 1)) ? 1 : 0
			C = mid(B[i], C, i, p, z)
		}

		return fromWord(C)
	}

	do {
		ell += 1
		M = ell > L ? seq(M) : par(M)
	} while (M.length !== c)

	return crop(d, M, true)
}

function bytes(input) {
	const output = []
	let i
	let ch

	for (i = 0; i < input.length; i++) {
		ch = input.charCodeAt(i)
		if (ch <= 0x7F) {
			output.push(ch)
		} else if (ch <= 0x7FF) {
			output.push((ch >> 6) | 0xC0)
			output.push((ch & 0x3F) | 0x80)
		} else if (ch <= 0xFFFF) {
			output.push((ch >> 12) | 0xE0)
			output.push(((ch >> 6) & 0x3F) | 0x80)
			output.push((ch & 0x3F) | 0x80)
		} else {
			output.push((ch >> 18) | 0xF0)
			output.push(((ch >> 12) & 0x3F) | 0x80)
			output.push(((ch >> 6) & 0x3F) | 0x80)
			output.push((ch & 0x3F) | 0x80)
		}
	}

	return output
}

function preHash(data, size, key, levels) {
	data = bytes(data)
	key = bytes(key)

	if (size <= 0) size = 1
	else if (size > 512) size = 512

	return hash(size, data, key, levels)
}

module.exports = (input, { size = 256, key = "", levels = 64 } = {}) => {
	ow(input, ow.string)
	ow(size, ow.number)
	ow(key, ow.string)
	ow(levels, ow.number)

	const hash = preHash(input, size, key, levels)

	return hash.map((v) => v.toString(16).padStart(2, "0")).join("")
}
