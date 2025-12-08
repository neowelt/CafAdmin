// API Client for external Lambda endpoints

const COLLECTIONS_API_BASE_URL = process.env.COLLECTIONS_API_BASE_URL || 'https://93cniuwf3h.execute-api.eu-north-1.amazonaws.com/production';
const ADMIN_API_BASE_URL = process.env.ADMIN_API_BASE_URL || 'https://frir8eg1ah.execute-api.eu-north-1.amazonaws.com/production';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

export class ExternalApiClient {
  /**
   * Fetch all designs from admin API
   * Endpoint: GET /admin/designs
   */
  static async fetchDesigns() {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch designs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching designs from admin API:', error);
      throw error;
    }
  }

  /**
   * Fetch single design by ID from admin API
   * Endpoint: GET /admin/designs/{id}
   */
  static async fetchDesignById(id: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch design: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching design from admin API:', error);
      throw error;
    }
  }

  /**
   * Fetch all collections from external API
   * Endpoint: GET /collections
   */
  static async fetchCollections(includeInactive = false) {
    try {
      const url = new URL(`${COLLECTIONS_API_BASE_URL}/collections`);
      if (includeInactive) {
        url.searchParams.append('includeInactive', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching collections from external API:', error);
      throw error;
    }
  }

  /**
   * Fetch collection with designs
   */
  static async fetchCollectionWithDesigns(slug: string) {
    try {
      const response = await fetch(`${COLLECTIONS_API_BASE_URL}/collections/${slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collection: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching collection from external API:', error);
      throw error;
    }
  }

  /**
   * Fetch all orders from external API with pagination
   */
  static async fetchOrders(skip: number = 0, limit: number = 100) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/orders?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders from external API:', error);
      throw error;
    }
  }

  /**
   * Complete an order
   */
  static async completeOrder(orderId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/orders/admin/${orderId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to complete order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  }

  /**
   * Create a new design via admin API
   */
  static async createDesign(designData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(designData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create design: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating design:', error);
      throw error;
    }
  }

  /**
   * Update a design via admin API
   */
  static async updateDesign(designId: string, designData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs/${designId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(designData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update design: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating design:', error);
      throw error;
    }
  }

  /**
   * Delete a design via admin API
   */
  static async deleteDesign(designId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs/${designId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete design: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting design:', error);
      throw error;
    }
  }

  // ==================== Partner Methods ====================

  /**
   * Fetch all partners from admin API
   */
  static async fetchPartners() {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch partners: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching partners from admin API:', error);
      throw error;
    }
  }

  /**
   * Fetch a partner by ID from admin API
   */
  static async fetchPartnerById(partnerId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners/${partnerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch partner: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching partner from admin API:', error);
      throw error;
    }
  }

  /**
   * Create a new partner via admin API
   */
  static async createPartner(partnerData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(partnerData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create partner: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }
  }

  /**
   * Update a partner via admin API
   */
  static async updatePartner(partnerId: string, partnerData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(partnerData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update partner: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  /**
   * Delete a partner via admin API
   */
  static async deletePartner(partnerId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners/${partnerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete partner: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting partner:', error);
      throw error;
    }
  }
}
