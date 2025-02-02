// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BinaryFile,
  BlockExecutorClass,
  ExecutionContext,
  FileSystem,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType, PrimitiveValuetypes } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class FilePickerExecutor extends AbstractBlockExecutor<
  IOType.FILE_SYSTEM,
  IOType.FILE
> {
  public static readonly type = 'FilePicker';

  constructor() {
    super(IOType.FILE_SYSTEM, IOType.FILE);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async doExecute(
    fileSystem: FileSystem,
    context: ExecutionContext,
  ): Promise<R.Result<BinaryFile | null>> {
    const path = context.getPropertyValue('path', PrimitiveValuetypes.Text);
    const file = fileSystem.getFile(path);
    assert(file instanceof BinaryFile);
    return R.ok(file);
  }
}
