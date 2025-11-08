/**
 * ProductOption 데이터 모델 (영속성 계층)
 */
export class ProductOptionModel {
  id: number;
  productId: number;
  optionName: string;
  optionDescription: string | null;
  priceAmount: number;
  stockQuantity: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string | null;

  constructor(
    id: number,
    productId: number,
    optionName: string,
    optionDescription: string | null,
    priceAmount: number,
    stockQuantity: number,
    isAvailable: boolean,
    createdAt: string,
    updatedAt: string | null,
  ) {
    this.id = id;
    this.productId = productId;
    this.optionName = optionName;
    this.optionDescription = optionDescription;
    this.priceAmount = priceAmount;
    this.stockQuantity = stockQuantity;
    this.isAvailable = isAvailable;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
