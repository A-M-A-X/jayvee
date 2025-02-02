// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  EvaluationContext,
  RuntimeParameterProvider,
  TransformOutputAssignment,
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

import { validateTransformOutputAssignment } from './transform-output-assigment';

describe('Validation of TransformOutputAssignment', () => {
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

  async function parseAndValidateTransformOutputAssignment(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const transformOutputAssignment =
      locator.getAstNode<TransformOutputAssignment>(
        document.parseResult.value,
        'transforms@0/body/outputAssignments@0',
      ) as TransformOutputAssignment;

    validateTransformOutputAssignment(
      transformOutputAssignment,
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

  it('should have no error on valid transform output assignment', async () => {
    const text = readJvTestAsset(
      'transform-output-assignment/valid-transform-output-assignment.jv',
    );

    await parseAndValidateTransformOutputAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on invalid type', async () => {
    const text = readJvTestAsset(
      'transform-output-assignment/invalid-invalid-type.jv',
    );

    await parseAndValidateTransformOutputAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The value needs to be of type integer but is of type decimal`,
      expect.any(Object),
    );
  });

  it('should diagnose error on output port used in assignment', async () => {
    const text = readJvTestAsset(
      'transform-output-assignment/invalid-output-port-in-assignment.jv',
    );

    await parseAndValidateTransformOutputAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Output ports are not allowed in this expression`,
      expect.any(Object),
    );
  });
});
