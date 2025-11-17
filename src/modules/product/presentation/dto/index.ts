// Export all from original file for backward compatibility
export * from './product.dto';

// Export Request DTOs
export { GetProductListRequest } from './requests/get-product-list.request';
export { CheckStockRequest } from './requests/check-stock.request';
export { DeductStockRequest } from './requests/deduct-stock.request';
export { RestoreStockRequest } from './requests/restore-stock.request';

// Export Response DTOs and their common DTOs
export {
  GetProductListResponse,
  ProductListItem,
  CategoryInfo,
} from './responses/get-product-list.response';

export {
  GetProductDetailResponse,
  ProductOption,
} from './responses/get-product-detail.response';

export { GetProductOptionsResponse } from './responses/get-product-options.response';

export { GetProductOptionDetailResponse } from './responses/get-product-option-detail.response';

export { CheckStockResponse } from './responses/check-stock.response';

export { DeductStockResponse } from './responses/deduct-stock.response';

export { RestoreStockResponse } from './responses/restore-stock.response';

export {
  GetPopularProductsResponse,
  PopularProduct,
} from './responses/get-popular-products.response';

export {
  GetCategoriesResponse,
  Category,
} from './responses/get-categories.response';

export { GetCategoryProductCountResponse } from './responses/get-category-product-count.response';
