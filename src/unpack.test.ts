/**
 * @jest-environment jsdom
 */

import { Server } from 'http';
import express, { Express } from 'express';
import bodyParser from 'body-parser';
import supertest from 'supertest';
import formidable from 'formidable';
import { pack } from './pack';
import 'isomorphic-fetch';
import chai from 'chai';
import chaiHttp from 'chai-http';
import puppeteer from 'puppeteer';
import fs from 'fs';
import { validate } from 'uuid';
import { JSON_KEY, FILE_PREFIX } from './constants';

chai.use(chaiHttp);

describe('App', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    app = express();

    // app.use(bodyParser.urlencoded({ extended: false }));
    // app.use(bodyParser.json());

    app.post('/test', (req, res, next) => {
      const form = formidable({ multiples: true });

      form.parse(req, (err, fields, files) => {
        if (err) {
          next(err);
          return;
        }

        console.log({ fields, files });

        const json = fields[JSON_KEY];

        const data = JSON.parse(json, (key, value) => {
          const file = files[value];

          if (file) {
            const uuid = value.split(FILE_PREFIX)[1];

            if (validate(uuid)) {
              return file;
            } else {
              return value;
            }
          }

          return value;
        });

        res.json(data);
      });
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
    const filename = 'john-doe.png';

    const image = new File([new Blob()], filename, { type: 'image/png' });
    const formData = pack(image);
    const json = formData.get(JSON_KEY) as string;

    const data = JSON.parse(json);

    const response = await supertest(app)
      .post('/test')
      .field(JSON_KEY, json)
      .attach(
        data,
        fs.readFileSync(__dirname + '/testdata/image.png'),
        filename
      );

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

    type User = typeof user;

    const formData = pack(user);
    const json = formData.get(JSON_KEY) as string;

    const data: User = JSON.parse(formData.get(JSON_KEY) as string);

    const response = await supertest(app)
      .post('/test')
      .field(JSON_KEY, json)
      .attach(
        (data.image as unknown) as string,
        fs.readFileSync(__dirname + '/testdata/image.png'),
        user.image.name
      )
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
});
