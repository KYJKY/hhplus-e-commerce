/**
 * Product 데이터 모델 (영속성 계층)
 */
export class ProductModel {
  id: number;
  productName: string;
  productDescription: string | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  viewCount: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;

  constructor(
    id: number,
    productName: string,
    productDescription: string | null,
    thumbnailUrl: string | null,
    isActive: boolean,
    viewCount: number,
    deletedAt: string | null,
    createdAt: string,
    updatedAt: string | null,
  ) {
    this.id = id;
    this.productName = productName;
    this.productDescription = productDescription;
    this.thumbnailUrl = thumbnailUrl;
    this.isActive = isActive;
    this.viewCount = viewCount;
    this.deletedAt = deletedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
