# MD6 Hash [![Travis CI Build Status](https://img.shields.io/travis/com/Richienb/md6-hash/master.svg?style=for-the-badge)](https://travis-ci.com/Richienb/md6-hash)

Create an MD6 hash of a string.

[![NPM Badge](https://nodei.co/npm/md6-hash.png)](https://npmjs.com/package/md6-hash)

## Install

```sh
npm install md6-hash
```

## Usage

```js
const md6 = require("md6-hash");

md6("a");
//=> '2b0a697a081c21269514640aab4d74ffafeb3c0212df68ce92922087c69b0a77'
```

## API

### md6Hash(input, options?)

#### input

Type: `string`

The string to hash.

#### options

Type: `object`

##### size

Type: `number`\
Default: `256`

Byte size of the raw hash.

##### key

Type: `string`\
Default: `""`

The hash seed.

##### levels

Type: `number`\
Default: `64`

Hashing levels.
