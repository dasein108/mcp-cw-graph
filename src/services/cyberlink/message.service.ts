import { Cyberlink, CyberlinkValue } from './types';
import { removeEmptyValues, stringifyValue } from './utils';

/**
 * Service class for creating transaction messages for the CW-Social smart contract
 */
export class CyberlinkMessageService {
  /**
   * Processes a cyberlink by stringifying its value
   * @param cyberlink Cyberlink to process
   * @returns Processed cyberlink
   */
  private processCyberlink(cyberlink: Cyberlink): Cyberlink {
    return {
      ...cyberlink,
      value: stringifyValue(cyberlink.value),
    };
  }

  /**
   * Turn string value into CyberlinkValue object
   * @param value CyberlinkValue or string
   * @returns CyberlinkValue
   */
  private parseCyberlinkValue(value: string | CyberlinkValue): CyberlinkValue {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      } catch (e) {
        // If parsing fails, treat as plain content
      }
      return { content: String(value) };
    }
    return value;
  }

  createCyberlinkMsg(cyberlink: Cyberlink): any {
    return {
      create_cyberlink: {
        cyberlink: this.processCyberlink(removeEmptyValues(cyberlink)),
      },
    };
  }

  createCyberlink2Msg(args: {
    node_type: string;
    node_value?: string;
    link_type: string;
    link_value?: string;
    link_from_existing_gid?: string;
    link_to_existing_gid?: string;
  }): any {
    return {
      create_cyberlink2: removeEmptyValues({
        ...args,
        node_value: args.node_value ? stringifyValue(args.node_value) : undefined,
        link_value: args.link_value ? stringifyValue(args.link_value) : undefined,
      }),
    };
  }

  createNamedCyberlinkMsg(name: string, cyberlink: Cyberlink): any {
    return {
      create_named_cyberlink: {
        name,
        cyberlink: this.processCyberlink(cyberlink),
      },
    };
  }

  createCyberlinksMsg(cyberlinks: Cyberlink[]): any {
    return {
      create_cyberlinks: {
        cyberlinks: cyberlinks.map((c) => this.processCyberlink(c)),
      },
    };
  }

  updateCyberlinkMsg(gid: number, cyberlink: Cyberlink): any {
    return {
      update_cyberlink: {
        gid,
        cyberlink: this.processCyberlink(cyberlink),
      },
    };
  }

  deleteCyberlinkMsg(gid: number): any {
    return { delete_cyberlink: { gid } };
  }

  updateAdminsMsg(newAdmins: string[]): any {
    return {
      update_admins: {
        new_admins: newAdmins,
      },
    };
  }

  updateExecutorsMsg(newExecutors: string[]): any {
    return {
      update_executors: {
        new_executors: newExecutors,
      },
    };
  }
}
