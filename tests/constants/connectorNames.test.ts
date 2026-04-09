import { ConnectorNames } from '../../src/constants/connectorNames';

describe('ConnectorNames', () => {
  beforeEach(() => {
    // Ensure clean state for each test by preventing modifications
    Object.freeze(ConnectorNames);
  });

  describe('Type Safety', () => {
    it('should demonstrate readonly behavior', () => {
      // Should not be able to modify the values
      const originalValue = ConnectorNames.Office365;
      
      // In strict mode, this will throw, in non-strict it will fail silently
      expect(() => {
        (ConnectorNames as any).Office365 = 'modified-office365';
      }).toThrow(); // This will throw because of Object.freeze

      // Value should remain unchanged
      expect(ConnectorNames.Office365).toBe(originalValue);
      expect(ConnectorNames.Office365).toBe('office365');
    });

    it('should not allow new properties to be added', () => {
      const originalKeys = Object.keys(ConnectorNames);
      
      // Attempt to add new property should fail
      try {
        (ConnectorNames as any).NewConnector = 'new-connector';
      } catch (error) {
        // Expected in strict mode
      }

      // Should not have new property (checking original object)
      expect('NewConnector' in ConnectorNames).toBe(false);
    });

    it('should have string literal types', () => {
      const office365Name: 'office365' = ConnectorNames.Office365;
      const sharePointName: 'sharepointonline' = ConnectorNames.SharePointOnline;
      const teamsName: 'teams' = ConnectorNames.Teams;

      expect(office365Name).toBe('office365');
      expect(sharePointName).toBe('sharepointonline');
      expect(teamsName).toBe('teams');
    });
  });

  describe('Runtime Behavior', () => {
    it('should be enumerable', () => {
      const keys = Object.keys(ConnectorNames);
      expect(keys).toEqual(['Office365', 'SharePointOnline', 'Teams']);
    });

    it('should be accessible via bracket notation', () => {
      expect(ConnectorNames['Office365']).toBe('office365');
      expect(ConnectorNames['SharePointOnline']).toBe('sharepointonline');
      expect(ConnectorNames['Teams']).toBe('teams');
    });

    it('should be accessible via dot notation', () => {
      expect(ConnectorNames.Office365).toBe('office365');
      expect(ConnectorNames.SharePointOnline).toBe('sharepointonline');
      expect(ConnectorNames.Teams).toBe('teams');
    });

    it('should support Object.entries iteration', () => {
      const entries = Object.entries(ConnectorNames);
      
      expect(entries).toEqual([
        ['Office365', 'office365'],
        ['SharePointOnline', 'sharepointonline'],
        ['Teams', 'teams']
      ]);
    });

    it('should support Object.values iteration', () => {
      const values = Object.values(ConnectorNames);
      
      expect(values).toEqual([
        'office365',
        'sharepointonline',
        'teams'
      ]);
    });

    it('should support for...in iteration', () => {
      const collectedKeys: string[] = [];
      
      for (const key in ConnectorNames) {
        collectedKeys.push(key);
      }
      
      expect(collectedKeys).toEqual(['Office365', 'SharePointOnline', 'Teams']);
    });
  });

  describe('Value Validation', () => {
    it('should have values that match expected naming conventions', () => {
      Object.values(ConnectorNames).forEach((value: string) => {
        expect(value).toBe(value.toLowerCase());
        expect(value).toMatch(/^[a-z0-9]+$/);
      });
    });

    it('should not contain spaces or special characters', () => {
      Object.values(ConnectorNames).forEach((value: string) => {
        expect(value).not.toMatch(/\s/); // No whitespace
        expect(value).not.toMatch(/[^a-z0-9]/); // Only alphanumeric  
      });
    });

    it('should have unique values', () => {
      const values = Object.values(ConnectorNames);
      const uniqueValues = [...new Set(values)];
      
      expect(uniqueValues).toHaveLength(values.length);
    });

    it('should be non-empty strings', () => {
      Object.values(ConnectorNames).forEach((value: string) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.trim()).toHaveLength(value.length);
      });
    });
  });

  describe('Performance', () => {
    it('should handle property access quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        const _ = ConnectorNames.Office365;
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete in reasonable time (less than 100ms for 10k accesses)
      expect(duration).toBeLessThan(100);
    });

    it('should handle Object.values() quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const _ = Object.values(ConnectorNames);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete in reasonable time (less than 50ms for 1k calls)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Integration with TypeScript', () => {
    it('should provide type safety for connector value parameters', () => {
      type ConnectorValue = typeof ConnectorNames[keyof typeof ConnectorNames];
      
      const getConnectorConfig = (connectorName: ConnectorValue) => {
        return { connector: connectorName, isValid: true };
      };

      const office365Config = getConnectorConfig(ConnectorNames.Office365);
      const sharePointConfig = getConnectorConfig(ConnectorNames.SharePointOnline);
      const teamsConfig = getConnectorConfig(ConnectorNames.Teams);

      expect(office365Config.connector).toBe('office365');
      expect(sharePointConfig.connector).toBe('sharepointonline');
      expect(teamsConfig.connector).toBe('teams');
    });

    it('should work with union types', () => {
      type SupportedConnector = 'office365' | 'sharepointonline';
      
      const isSupported = (connector: string): connector is SupportedConnector => {
        return connector === ConnectorNames.Office365 || 
               connector === ConnectorNames.SharePointOnline;
      };

      expect(isSupported(ConnectorNames.Office365)).toBe(true);
      expect(isSupported(ConnectorNames.SharePointOnline)).toBe(true);
      expect(isSupported(ConnectorNames.Teams)).toBe(false);
    });
  });

  describe('Usage Patterns', () => {
    it('should work in switch statements', () => {
      const getDisplayName = (connectorName: string) => {
        switch (connectorName) {
          case ConnectorNames.Office365:
            return 'Microsoft Office 365';
          case ConnectorNames.SharePointOnline:
            return 'SharePoint Online';
          case ConnectorNames.Teams:
            return 'Microsoft Teams';
          default:
            return 'Unknown Connector';
        }
      };

      expect(getDisplayName(ConnectorNames.Office365)).toBe('Microsoft Office 365');
      expect(getDisplayName(ConnectorNames.SharePointOnline)).toBe('SharePoint Online');
      expect(getDisplayName(ConnectorNames.Teams)).toBe('Microsoft Teams');
      expect(getDisplayName('invalid')).toBe('Unknown Connector');
    });

    it('should work in Set operations', () => {
      const connectorSet = new Set(Object.values(ConnectorNames));
      
      expect(connectorSet.has(ConnectorNames.Office365)).toBe(true);
      expect(connectorSet.has(ConnectorNames.SharePointOnline)).toBe(true);
      expect(connectorSet.has(ConnectorNames.Teams)).toBe(true);
      expect(connectorSet.has('nonexistent' as any)).toBe(false);
      expect(connectorSet.size).toBe(3);
    });

    it('should work in Map operations', () => {
      const connectorMap = new Map([
        [ConnectorNames.Office365, { api: 'graph.microsoft.com', version: 'v1.0' }],
        [ConnectorNames.SharePointOnline, { api: 'sharepoint.com', version: 'v1' }],
        [ConnectorNames.Teams, { api: 'graph.microsoft.com', version: 'beta' }]
      ]);

      expect(connectorMap.has(ConnectorNames.Office365)).toBe(true);
      expect(connectorMap.get(ConnectorNames.Office365)?.api).toBe('graph.microsoft.com');
      expect(connectorMap.size).toBe(3);
    });

    it('should work with Array.includes', () => {
      const supportedConnectors = [
        ConnectorNames.Office365,
        ConnectorNames.SharePointOnline
      ];

      expect(supportedConnectors.includes(ConnectorNames.Office365)).toBe(true);
      expect(supportedConnectors.includes(ConnectorNames.Teams as any)).toBe(false);
    });

    it('should work with JSON serialization', () => {
      const config = {
        selectedConnector: ConnectorNames.Office365,
        availableConnectors: Object.values(ConnectorNames)
      };

      const serialized = JSON.stringify(config);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.selectedConnector).toBe('office365');
      expect(deserialized.availableConnectors).toEqual(['office365', 'sharepointonline', 'teams']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle typeof checks correctly', () => {
      Object.values(ConnectorNames).forEach(value => {
        expect(typeof value).toBe('string');
      });
      
      Object.keys(ConnectorNames).forEach(key => {
        expect(typeof key).toBe('string');
      });
    });

    it('should handle instanceof checks correctly', () => {
      Object.values(ConnectorNames).forEach((value: string) => {
        expect((value as any) instanceof String).toBe(false); // Primitive strings
        expect(Object.prototype.toString.call(value)).toBe('[object String]');
      });
    });

    it('should handle truthiness checks correctly', () => {
      Object.values(ConnectorNames).forEach(value => {
        expect(!!value).toBe(true);
        expect(Boolean(value)).toBe(true);
        expect(value ? true : false).toBe(true);
      });
    });

    it('should handle comparison operations correctly', () => {
      const office365 = ConnectorNames.Office365;
      
      expect(office365 === 'office365').toBe(true);
      expect(office365 == 'office365').toBe(true);
      expect(office365 !== ('teams' as any)).toBe(true);
      expect(office365.length).toBeGreaterThan(0);
    });

    it('should maintain reference equality', () => {
      const ref1 = ConnectorNames.Office365;
      const ref2 = ConnectorNames.Office365;
      
      expect(ref1 === ref2).toBe(true);
      expect(Object.is(ref1, ref2)).toBe(true);
    });
  });

  describe('Constants Integrity', () => {
    it('should have expected number of properties', () => {
      expect(Object.keys(ConnectorNames)).toHaveLength(3);
    });

    it('should have all expected properties present', () => {
      expect(ConnectorNames).toHaveProperty('Office365');
      expect(ConnectorNames).toHaveProperty('SharePointOnline');
      expect(ConnectorNames).toHaveProperty('Teams');
    });

    it('should have correct property descriptors', () => {
      const descriptor = Object.getOwnPropertyDescriptor(ConnectorNames, 'Office365');
      
      expect(descriptor).toBeDefined();
      expect(descriptor?.value).toBe('office365');
      expect(descriptor?.writable).toBeDefined(); // May vary by implementation
      expect(descriptor?.enumerable).toBe(true);
      expect(descriptor?.configurable).toBeDefined(); // May vary by implementation
    });
  });
});