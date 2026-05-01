import { BaseAdapter } from './base';

export class GenericAdapter extends BaseAdapter {
  name = '通用适配器';

  matches(_url: string): boolean {
    return true;
  }
}
