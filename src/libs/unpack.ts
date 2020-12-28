import { validate } from 'uuid';
import formidable from 'formidable';
import { JSON_KEY, FILE_KEY_PREFIX } from './constants';

export class File {
  size: number;
  path: string;
  name: string | null;
  type: string | null;
  hash: string | null;
  lastModifiedDate: Date | null;
}

type Files = { [key: string]: File };
type Fields = { [key: string]: string };

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

async function _mapFiles(files: Files, callback: (file: File) => unknown | Promise<unknown>) {
  const result: { [key: string]: unknown } = {};

  for (let key in files) {
    if (files.hasOwnProperty(key)) {
      let file = files[key];

      result[key] = await callback(file);
    }
  }

  return result;
}

export function unpack<T = any>(request: unknown, options?: Options) {
  const form = formidable(_getFormidableOptions(options));

  return new Promise<T>((resolve, reject) => {
    form.parse(request, async (_error: Error, _fields: Fields, _files: Files) => {
      try {
        if (_error) throw _error;

        const json = _fields[JSON_KEY];

        // normal form data
        if (json === undefined) {
          resolve({ fields: _fields, files: _files } as any);
        }

        // map files callback
        type MappedFiles = { [key: string]: unknown };
        let mappedFiles: MappedFiles = _files;

        if (typeof options?.mapFiles === 'function') {
          mappedFiles = await _mapFiles(_files, options.mapFiles);
        }

        // map files to json
        const data = JSON.parse(json, (key, value) => {
          let file: Files[0] | MappedFiles[0];

          if (typeof options?.mapFiles === 'function') {
            file = mappedFiles[value];
          } else {
            file = _files[value];
          }

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

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}
