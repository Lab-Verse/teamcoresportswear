import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { StorageService } from './storage.service';
describe('Local production image storage', () => {
  let directory: string;
  let service: StorageService;
  const image = {
    originalname: '../../unsafe.html',
    mimetype: 'image/png',
    size: 8,
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  } as Express.Multer.File;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'teamcore-storage-'));
    service = new StorageService(
      new ConfigService({
        STORAGE_DRIVER: 'local',
        UPLOAD_DIR: directory,
        UPLOAD_PUBLIC_URL: 'https://teamcoresportswear.com/uploads',
      }),
    );
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });
  it('uses generated filenames, stores bytes and deletes only its own files', async () => {
    const url = await service.upload(image, 'products');
    expect(url).toMatch(
      /^https:\/\/teamcoresportswear.com\/uploads\/products\/[a-f0-9-]+\.png$/,
    );
    const file = join(directory, url.split('/uploads/')[1]);
    expect(await readFile(file)).toEqual(image.buffer);
    await service.delete(url.replace('teamcoresportswear.com', 'evil.example'));
    expect((await stat(file)).isFile()).toBe(true);
    await service.delete(url);
    await expect(stat(file)).rejects.toThrow();
  });
  it('rejects traversal, SVG and false image MIME types', async () => {
    await expect(service.upload(image, '../outside')).rejects.toThrow();
    await expect(
      service.upload({ ...image, mimetype: 'image/svg+xml' }, 'products'),
    ).rejects.toThrow();
    await expect(
      service.upload({ ...image, buffer: Buffer.from('<script>') }, 'products'),
    ).rejects.toThrow();
  });
});
