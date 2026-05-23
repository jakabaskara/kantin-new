export type TransactionItemSummary = {
    id: number;
    menuItemId: number;
    menuName: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
};

export type TransactionSummary = {
    id: number;
    customerName: string;
    totalAmount: number;
    cashReceivedAmount: number | null;
    changeAmount: number | null;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: number;
    status: number;
    outletId: number;
    userId: number;
    outletName: string | null;
    customerDisplayName: string | null;
    createdAt: string | null;
    items?: TransactionItemSummary[];
};
