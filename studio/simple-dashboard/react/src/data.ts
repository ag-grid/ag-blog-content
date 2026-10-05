import type { AgDataSourcesDefinition } from 'ag-studio';

import purchaseOrders from './data/purchase-orders.json';
// import shipments from './data/shipments.json';
import suppliers from './data/suppliers.json';
import materials from './data/materials.json';

// AG Studio works with arrays of plain objects. Each entry in `sources`
// becomes a data source (a table). Fields are inferred from the data unless
// you declare them explicitly via a `fields` array.
//
// This is a small "office supplies" product table — enough columns of
// different types (text / category / number) to build interesting widgets.
export const data: AgDataSourcesDefinition = {
    sources: [
        {
            id: 'purchase-orders',
            name: 'Purchase Orders',
            data: purchaseOrders,
        },
        {
            id: 'suppliers',
            name: 'Suppliers',
            data: suppliers,
        },
        {
            id: 'materials',
            name: 'Materials',
            data: materials,
        }
    ],
    relationships: [
        {
            id: 'purchase-orders-to-suppliers',
            source: {tableId: 'purchase-orders', fieldId: 'supplierId'},
            target: {tableId: 'suppliers', fieldId: 'supplierId'},
            type: 'many-to-one'
        },
        {
            id: 'materials-to-purchase-orders',
            source: {tableId: 'materials', fieldId: 'materialId'},
            target: {tableId: 'purchase-orders', fieldId: 'materialId'},
            type: 'one-to-many'
        }
    ]
};
