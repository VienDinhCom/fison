import { validate } from 'uuid';
import formidable from 'formidable';
import { JSON_KEY, FILE_KEY_PREFIX } from './constants';

interface File {
  size: number;
  path: string;
  name: string;
  type: string;
  hash?: string;
  lastModifiedDate?: Date;
  toJSON(): Function;
}

interface Options {
  hash?: boolean;
  encoding?: string;
  uploadDir?: string;
  keepExtensions?: boolean;

  maxFileSize?: number;
  maxJsonSize?: number;

  mapFiles?: (file: File) => unknown | Promise<unknown>;
}

interface FormidableOptions extends Omit<Options, 'maxJsonSize' | 'mapFiles'> {
  maxFieldsSize?: number;
}

function _getFormidableOptions(options?: Options) {
  const formidableOptions: FormidableOptions = {};

  if (options?.encoding !== undefined) {
    formidableOptions.encoding = options?.encoding;
  }

  if (options?.hash !== undefined) {
    formidableOptions.hash = options?.hash;
  }

  if (options?.uploadDir !== undefined) {
    formidableOptions.uploadDir = options?.uploadDir;
  }

  if (options?.keepExtensions !== undefined) {
    formidableOptions.keepExtensions = options?.keepExtensions;
  }

  if (options?.maxFileSize !== undefined) {
    formidableOptions.maxFileSize = options?.maxFileSize;
  }

  if (options?.maxJsonSize !== undefined) {
    formidableOptions.maxFieldsSize = options?.maxJsonSize;
  }

  return formidableOptions;
}

async function _mapFiles(
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

export function unpack<T>(request: any, options?: Options) {
  const form = formidable(_getFormidableOptions(options));

  return new Promise<T>((resolve, reject) => {
    form.parse(request, async (_error: any, _fields: any, _files: any) => {
      try {
        if (_error) throw _error;

        let files = _files;
        const json = _fields[JSON_KEY];

        if (typeof options?.mapFiles === 'function') {
          files = await _mapFiles(_files, options.mapFiles);
        }

        const data = JSON.parse(json, (key, value) => {
          const file = files[value];

          if (file !== undefined) {
            const uuid = value.split(FILE_KEY_PREFIX)[1];

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
