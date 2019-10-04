import zipfile
import tarfile


class ArchiveStream():
  def __init__(self, handler):
    self.handler = handler
    self.position = 0

  def write(self, data):
    self.position += len(data)
    self.handler.write(data)
    del data

  def tell(self):
    return self.position

  def flush(self):
    self.handler.flush()


def make_archive_writer(handler, archive_format="zip"):
  fileobj = ArchiveStream(handler)

  if archive_format == "zip":
    archive_file = zipfile.ZipFile(fileobj, mode='w')
    archive_file.add = archive_file.write
  elif archive_format == "tgz":
    archive_file = tarfile.open(fileobj=fileobj, mode='w|gz')
  elif archive_format == "tbz":
    archive_file = tarfile.open(fileobj=fileobj, mode='w|bz2')
  elif archive_format == "txz":
    archive_file = tarfile.open(fileobj=fileobj, mode='w|xz')
  else:
    raise ValueError("'{}' is not a valid archive format.".format(archive_format))
  return archive_file
