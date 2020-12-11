import { pack } from './pack';
import { validate } from 'uuid';
import { JSON_KEY, FILE_KEY_PREFIX } from './constants';

describe('pack', () => {
  it('json', async () => {
    const user = { name: 'John Doe', age: 30, pets: ['dog', 'cat'] };
    const formData = pack({ ...user });
    const data = JSON.parse(formData.get(JSON_KEY) as string);

    expect(data).toEqual(user);
    expect(formData.has(JSON_KEY)).toBe(true);
    expect(formData instanceof FormData).toBe(true);
  });

  it('file', async () => {
    const image = new File([new Blob()], 'john-doe.png', { type: 'image/png' });
    const formData = pack(image);
    const json = JSON.parse(formData.get(JSON_KEY) as string);

    const uuid = json.split(FILE_KEY_PREFIX)[1];

    expect(validate(uuid)).toBe(true);
    expect(formData instanceof FormData).toBe(true);
    expect((formData.get(json) as File).name).toEqual(image.name);
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
    const json = JSON.parse(formData.get(JSON_KEY) as string);

    expect(formData instanceof FormData).toBe(true);

    expect(json.name).toEqual(user.name);
    expect((formData.get(json.image) as File).name).toEqual(user.image.name);

    expect(json.posts[0].title).toEqual(user.posts[0].title);
    expect((formData.get(json.posts[0].image) as File).name).toEqual(user.posts[0].image.name);

    expect(json.posts[1].title).toEqual(user.posts[1].title);
    expect((formData.get(json.posts[1].image) as File).name).toEqual(user.posts[1].image.name);
  });
});
