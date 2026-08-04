import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, getProductById, createProduct, normalizeProduct } from './products';
import api from './axios';

// Mock the axios instance so we can test the service layer without real network calls.
vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('products service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products successfully', async () => {
    // Arrange
    api.get.mockResolvedValue({ data: { items: [{ id: 1, name: 'Ring' }] } });

    // Act
    const result = await getProducts();

    // Assert
    expect(api.get).toHaveBeenCalledWith('/products');
    expect(result.items[0].name).toBe('Ring');
  });

  it('fetches one product by id', async () => {
    // Arrange
    api.get.mockResolvedValue({ data: { id: 7, name: 'Necklace' } });

    // Act
    const result = await getProductById(7);

    // Assert
    expect(api.get).toHaveBeenCalledWith('/products/7');
    expect(result.name).toBe('Necklace');
  });

  it('creates a product with the posted payload', async () => {
    // Arrange
    const payload = { title: 'Bracelet' };
    api.post.mockResolvedValue({ data: { success: true } });

    // Act
    const result = await createProduct(payload);

    // Assert
    expect(api.post).toHaveBeenCalledWith('/products', payload);
    expect(result.success).toBe(true);
  });

  it('normalizes a product record into the frontend shape', () => {
    // Arrange
    const rawProduct = { productId: 'abc', title: 'Diamond Ring', msrp: 1200 };

    // Act
    const normalized = normalizeProduct(rawProduct);

    // Assert
    expect(normalized.id).toBe('abc');
    expect(normalized.name).toBe('Diamond Ring');
    expect(normalized.price).toBe(1200);
  });
});
