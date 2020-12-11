import fs from 'fs';
import supertest from 'supertest';
import express, { Express } from 'express';

import { pack } from './pack';
import { unpack } from './unpack';
import { JSON_KEY } from './constants';

describe('App', () => {
  let app: Express;

  beforeAll(async () => {
    app = express();

    app.post('/test', async (req, res, next) => {
      try {
        const data = await unpack(req);

        res.status(200).json(data);
      } catch (error) {
        next(error);
      }
    });

    app.post('/test/mapfiles', async (req, res, next) => {
      try {
        const data = await unpack(req, {
          mapFiles: (file) => {
            return {
              name: file.name,
              type: file.type,
            };
          },
        });

        res.status(200).json(data);
      } catch (error) {
        next(error);
      }
    });
  });

  it('json', async () => {
    const user = { name: 'John Doe', age: 30, pets: ['dog', 'cat'] };
    const formData = pack({ ...user });

    const json = formData.get(JSON_KEY) as string;

    const response = await supertest(app).post('/test').field(JSON_KEY, json);

    const data = JSON.parse(json);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual(data);
  });

  it('file', async () => {
    const image = new File([new Blob()], 'john-doe.png', { type: 'image/png' });
    const formData = pack(image);
    const json = formData.get(JSON_KEY) as string;

    const data = JSON.parse(json);

    const response = await supertest(app)
      .post('/test')
      .field(JSON_KEY, json)
      .attach(data, fs.readFileSync(__dirname + '/testdata/image.png'), image.name);

    expect(response.status).toEqual(200);
    expect(response.body.name).toEqual(image.name);
  });

  it('mix', async () => {
    const user = {
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

    const formData = pack(user);
    const json = formData.get(JSON_KEY) as string;
    const data: typeof user = JSON.parse(json);

    const response = await supertest(app)
      .post('/test')
      .field(JSON_KEY, json)
      .attach((data.image as unknown) as string, fs.readFileSync(__dirname + '/testdata/image.png'), user.image.name)
      .attach(
        (data.posts[0].image as unknown) as string,
        fs.readFileSync(__dirname + '/testdata/image.png'),
        user.posts[0].image.name
      )
      .attach(
        (data.posts[1].image as unknown) as string,
        fs.readFileSync(__dirname + '/testdata/image.png'),
        user.posts[1].image.name
      );

    expect(response.body.name).toEqual(user.name);
    expect(response.body.image.name).toEqual(user.image.name);

    expect(response.body.posts[0].title).toEqual(user.posts[0].title);
    expect(response.body.posts[0].image.name).toEqual(user.posts[0].image.name);

    expect(response.body.posts[1].title).toEqual(user.posts[1].title);
    expect(response.body.posts[1].image.name).toEqual(user.posts[1].image.name);
  });

  it('map files', async () => {
    const image = new File([new Blob()], 'john-doe.png', { type: 'image/png' });
    const formData = pack(image);
    const json = formData.get(JSON_KEY) as string;

    const data = JSON.parse(json);

    const response = await supertest(app)
      .post('/test/mapfiles')
      .field(JSON_KEY, json)
      .attach(data, fs.readFileSync(__dirname + '/testdata/image.png'), image.name);

    expect(response.status).toEqual(200);
    expect({
      name: response.body.name,
      type: response.body.type,
    }).toEqual({
      name: image.name,
      type: image.type,
    });
  });
});
