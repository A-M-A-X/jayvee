import { strict as assert } from 'assert';

import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Sheet, getCellIndex, isSemanticCell } from '@jayvee/language-server';

import {
  clone,
  isInBounds,
  resolveRelativeIndexes,
  writeCell,
} from './sheet-util';

export class CellWriterExecutor extends BlockExecutor<Sheet, Sheet> {
  constructor() {
    super('CellWriter');
  }

  override execute(inputSheet: Sheet): Promise<R.Result<Sheet>> {
    const relativeCell = this.getCellRangeAttributeValue('at');
    const content = this.getStringAttributeValue('write');

    assert(isSemanticCell(relativeCell));

    const absoluteCell = resolveRelativeIndexes(inputSheet, relativeCell);
    if (!isInBounds(inputSheet, absoluteCell)) {
      return Promise.resolve(
        R.err({
          message: 'The specified cell does not exist in the sheet',
          diagnostic: { node: absoluteCell.astNode },
        }),
      );
    }

    this.logger.logDebug(
      `Writing "${content}" at cell ${getCellIndex(absoluteCell).toString()}`,
    );

    const resultingSheet = clone(inputSheet);
    writeCell(resultingSheet, absoluteCell, content);

    return Promise.resolve(R.ok(resultingSheet));
  }
}
