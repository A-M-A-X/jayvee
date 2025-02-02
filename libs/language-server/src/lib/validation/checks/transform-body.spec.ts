// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  EvaluationContext,
  RuntimeParameterProvider,
  TransformBody,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';
import { TestLangExtension } from '../../../test/extension';

import { validateTransformBody } from './transform-body';

describe('Validation of TransformBody', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateTransformBody(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const transformBody = locator.getAstNode<TransformBody>(
      document.parseResult.value,
      'transforms@0/body',
    ) as TransformBody;

    validateTransformBody(
      transformBody,
      new ValidationContext(validationAcceptorMock),
      new EvaluationContext(new RuntimeParameterProvider()),
    );
  }

  beforeAll(() => {
    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should have no error on valid transform body', async () => {
    const text = readJvTestAsset('transform-body/valid-transform-body.jv');

    await parseAndValidateTransformBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on duplicate port names', async () => {
    const text = readJvTestAsset('transform-body/invalid-duplicate-ports.jv');

    await parseAndValidateTransformBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The transform port name "input" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing output assignment', async () => {
    const text = readJvTestAsset(
      'transform-body/invalid-missing-output-assignment.jv',
    );

    await parseAndValidateTransformBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `An output assignment is required for this port`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'warning',
      `This input port is never used`,
      expect.any(Object),
    );
  });

  it('should diagnose error on multiple output assignments', async () => {
    const text = readJvTestAsset(
      'transform-body/invalid-multiple-output-assignments.jv',
    );

    await parseAndValidateTransformBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `At most one assignment per output port`,
      expect.any(Object),
    );
  });

  it('should diagnose error on multiple output ports', async () => {
    const text = readJvTestAsset(
      'transform-body/invalid-multiple-output-ports.jv',
    );

    await parseAndValidateTransformBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `More than one output port is defined`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing output ports', async () => {
    const text = readJvTestAsset(
      'transform-body/invalid-missing-output-port.jv',
    );

    await parseAndValidateTransformBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `There has to be a single output port`,
      expect.any(Object),
    );
  });

  it('should not diagnose on multiple input ports', async () => {
    const text = readJvTestAsset(
      'transform-body/valid-multiple-input-ports.jv',
    );

    await parseAndValidateTransformBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'warning',
      `This input port is never used`,
      expect.any(Object),
    );
  });

  it('should not diagnose on missing input ports', async () => {
    const text = readJvTestAsset('transform-body/valid-missing-input-port.jv');

    await parseAndValidateTransformBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
