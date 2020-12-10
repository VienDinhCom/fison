import { validate } from 'uuid';
import formidable from 'formidable';
import { JSON_KEY, FILE_PREFIX } from './constants';

interface File {
  size: number;
  path: string;
  name: string;
  type: string;
  lastModifiedDate?: Date;
  hash?: string;

  toJSON(): Object;
}

interface Options {
  encoding?: string;
  hash?: boolean;

  uploadDir?: string;
  keepExtensions?: boolean;

  multiples?: boolean;
  maxFileSize?: number;

  // maxFields?: number;
  // maxFieldsSize?: number;
}

export function unpack<T>(
  request: any,
  options?: Options,
  map?: (file: File) => unknown | Promise<unknown>
) {
  const form = formidable({
    ...(typeof options === 'object' ? options : {}),
  });

  return new Promise<T>((resolve, reject) => {
    form.parse(request, async (_error: any, _fields: any, _files: any) => {
      try {
        if (_error) throw _error;

        let files = _files;
        const json = _fields[JSON_KEY];

        if (typeof map === 'function') {
          files = await mapFiles(_files, map);
        }

        const data = JSON.parse(json, (key, value) => {
          const file = files[value];

          if (file !== undefined) {
            const uuid = value.split(FILE_PREFIX)[1];

            if (validate(uuid)) {
              return file;
            } else {
              return value;
            }
          }

          return value;
        });

        return resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function mapFiles(
  files: File[],
  callback: (file: File) => unknown | Promise<unknown>
) {
  const result: { [key: string]: unknown } = {};

  for (let key in files) {
    if (files.hasOwnProperty(key)) {
      let file = files[key];

      result[key] = await callback(file);
    }
  }

  return result;
}
