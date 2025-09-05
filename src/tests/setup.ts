import { beforeAll, afterAll } from "@jest/globals";

beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
  process.env.JWT_SECRET = "test-secret";
});

afterAll(async () => {
  // Cleanup test environment
});
