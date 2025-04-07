import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import {
  mockSupabaseClient,
  mockDrizzleClient,
  mockPool,
  mockAuthUser,
  mockCompany,
  mockCompanyUser,
  mockDataSubject,
  mockLegalPolicy,
  mockConsent,
  mockDataType,
  mockConsentDataType,
  mockAuditLog,
  setupSupabaseMocks,
  expectSupabaseQuery,
  expectDrizzleQuery,
  createRelatedTestData,
} from './__utils__/database.mock';

describe('Database Integration Tests', () => {
  beforeEach(() => {
    setupSupabaseMocks();
  });

  describe('Supabase Connection', () => {
    it('should connect to Supabase successfully', async () => {
      // Arrange
      mockSupabaseClient.select.mockResolvedValueOnce({ data: [], error: null });

      // Act
      const { data, error } = await createClient('url', 'key')
        .from('auth_users')
        .select('*')
        .limit(1);

      // Assert
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expectSupabaseQuery('auth_users', 'select');
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const invalidClient = createClient('invalid-url', 'invalid-key');
      mockSupabaseClient.select.mockResolvedValueOnce({ data: null, error: new Error('Auth error') });

      // Act
      const { error } = await invalidClient.from('auth_users').select('*');

      // Assert
      expect(error).not.toBeNull();
      expect(error.message).toBe('Auth error');
    });
  });

  describe('Drizzle Connection', () => {
    it('should connect to database through Drizzle', async () => {
      // Arrange
      mockDrizzleClient.select.mockResolvedValueOnce([]);

      // Act
      const result = await drizzle(mockPool as any).select().from('company').limit(1);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expectDrizzleQuery('company', 'select');
    });

    it('should perform CRUD operations with company data', async () => {
      // Arrange
      const drizzleInstance = drizzle(mockPool as any);
      mockDrizzleClient.insert.mockResolvedValueOnce([mockCompany]);
      mockDrizzleClient.select.mockResolvedValueOnce([mockCompany]);
      mockDrizzleClient.update.mockResolvedValueOnce([{ ...mockCompany, company_name: 'Updated Company' }]);
      mockDrizzleClient.delete.mockResolvedValueOnce([]);

      // Act & Assert - Create
      const [insertedCompany] = await drizzleInstance.insert('company').values(mockCompany).returning();
      expect(insertedCompany).toMatchObject(mockCompany);
      expectDrizzleQuery('company', 'insert');

      // Act & Assert - Read
      const [retrievedCompany] = await drizzleInstance
        .select()
        .from('company')
        .where(eq('company_id', mockCompany.company_id));
      expect(retrievedCompany).toMatchObject(mockCompany);
      expectDrizzleQuery('company', 'select');

      // Act & Assert - Update
      const [updatedCompany] = await drizzleInstance
        .update('company')
        .set({ company_name: 'Updated Company' })
        .where(eq('company_id', mockCompany.company_id))
        .returning();
      expect(updatedCompany.company_name).toBe('Updated Company');
      expectDrizzleQuery('company', 'update');

      // Act & Assert - Delete
      await drizzleInstance.delete('company').where(eq('company_id', mockCompany.company_id));
      expectDrizzleQuery('company', 'delete');
    });

    it('should handle transactions with related data', async () => {
      // Arrange
      const drizzleInstance = drizzle(mockPool as any);
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          insert: jest.fn().mockResolvedValueOnce([mockCompany]),
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockReturnThis(),
        };
        return callback(tx);
      });
      mockDrizzleClient.transaction.mockImplementation(mockTransaction);

      // Act
      await drizzleInstance.transaction(async (tx) => {
        const [company] = await tx.insert('company').values(mockCompany).returning();
        expect(company).toMatchObject(mockCompany);
      });

      // Assert
      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  describe('Data Relationships', () => {
    it('should handle company-user relationship', async () => {
      // Arrange
      const drizzleInstance = drizzle(mockPool as any);
      mockDrizzleClient.insert
        .mockResolvedValueOnce([mockCompany])
        .mockResolvedValueOnce([mockCompanyUser]);

      // Act
      const [company] = await drizzleInstance.insert('company').values(mockCompany).returning();
      const [companyUser] = await drizzleInstance
        .insert('company_user')
        .values({ ...mockCompanyUser, company_id: company.company_id })
        .returning();

      // Assert
      expect(companyUser.company_id).toBe(company.company_id);
    });

    it('should handle consent-data subject relationship', async () => {
      // Arrange
      const drizzleInstance = drizzle(mockPool as any);
      mockDrizzleClient.insert
        .mockResolvedValueOnce([mockDataSubject])
        .mockResolvedValueOnce([mockConsent]);

      // Act
      const [dataSubject] = await drizzleInstance.insert('data_subject').values(mockDataSubject).returning();
      const [consent] = await drizzleInstance
        .insert('consent')
        .values({ ...mockConsent, data_subject_id: dataSubject.data_subject_id })
        .returning();

      // Assert
      expect(consent.data_subject_id).toBe(dataSubject.data_subject_id);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'));

      // Act & Assert
      await expect(mockPool.connect()).rejects.toThrow('Connection failed');
    });

    it('should handle constraint violations', async () => {
      // Arrange
      const drizzleInstance = drizzle(mockPool as any);
      mockDrizzleClient.insert
        .mockResolvedValueOnce([mockCompany])
        .mockRejectedValueOnce(new Error('Unique constraint violation'));

      // Act
      await drizzleInstance.insert('company').values(mockCompany);

      // Assert
      await expect(
        drizzleInstance.insert('company').values(mockCompany)
      ).rejects.toThrow('Unique constraint violation');
    });
  });
}); 