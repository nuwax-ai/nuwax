import { Dictionary } from '../models/common.js';
import { ComplexOptions } from '../models/external-table.js';
import TableInternal from './internal-table.js';
export declare const renderTable: (table: TableInternal) => string;
export declare const renderSimpleTable: (rows: Dictionary[], tableOptions?: ComplexOptions) => string;
export declare const printSimpleTable: (rows: Dictionary[], tableOptions?: ComplexOptions) => void;
