import type { File } from './libs/unpack';
import FormidableFile from 'formidable/lib/File';
import { unpack } from './libs/unpack';

const FormFile: File = FormidableFile;

export { unpack, FormFile };
export default { unpack };
