# Fison - Post/Upload `JSON` and `Files` in a Single Request.

## Installation

### For Browser

```
npm install --save fison
```

```ts
import fison from 'fison/browser';
```

```html
<script type="module">
  import fison from 'https://cdn.skypack.dev/fison@0/browser';
</script>
```

### For Node

```
npm install --save fison
```

```ts
const fison = require('fison/node'); // CommonJS

import fison from 'fison/node'; // TypeScript, Babel
```

## Usage

### Packing Data

```ts
function pack(data: any): FormData;
```

#### **Example**

```ts
import fison from 'fison/browser';

const data = {
  name: 'John Doe',
  image: new File([new Blob()], 'john-doe.png', { type: 'image/png' }),
  posts: [
    {
      title: 'Hello World!',
      image: new File([new Blob()], 'hello-world.png', {
        type: 'image/png',
      }),
    },
    {
      title: 'Hello Jane!',
      image: new File([new Blob()], 'hello-jane.png', {
        type: 'image/png',
      }),
    },
  ],
};

const formData = fison.pack(data);

fetch('/api/users', { method: 'POST', body: formData })
  .then((res) => res.json())
  .then((data) => {
    console.log(data);

    /*{
      name: 'John Doe',
      image: {
        size: 3747,
        path: '/var/folders/mh/y9lv30k50yq_l96wk2xczsfm0000gn/T/upload_23b47c98c13c6ac09929a93eb8fc6d50',
        name: 'john-doe.png',
        type: 'image/png',
        mtime: '2020-12-11T04:05:10.662Z',
      },
      posts: [
        {
          title: 'Hello World!',
          image: {
            size: 3747,
            path: '/var/folders/mh/y9lv30k50yq_l96wk2xczsfm0000gn/T/upload_e798c84d7975d69ce9a6f60ac3a6cf98',
            name: 'hello-world.png',
            type: 'image/png',
            mtime: '2020-12-11T04:05:10.663Z',
          },
        },
        {
          title: 'Hello Jane!',
          image: {
            size: 3747,
            path: '/var/folders/mh/y9lv30k50yq_l96wk2xczsfm0000gn/T/upload_a867ff9115a17161ef46cbe334292b3c',
            name: 'hello-jane.png',
            type: 'image/png',
            mtime: '2020-12-11T04:05:10.663Z',
          },
        },
      ],
    };*/
  });
```

### Unpacking Data

```ts
interface Options {
  hash?: boolean;
  encoding?: string;
  uploadDir?: string;
  maxFileSize?: number;
  maxJsonSize?: number;
  keepExtensions?: boolean;
  mapFiles?: (file: File) => unknown | Promise<unknown>;
}

function unpack<T>(request: unknown, options?: Options): Promise<T>;
```

#### **Example with default options**

```ts
const express = require('express');
const fison = require('fison/node');

const app = express();

app.post('/api/users', async (req, res, next) => {
  try {
    const data = await fison.unpack(req);

    console.log(data);

    /*{
      name: 'John Doe',
      image: {
        size: 3747,
        path: '/var/folders/mh/y9lv30k50yq_l96wk2xczsfm0000gn/T/upload_23b47c98c13c6ac09929a93eb8fc6d50',
        name: 'john-doe.png',
        type: 'image/png',
        mtime: '2020-12-11T04:05:10.662Z',
      },
      posts: [
        {
          title: 'Hello World!',
          image: {
            size: 3747,
            path: '/var/folders/mh/y9lv30k50yq_l96wk2xczsfm0000gn/T/upload_e798c84d7975d69ce9a6f60ac3a6cf98',
            name: 'hello-world.png',
            type: 'image/png',
            mtime: '2020-12-11T04:05:10.663Z',
          },
        },
        {
          title: 'Hello Jane!',
          image: {
            size: 3747,
            path: '/var/folders/mh/y9lv30k50yq_l96wk2xczsfm0000gn/T/upload_a867ff9115a17161ef46cbe334292b3c',
            name: 'hello-jane.png',
            type: 'image/png',
            mtime: '2020-12-11T04:05:10.663Z',
          },
        },
      ],
    };*/

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000 ...');
});
```

#### **Example with `mapFiles` option**

You can use the `mapFiles` function to upload your files to **Amazon S3**, **Azure Storage**, **Google Cloud Storage**, ... and return their URLs to the `JSON` object.

```ts
const express = require('express');
const fison = require('fison/node');

const app = express();

app.post('/api/users', async (req, res, next) => {
  try {
    const data = await fison.unpack(req, {
      mapFiles: async (file) => {
        // your upload code here

        return `https://fison.s3.amazonaws.com/${file.name}`;
      },
    });

    console.log(data);

    /*{
      name: 'John Doe',
      image: 'https://fison.s3.amazonaws.com/john-doe.png',
      posts: [
        {
          title: 'Hello World!',
          image: 'https://fison.s3.amazonaws.com/hello-world.png',
        },
        {
          title: 'Hello Jane!',
          image: 'https://fison.s3.amazonaws.com/hello-jane.png',
        },
      ],
    };*/

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000 ...');
});
```
