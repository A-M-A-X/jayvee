import { IOType } from '@jvalue/language-server';

export interface IOTypeImplementation<T extends IOType = IOType> {
  ioType: T;
}
