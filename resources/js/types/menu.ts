export type OutletSummary = {
    id: number;
    name: string;
    location: string | null;
    qrisImageUrl: string | null;
    menuItemsCount?: number;
};

export type MenuItemSummary = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    outletId: number;
    outletName: string | null;
    stockQuantity: number;
    imageUrl: string | null;
};

export type CustomerMenuItem = MenuItemSummary;

export type CustomerMenuFilters = {
    search: string;
    outlet: number | null;
};
